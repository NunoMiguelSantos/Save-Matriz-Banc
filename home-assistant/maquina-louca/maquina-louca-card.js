// maquina-louca-card v1.2 — controlo da máquina da louça (Home Connect Alt)
const MLC_VERSION = "1.2.0";
const MLC = {
  blue: "#64A0FF", teal: "#65D8DE", green: "#4ADE80", amber: "#FBBF24", red: "#F87171", purple: "#A78BFA",
  muted: "rgba(255,255,255,0.58)", faint: "rgba(255,255,255,0.10)",
};

const ESTADOS = {
  inactive: { t: "Em repouso", c: MLC.muted, i: "mdi:power-sleep" },
  ready: { t: "Pronta", c: MLC.blue, i: "mdi:dishwasher" },
  delayedstart: { t: "Início agendado", c: MLC.purple, i: "mdi:timer-sand" },
  run: { t: "A lavar", c: MLC.teal, i: "mdi:dishwasher" },
  pause: { t: "Em pausa", c: MLC.amber, i: "mdi:pause-circle-outline" },
  actionrequired: { t: "Precisa de atenção", c: MLC.red, i: "mdi:alert-circle-outline" },
  finished: { t: "Terminou", c: MLC.green, i: "mdi:check-circle-outline" },
  error: { t: "Erro", c: MLC.red, i: "mdi:alert-octagon-outline" },
  aborting: { t: "A cancelar", c: MLC.amber, i: "mdi:close-circle-outline" },
  offline: { t: "Sem ligação", c: MLC.muted, i: "mdi:wifi-off" },
};

const PROGRAMAS = {
  eco50: { n: "Eco 50°", d: "O mais económico", i: "mdi:leaf" },
  auto1: { n: "Auto 35–45°", d: "Loiça delicada", i: "mdi:auto-fix" },
  auto2: { n: "Auto 45–65°", d: "Ajusta-se à sujidade", i: "mdi:auto-fix" },
  auto3: { n: "Auto 65–75°", d: "Sujidade forte", i: "mdi:auto-fix" },
  intensiv70: { n: "Intensivo 70°", d: "Tachos e sujidade difícil", i: "mdi:pot-steam-outline" },
  intensive70: { n: "Intensivo 70°", d: "Tachos e sujidade difícil", i: "mdi:pot-steam-outline" },
  quick45: { n: "Rápido 45°", d: "Pouco suja, mais rápido", i: "mdi:flash-outline" },
  quick65: { n: "Rápido 65°", d: "Pouco suja, mais rápido", i: "mdi:flash-outline" },
  glas40: { n: "Vidros 40°", d: "Copos e loiça delicada", i: "mdi:glass-wine" },
  glass40: { n: "Vidros 40°", d: "Copos e loiça delicada", i: "mdi:glass-wine" },
  nightwash: { n: "Silencioso", d: "Para a noite", i: "mdi:weather-night" },
  silence50: { n: "Silencioso 50°", d: "Para a noite", i: "mdi:weather-night" },
  prerinse: { n: "Pré-lavagem", d: "Enxaguar enquanto enche", i: "mdi:water-outline" },
  machinecare: { n: "Limpeza", d: "Manutenção, sem loiça", i: "mdi:spray-bottle" },
};

const OPCOES = [
  { k: "extradry", n: "Secagem extra", i: "mdi:weather-sunny" },
  { k: "halfload", n: "Meia carga", i: "mdi:circle-half-full" },
  { k: "hygieneplus", n: "Higiene+", i: "mdi:shield-check-outline" },
  { k: "variospeedplus", n: "Speed+", i: "mdi:fast-forward-outline" },
  { k: "silenceondemand", n: "Silêncio", i: "mdi:volume-off" },
];

const keyOf = (s) => String(s || "").split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const hm = (d) => d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
const dur = (min) => {
  min = Math.max(0, Math.round(min));
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h} h ${String(m).padStart(2, "0")} min` : `${m} min`;
};
const ago = (d) => {
  const min = (Date.now() - d) / 60000;
  if (min < 1) return "agora mesmo";
  if (min < 60) return `há ${Math.round(min)} min`;
  if (min < 1440) return `há ${Math.round(min / 60)} h`;
  const dias = Math.round(min / 1440);
  return dias === 1 ? "ontem" : `há ${dias} dias`;
};
const eur = (v) => (isFinite(v) ? v : 0).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const kwh = (v) => (isFinite(v) ? v : 0).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " kWh";

class MaquinaLoucaCard extends HTMLElement {
  setConfig(config) {
    const p = (config && config.prefix) || "405010538233010720";
    this._c = Object.assign({
      estado: `sensor.${p}_bsh_common_status_operationstate`,
      porta: `binary_sensor.${p}_bsh_common_status_doorstate`,
      ligada: `binary_sensor.${p}_connected`,
      remoto: `binary_sensor.${p}_bsh_common_status_remotecontrolstartallowed`,
      programa: `select.${p}_programs`,
      programa_ativo: `sensor.${p}_active_program`,
      progresso: `sensor.${p}_bsh_common_option_programprogress`,
      fim: `sensor.${p}_bsh_common_option_remainingprogramtime`,
      atraso: `select.${p}_bsh_common_option_startinrelative`,
      energia: `sensor.${p}_bsh_common_option_energyforecast`,
      agua: `sensor.${p}_bsh_common_option_waterforecast`,
      start: `button.${p}_start_pause`,
      stop: `button.${p}_stop`,
      power: `switch.${p}_bsh_common_setting_powerstate`,
      opcao: (k) => `switch.${p}_dishcare_dishwasher_option_${k}`,
      ultimo: "input_number.lavar_louca_ultimo_ciclo",
      ciclos: "counter.lavar_louca_ciclos_mes",
      kwh_ciclos: "input_number.lavar_louca_kwh_ciclos_mes",
      preco: "input_number.preco_energia",
      // o atraso fica num helper do HA: a máquina ignora o select de atraso enquanto está em standby,
      // por isso o atraso é enviado no próprio arranque (home_connect_alt.start_program)
      atraso_helper: "input_number.lavar_louca_atraso",
      device_id: (config && config.prefix) ? null : "b36bbc961e1242aac34d3d837cceaddc",
    }, config || {});
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._confirmStop = 0;
  }

  set hass(h) {
    this._h = h;
    const c = this._c;
    const ids = [c.estado, c.porta, c.ligada, c.remoto, c.programa, c.programa_ativo, c.progresso, c.fim, c.atraso,
      c.energia, c.agua, c.start, c.stop, c.power, c.ultimo, c.ciclos, c.kwh_ciclos, c.preco, c.atraso_helper, ...OPCOES.map((o) => c.opcao(o.k))];
    const sig = ids.map((e) => { const s = h.states[e]; return s ? s.state + s.last_changed : "-"; }).join("|");
    if (sig !== this._sig) { this._sig = sig; this._render(); }
    if (!this._tick) this._tick = setInterval(() => this._render(), 30000); // atualiza "faltam X"
  }

  disconnectedCallback() { clearInterval(this._tick); this._tick = null; }
  getCardSize() { return 8; }
  getGridOptions() { return { columns: "full", rows: "auto" }; }

  st(e) { return this._h.states[e]; }
  val(e) { return this.st(e)?.state; }
  ok(e) { const v = this.val(e); return v !== undefined && v !== "unavailable" && v !== "unknown"; }
  call(domain, service, data) { this._h.callService(domain, service, data); }

  // minutos de atraso escolhidos (helper partilhado entre tablet e telemóvel)
  _delayMin() {
    const v = parseFloat(this.val(this._c.atraso_helper));
    if (isFinite(v)) return v;
    const [hh, mm] = (this.val(this._c.atraso) || "0:00").split(":").map(Number);
    return (hh || 0) * 60 + (mm || 0);
  }

  _setDelay(min) {
    min = Math.max(0, Math.min(1440, min));
    if (this.st(this._c.atraso_helper)) this.call("input_number", "set_value", { entity_id: this._c.atraso_helper, value: min });
  }

  _deviceId() {
    return this._c.device_id || this._h.entities?.[this._c.programa]?.device_id || null;
  }

  async _start() {
    const c = this._c, min = this._delayMin(), dev = this._deviceId();
    this._erro = null;
    try {
      if (min > 0 && dev) {
        await this._h.callService("home_connect_alt", "start_program", {
          device_id: dev,
          program_key: this.val(c.programa),
          options: [{ key: "BSH.Common.Option.StartInRelative", value: Math.round(min * 60) }],
        });
        if (this.st(c.atraso_helper)) this.call("input_number", "set_value", { entity_id: c.atraso_helper, value: 0 });
      } else {
        await this._h.callService("button", "press", { entity_id: c.start });
      }
    } catch (e) {
      this._erro = `Não foi possível iniciar: ${e?.message || e}`;
      setTimeout(() => { this._erro = null; this._render(); }, 15000);
      this._render();
    }
  }

  _estado() {
    const c = this._c;
    if (!this.ok(c.estado) || this.val(c.ligada) === "off") return "offline";
    const k = keyOf(this.val(c.estado));
    return ESTADOS[k] ? k : "ready";
  }

  _prog(raw) {
    const k = keyOf(raw);
    return PROGRAMAS[k] || { n: String(raw || "").split(".").pop() || "—", d: "", i: "mdi:dishwasher" };
  }

  // ---------- partes ----------
  _hero(e) {
    const c = this._c, E = ESTADOS[e];
    const corre = ["run", "pause", "aborting"].includes(e);
    const pct = corre && this.ok(c.progresso) ? Math.min(100, Math.max(0, parseFloat(this.val(c.progresso)))) : (e === "finished" ? 100 : 0);
    const fimTs = this.ok(c.fim) ? new Date(this.val(c.fim)) : null;
    const progAtivo = this.ok(c.programa_ativo) ? this.val(c.programa_ativo) : this.val(c.programa);
    const P = this._prog(progAtivo);
    const R = 74, L = 2 * Math.PI * R;
    let linha1 = "", linha2 = "";
    if (corre && fimTs && fimTs > new Date()) {
      linha1 = `Faltam <b>${dur((fimTs - Date.now()) / 60000)}</b>`;
      linha2 = `Termina às ${hm(fimTs)}`;
    } else if (e === "delayedstart") {
      const atr = this.val(c.atraso) || "0:00";
      const [hh, mm] = atr.split(":").map(Number);
      const desde = new Date(this.st(c.estado).last_changed);
      const ini = new Date(+desde + ((hh || 0) * 60 + (mm || 0)) * 60000);
      if ((hh || 0) + (mm || 0) > 0) {
        linha1 = `Começa às <b>${hm(ini)}</b>`;
        linha2 = ini > new Date() ? `daqui a ${dur((ini - Date.now()) / 60000)}` : "";
      } else {
        linha1 = "A máquina vai arrancar sozinha à hora marcada";
      }
    } else if (e === "finished") {
      const t = new Date(this.st(c.estado).last_changed);
      linha1 = `Terminou às <b>${hm(t)}</b>`;
      linha2 = this.val(c.porta) === "on" ? "Porta aberta: a loiça está a arejar" : "Abre a porta para a loiça arejar";
    } else if (e === "ready" || e === "inactive") {
      linha1 = `Programa: <b>${esc(P.n)}</b>`;
      linha2 = P.d;
    } else if (e === "actionrequired") {
      linha1 = "Verifica a máquina"; linha2 = "Pode faltar sal, abrilhantador, ou a porta estar mal fechada";
    } else if (e === "offline") {
      linha1 = "A máquina não está a comunicar"; linha2 = "Verifica se está ligada à corrente e ao Wi-Fi";
    }
    const chips = [];
    const porta = this.val(c.porta);
    if (porta) chips.push(porta === "on" ? { i: "mdi:door-open", t: "Porta aberta", c: MLC.amber } : { i: "mdi:door-closed", t: "Porta fechada", c: MLC.green });
    const rem = this.val(c.remoto);
    if (rem) chips.push(rem === "on" ? { i: "mdi:cellphone-check", t: "Arranque remoto", c: MLC.green } : { i: "mdi:cellphone-remove", t: "Sem arranque remoto", c: MLC.muted });
    chips.push(this.val(c.ligada) === "on" ? { i: "mdi:wifi", t: "Ligada", c: MLC.green } : { i: "mdi:wifi-off", t: "Desligada", c: MLC.red });
    return `
      <div class="hero" style="--c:${E.c}">
        <div class="ring ${e === "run" ? "spin" : ""}">
          <svg viewBox="0 0 170 170">
            <circle cx="85" cy="85" r="${R}" class="trk"/>
            <circle cx="85" cy="85" r="${R}" class="val" style="stroke-dasharray:${L};stroke-dashoffset:${L * (1 - pct / 100)}"/>
          </svg>
          <div class="ri"><ha-icon icon="${corre || e === "finished" ? P.i : E.i}"></ha-icon>
            ${corre ? `<div class="pct">${Math.round(pct)}%</div>` : ""}
          </div>
        </div>
        <div class="ht">
          <div class="estado">${E.t}</div>
          ${corre ? `<div class="prog">${esc(P.n)}</div>` : ""}
          <div class="l1">${linha1}</div>
          ${linha2 ? `<div class="l2">${esc(linha2)}</div>` : ""}
          <div class="chips">${chips.map((x) => `<span class="chip" style="--c:${x.c}"><ha-icon icon="${x.i}"></ha-icon>${x.t}</span>`).join("")}</div>
        </div>
      </div>`;
  }

  _acoes(e) {
    const c = this._c;
    const porta = this.val(c.porta) === "on", remoto = this.val(c.remoto) !== "off";
    const P = this._prog(this.val(c.programa));
    const atr = this._delayMin();
    const btn = (id, txt, icon, cls = "", dis = false) => `<button class="act ${cls}" data-a="${id}" ${dis ? "disabled" : ""}><ha-icon icon="${icon}"></ha-icon>${txt}</button>`;
    let aviso = "", bts = "";
    if (e === "ready" || e === "inactive" || e === "finished") {
      const pode = !porta && remoto && this.ok(c.start);
      const label = atr > 0 ? `Agendar ${esc(P.n)}` : `Iniciar ${esc(P.n)}`;
      bts = btn("start", label, "mdi:play", "primary", !pode);
      if (porta) aviso = "Fecha a porta para poderes iniciar.";
      else if (!remoto) aviso = "Ativa o arranque remoto na máquina (botão Remote Start) para iniciar daqui.";
    } else if (e === "run") {
      bts = btn("start", "Pausar", "mdi:pause", "warn") + btn("stop", this._confirmStop > Date.now() ? "Toca outra vez para cancelar" : "Cancelar", "mdi:stop", "danger");
    } else if (e === "pause") {
      bts = btn("start", "Retomar", "mdi:play", "primary", porta) + btn("stop", this._confirmStop > Date.now() ? "Toca outra vez para cancelar" : "Cancelar", "mdi:stop", "danger");
      if (porta) aviso = "Fecha a porta para retomar.";
    } else if (e === "delayedstart") {
      bts = btn("stop", this._confirmStop > Date.now() ? "Toca outra vez para cancelar" : "Cancelar agendamento", "mdi:timer-off-outline", "danger");
    } else if (e === "offline") {
      aviso = "Os controlos voltam quando a máquina estiver ligada.";
    }
    if (this._erro) aviso = esc(this._erro);
    return `<div class="acts">${bts}</div>${aviso ? `<div class="aviso"><ha-icon icon="mdi:information-outline"></ha-icon>${aviso}</div>` : ""}`;
  }

  _programas(bloq) {
    const c = this._c, s = this.st(c.programa);
    if (!s) return "";
    const atual = s.state;
    const ops = (s.attributes.options || []);
    return `
      <div class="sec"><div class="st"><ha-icon icon="mdi:format-list-bulleted"></ha-icon>Programa</div>
        <div class="progs">${ops.map((o) => {
          const P = this._prog(o);
          return `<button class="pg ${o === atual ? "on" : ""}" data-prog="${esc(o)}" ${bloq ? "disabled" : ""}>
            <ha-icon icon="${P.i}"></ha-icon><span class="pn">${esc(P.n)}</span><span class="pd">${esc(P.d)}</span></button>`;
        }).join("")}</div>
      </div>`;
  }

  _opcoes(bloq) {
    const c = this._c;
    const lst = OPCOES.filter((o) => this.st(c.opcao(o.k)) && this.val(c.opcao(o.k)) !== "unavailable");
    if (!lst.length) return "";
    return `
      <div class="sec"><div class="st"><ha-icon icon="mdi:tune-variant"></ha-icon>Opções</div>
        <div class="ops">${lst.map((o) => {
          const on = this.val(c.opcao(o.k)) === "on";
          return `<button class="op ${on ? "on" : ""}" data-op="${c.opcao(o.k)}" ${bloq ? "disabled" : ""}><ha-icon icon="${o.i}"></ha-icon>${o.n}<span class="sw"></span></button>`;
        }).join("")}</div>
      </div>`;
  }

  _atraso(bloq) {
    const c = this._c;
    if (!this.st(c.atraso_helper) && !this.st(c.atraso)) return "";
    const min = this._delayMin();
    const ini = new Date(Date.now() + min * 60000);
    const txt = min === 0 ? "Começa logo que carregares em Iniciar" : `Começa às <b>${hm(ini)}</b> (daqui a ${dur(min)})`;
    return `
      <div class="sec"><div class="st"><ha-icon icon="mdi:timer-outline"></ha-icon>Início diferido</div>
        <div class="delay">
          <button class="rnd" data-delay="${min - 30}" ${bloq || min <= 0 ? "disabled" : ""}><ha-icon icon="mdi:minus"></ha-icon></button>
          <div class="dv"><div class="dval">${min === 0 ? "Agora" : dur(min)}</div><div class="dtx">${txt}</div></div>
          <button class="rnd" data-delay="${min + 30}" ${bloq || min >= 1440 ? "disabled" : ""}><ha-icon icon="mdi:plus"></ha-icon></button>
        </div>
        <div class="quick">${[0, 60, 120, 240, 360, 480].map((m) =>
          `<button class="q ${m === min ? "on" : ""}" data-delay="${m}" ${bloq ? "disabled" : ""}>${m === 0 ? "Agora" : "+" + m / 60 + " h"}</button>`).join("")}</div>
      </div>`;
  }

  _previsao() {
    const c = this._c;
    const bar = (lbl, icon, v, col) => isFinite(v) ? `<div class="fc"><ha-icon icon="${icon}"></ha-icon><span>${lbl}</span><div class="fb"><div style="width:${Math.min(100, v)}%;background:${col}"></div></div><b>${Math.round(v)}%</b></div>` : "";
    const en = parseFloat(this.val(c.energia)), ag = parseFloat(this.val(c.agua));
    if (!isFinite(en) && !isFinite(ag)) return "";
    return `<div class="sec"><div class="st"><ha-icon icon="mdi:gauge"></ha-icon>Consumo previsto do programa</div>
      ${bar("Energia", "mdi:lightning-bolt", en, MLC.amber)}${bar("Água", "mdi:water", ag, MLC.blue)}
      <div class="nota">Percentagem face ao programa que mais gasta.</div></div>`;
  }

  _custos() {
    const c = this._c, p = parseFloat(this.val(c.preco)) || 0;
    const ult = parseFloat(this.val(c.ultimo)), n = parseFloat(this.val(c.ciclos)), km = parseFloat(this.val(c.kwh_ciclos));
    if (!this.st(c.ultimo)) return "";
    const quando = ult > 0 ? ago(new Date(this.st(c.ultimo).last_changed)) : "";
    const item = (t, v, s) => `<div class="kv"><span>${t}</span><b>${v}</b>${s ? `<small>${s}</small>` : ""}</div>`;
    return `<div class="sec"><div class="st"><ha-icon icon="mdi:cash"></ha-icon>Custos</div><div class="kvs">
      ${item("Último ciclo", ult > 0 ? eur(ult * p) : "—", ult > 0 ? `${kwh(ult)} · ${quando}` : "ainda sem registo")}
      ${item("Ciclos este mês", isFinite(n) ? n : 0, "")}
      ${item("Média por ciclo", n > 0 ? eur((km / n) * p) : "—", n > 0 ? kwh(km / n) : "")}
      ${item("Total do mês", eur((km || 0) * p), "")}
    </div></div>`;
  }

  _resumoCiclo(e) {
    const c = this._c;
    const prog = this.ok(c.programa_ativo) ? this.val(c.programa_ativo) : this.val(c.programa);
    const P = this._prog(prog);
    const ops = OPCOES.filter((o) => this.val(c.opcao(o.k)) === "on");
    const msg = e === "offline" ? "Os controlos voltam quando a máquina estiver ligada."
      : "Programa e opções só podem ser alterados quando a máquina terminar ou for cancelada.";
    return `<div class="sec"><div class="st"><ha-icon icon="mdi:information-outline"></ha-icon>Este ciclo</div>
      <div class="cy"><ha-icon icon="${P.i}"></ha-icon><div><div class="pn">${esc(P.n)}</div><div class="pd">${esc(P.d)}</div></div></div>
      <div class="cyo">${ops.length ? ops.map((o) => `<span class="chip" style="--c:${MLC.teal}"><ha-icon icon="${o.i}"></ha-icon>${o.n}</span>`).join("") : `<span class="pd">Sem opções extra</span>`}</div>
      <div class="lock"><ha-icon icon="mdi:lock-outline"></ha-icon>${msg}</div></div>`;
  }

  _render() {
    if (!this._h || !this.shadowRoot) return;
    const e = this._estado();
    const bloq = ["run", "pause", "delayedstart", "aborting", "offline"].includes(e);
    this.shadowRoot.innerHTML = `<style>${MaquinaLoucaCard.css}</style>
      <ha-card>
        <div class="grid">
          <div class="a">${this._hero(e)}${this._acoes(e)}</div>
          <div class="b">${bloq ? this._resumoCiclo(e) + this._custos() : this._programas(false) + this._opcoes(false) + this._atraso(false)}</div>
          <div class="c">${bloq ? this._previsao() : this._previsao() + this._custos()}</div>
        </div>
      </ha-card>`;
    const R = this.shadowRoot, c = this._c;
    R.querySelectorAll("[data-prog]").forEach((b) => b.addEventListener("click", () => this.call("select", "select_option", { entity_id: c.programa, option: b.dataset.prog })));
    R.querySelectorAll("[data-op]").forEach((b) => b.addEventListener("click", () => this.call("switch", "toggle", { entity_id: b.dataset.op })));
    R.querySelectorAll("[data-delay]").forEach((b) => b.addEventListener("click", () => this._setDelay(+b.dataset.delay)));
    R.querySelectorAll("[data-a]").forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.a === "start") this._start();
      if (b.dataset.a === "stop") {
        if (this._confirmStop > Date.now()) {
          this._confirmStop = 0;
          const dev = this._deviceId();
          if (dev) this.call("home_connect_alt", "stop_program", { device_id: dev });
          else this.call("button", "press", { entity_id: c.stop });
        }
        else { this._confirmStop = Date.now() + 4000; setTimeout(() => this._render(), 4100); }
        this._render();
      }
    }));
  }

  static get css() {
    return `
      :host { display:block; container-type:inline-size; }
      ha-card { background: rgba(0,0,0,0.24); border:1px solid rgba(255,255,255,0.15); border-radius:20px; box-shadow:none; padding:16px; color:#fff; }
      ha-icon { --mdc-icon-size:18px; }
      .grid { display:grid; grid-template-columns:1fr; grid-template-areas: "a" "b" "c"; gap:14px; }
      @container (min-width: 760px) { .grid { grid-template-columns: minmax(320px, 1fr) minmax(360px, 1.25fr); grid-template-areas: "a b" "c b"; grid-template-rows: auto 1fr; column-gap:22px; } }
      .a { grid-area:a; } .b { grid-area:b; } .c { grid-area:c; align-self:start; }
      .a, .b, .c { display:flex; flex-direction:column; gap:14px; min-width:0; }
      .b { align-self:start; }
      .cy { display:flex; align-items:center; gap:12px; }
      .cy ha-icon { --mdc-icon-size:34px; color:${MLC.teal}; }
      .cy .pn { font-size:17px; font-weight:650; } .pd { font-size:12px; color:${MLC.muted}; }
      .cyo { display:flex; flex-wrap:wrap; gap:6px; margin:12px 0; }
      .hero { display:flex; gap:18px; align-items:center; padding:14px; border-radius:18px;
        background: linear-gradient(135deg, color-mix(in srgb, var(--c) 16%, transparent), rgba(255,255,255,0.02));
        border:1px solid color-mix(in srgb, var(--c) 35%, transparent); }
      .ring { position:relative; width:150px; height:150px; flex:none; }
      .ring svg { width:100%; height:100%; transform:rotate(-90deg); }
      .trk { fill:none; stroke:${MLC.faint}; stroke-width:10; }
      .val { fill:none; stroke:var(--c); stroke-width:10; stroke-linecap:round; transition: stroke-dashoffset .8s ease; }
      .ri { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
      .ri ha-icon { --mdc-icon-size:52px; color:var(--c); }
      .spin .ri ha-icon { animation: bob 2.4s ease-in-out infinite; }
      @keyframes bob { 50% { transform: translateY(-4px); } }
      .pct { font-size:20px; font-weight:700; margin-top:2px; }
      .ht { min-width:0; }
      .estado { font-size:26px; font-weight:750; color:var(--c); line-height:1.1; }
      .prog { font-size:14px; color:${MLC.muted}; margin-top:2px; }
      .l1 { font-size:16px; margin-top:8px; }
      .l2 { font-size:13px; color:${MLC.muted}; margin-top:2px; }
      .chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
      .chip { display:inline-flex; align-items:center; gap:4px; font-size:11.5px; padding:3px 8px; border-radius:999px;
        color:var(--c); background: color-mix(in srgb, var(--c) 12%, transparent); border:1px solid color-mix(in srgb, var(--c) 30%, transparent); }
      .chip ha-icon { --mdc-icon-size:14px; }
      .acts { display:flex; gap:10px; flex-wrap:wrap; }
      .act { flex:1; min-width:150px; display:flex; align-items:center; justify-content:center; gap:8px; font:inherit; font-size:16px; font-weight:650;
        padding:16px; border-radius:16px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color:#fff; cursor:pointer; }
      .act ha-icon { --mdc-icon-size:22px; }
      .act.primary { background: linear-gradient(135deg, ${MLC.blue}, #3B82F6); border-color: transparent; }
      .act.warn { background: color-mix(in srgb, ${MLC.amber} 22%, transparent); border-color: color-mix(in srgb, ${MLC.amber} 55%, transparent); }
      .act.danger { background: color-mix(in srgb, ${MLC.red} 16%, transparent); border-color: color-mix(in srgb, ${MLC.red} 45%, transparent); }
      .act:disabled { opacity:.38; cursor:not-allowed; }
      .aviso, .lock { display:flex; gap:8px; align-items:flex-start; font-size:13px; line-height:1.4; padding:10px 12px; border-radius:12px;
        background: rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.25); }
      .aviso ha-icon, .lock ha-icon { color:${MLC.amber}; flex:none; }
      .lock { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); color:${MLC.muted}; }
      .lock ha-icon { color:${MLC.muted}; }
      .sec { background: rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:12px; }
      .st { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:600; color:${MLC.muted}; margin-bottom:10px; text-transform:uppercase; letter-spacing:.04em; }
      .progs { display:grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap:8px; }
      .pg { display:flex; flex-direction:column; align-items:flex-start; gap:3px; text-align:left; font:inherit; color:#fff; padding:12px; border-radius:14px;
        background: rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.10); cursor:pointer; min-height:86px; }
      .pg ha-icon { --mdc-icon-size:24px; color:${MLC.teal}; margin-bottom:2px; }
      .pg .pn { font-size:14.5px; font-weight:650; }
      .pg .pd { font-size:11.5px; color:${MLC.muted}; line-height:1.3; }
      .pg.on { background: rgba(100,160,255,0.20); border-color: rgba(100,160,255,0.70); box-shadow: 0 0 0 1px rgba(100,160,255,0.35) inset; }
      .pg.on ha-icon { color:${MLC.blue}; }
      .ops { display:grid; grid-template-columns: repeat(auto-fill, minmax(165px, 1fr)); gap:8px; }
      .op { display:flex; align-items:center; gap:8px; font:inherit; font-size:14px; color:#fff; padding:12px; border-radius:14px; cursor:pointer;
        background: rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.10); }
      .op ha-icon { color:${MLC.muted}; }
      .op .sw { margin-left:auto; width:34px; height:20px; border-radius:999px; background: rgba(255,255,255,0.18); position:relative; flex:none; transition: background .2s; }
      .op .sw::after { content:""; position:absolute; top:3px; left:3px; width:14px; height:14px; border-radius:50%; background:#fff; transition: left .2s; }
      .op.on { border-color: rgba(101,216,222,0.55); background: rgba(101,216,222,0.12); }
      .op.on ha-icon { color:${MLC.teal}; }
      .op.on .sw { background:${MLC.teal}; }
      .op.on .sw::after { left:17px; }
      .pg:disabled, .op:disabled, .q:disabled, .rnd:disabled { opacity:.4; cursor:not-allowed; }
      .delay { display:flex; align-items:center; gap:12px; }
      .rnd { width:48px; height:48px; border-radius:50%; flex:none; display:grid; place-items:center; cursor:pointer; color:#fff;
        background: rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.14); }
      .rnd ha-icon { --mdc-icon-size:22px; }
      .dv { flex:1; text-align:center; }
      .dval { font-size:22px; font-weight:700; }
      .dtx { font-size:12.5px; color:${MLC.muted}; margin-top:2px; }
      .quick { display:flex; gap:6px; flex-wrap:wrap; margin-top:10px; justify-content:center; }
      .q { font:inherit; font-size:12.5px; color:#fff; padding:6px 12px; border-radius:999px; cursor:pointer;
        background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.10); }
      .q.on { background: rgba(167,139,250,0.22); border-color: rgba(167,139,250,0.6); }
      .fc { display:grid; grid-template-columns: 18px 60px 1fr 40px; align-items:center; gap:8px; font-size:13px; margin:6px 0; }
      .fc ha-icon { color:${MLC.muted}; }
      .fb { height:8px; border-radius:4px; background:${MLC.faint}; overflow:hidden; }
      .fb div { height:100%; border-radius:4px; }
      .fc b { text-align:right; }
      .nota { font-size:11px; color:${MLC.muted}; margin-top:4px; }
      .kvs { display:grid; grid-template-columns: 1fr 1fr; gap:10px 14px; }
      .kv { display:flex; flex-direction:column; }
      .kv span { font-size:11.5px; color:${MLC.muted}; }
      .kv b { font-size:17px; font-weight:650; }
      .kv small { font-size:11px; color:${MLC.muted}; }
      @container (max-width: 420px) { .ring { width:116px; height:116px; } .ri ha-icon { --mdc-icon-size:40px; } .estado { font-size:22px; } .hero { gap:12px; } }
    `;
  }
}

if (!customElements.get("maquina-louca-card")) customElements.define("maquina-louca-card", MaquinaLoucaCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "maquina-louca-card", name: "Máquina da louça", description: "Estado, programas, opções, início diferido e custos da máquina da louça (Home Connect)." });
console.info(`%c MAQUINA-LOUCA-CARD %c v${MLC_VERSION} `, "background:#65D8DE;color:#000", "");
