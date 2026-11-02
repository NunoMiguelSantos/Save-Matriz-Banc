// aquecimento-card v1.1 — caldeira e aquecimento por divisões, em português
// v1.1: cartão "Como funciona" com as regras (mínima de conforto e histerese) e janela "Ajustar"
// Um só cartão para o telemóvel e o tablet: `layout: telemovel` (uma coluna) ou `layout: tablet` (faixa + duas colunas).
// Lê e escreve os helpers do sistema "Aquecimento por divisões" (blueprints CenarioAquecimento, ZonaAquecimento, CaldeiraSimples).
const AQ_VERSION = "1.1.0";

const AQ_DEFAULT = {
  layout: "telemovel", // "telemovel" ou "tablet"
  caldeira: "switch.caldeira_caldeira",
  automatico: "input_boolean.cald_auto_mode",
  forcar: "input_boolean.cald_force_override",
  conforto: "input_number.cald_temp_setpoint_conforto",
  // histerese das zonas: pede calor a alvo − inferior e deixa de pedir a alvo + superior
  offset_inferior: "input_number.cald_offset_inferior",
  offset_superior: "input_number.cald_offset_superior",
  media: "sensor.temperatura_media_da_casa",
  cenarios: 6, // aq_cen1 … aq_cenN
  // id = parte do nome dos helpers (aq_<id>_setpoint, aq_<id>_pede_calor, aq_cenN_<id>)
  divisoes: [
    { id: "sala", nome: "Sala", icon: "mdi:sofa", temp: "sensor.sensorsalas_temperature" },
    { id: "cozinha", nome: "Cozinha", icon: "mdi:countertop", temp: "sensor.sensorcozinha_temperature" },
    { id: "suite", nome: "Suite", icon: "mdi:bed-king", temp: "sensor.esp_th_suite_temperatura" },
    { id: "quarto2", nome: "Quarto 2", icon: "mdi:baby-face-outline", temp: "sensor.sensorroom2_temperature" },
    { id: "gaming", nome: "Gaming", icon: "mdi:controller", temp: "sensor.sensorthescritorio_temperature" },
    { id: "wc_geral", nome: "WC Geral", icon: "mdi:bathtub", temp: "sensor.lumi_lumi_sens_temperature" },
    { id: "wc_suite", nome: "WC Suite", icon: "mdi:shower", temp: "sensor.sensorwcsuite_temperature" },
  ],
};

// Cores (muda aqui o código #RRGGBB)
const AQ = {
  teal: "#3CC8B4", cyan: "#65D8DE", heat: "#FF7841", amber: "#FBBF24", wait: "#6EAFE1", off: "#A0A0AA",
  green: "#4ADE80", red: "#F87171", setpoint: "#FF9933",
  muted: "rgba(255,255,255,0.58)", faint: "rgba(255,255,255,0.10)",
};
// Uma cor por cenário (1 a 6)
const AQ_CORES = ["#3CC8B4", "#A78BFA", "#64A0FF", "#F472B6", "#FBBF24", "#4ADE80"];

const AQ_DIAS = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
const AQ_DIA_L = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const AQ_HASH = "#aquecimento-cenario";

const aqNum = (v, d = NaN) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
const aqF1 = (v) => (Number.isFinite(v) ? v.toFixed(1).replace(".", ",") : "–");
const aqMin = (hm) => { const [h, m] = String(hm || "0:0").split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const aqHM = (s) => String(s || "00:00").slice(0, 5);
const aqEsc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

class AquecimentoCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._sig = "";
    this._open = null; // divisão aberta na lista
    this._edit = null; // cenário em edição (1..N)
    this._portal = null;
    this._pushed = false;
    this._typing = false;
    this._exAlvo = 21;
    this._onPop = () => {
      if (this._edit && location.hash !== AQ_HASH) {
        this._pushed = false;
        this._closeEd();
      }
    };
    this.shadowRoot.addEventListener("click", (e) => this._onClick(e));
  }

  setConfig(config) {
    this._cfg = { ...AQ_DEFAULT, ...(config || {}) };
    this._ids = null;
    this._sig = "";
  }
  static getStubConfig() { return {}; }
  getCardSize() { return 12; }
  getGridOptions() { return { columns: "full", rows: "auto" }; }

  connectedCallback() {
    this._timer = setInterval(() => this._render(), 60000);
    window.addEventListener("popstate", this._onPop);
    window.addEventListener("hashchange", this._onPop);
    window.addEventListener("location-changed", this._onPop);
  }
  disconnectedCallback() {
    clearInterval(this._timer);
    window.removeEventListener("popstate", this._onPop);
    window.removeEventListener("hashchange", this._onPop);
    window.removeEventListener("location-changed", this._onPop);
    this._pushed = false;
    this._closeEd();
  }

  set hass(hass) {
    this._hass = hass;
    const sig = this._signature();
    if (sig !== this._sig) {
      this._sig = sig;
      this._render();
    }
  }

  // ---------- dados ----------
  _c(n) { return `aq_cen${n}`; }
  _watch() {
    if (this._ids) return this._ids;
    const c = this._cfg;
    const ids = [c.caldeira, c.automatico, c.forcar, c.conforto, c.media, c.offset_inferior, c.offset_superior];
    c.divisoes.forEach((d) => ids.push(d.temp, `input_number.aq_${d.id}_setpoint`, `input_boolean.aq_${d.id}_pede_calor`));
    for (let n = 1; n <= c.cenarios; n++) {
      const p = this._c(n);
      ids.push(`input_boolean.${p}_ativo`, `input_boolean.${p}_a_decorrer`, `input_text.${p}_nome`, `input_datetime.${p}_inicio`, `input_datetime.${p}_fim`);
      AQ_DIAS.forEach((d) => ids.push(`input_boolean.${p}_${d}`));
      c.divisoes.forEach((d) => ids.push(`input_boolean.${p}_${d.id}`));
    }
    this._ids = ids;
    return ids;
  }
  _signature() {
    const s = this._hass?.states || {};
    return this._watch().map((id) => (s[id] ? s[id].state : "-")).join(";");
  }
  _st(id) { return this._hass?.states?.[id]; }
  _on(id) { return this._st(id)?.state === "on"; }
  _val(id) { return aqNum(this._st(id)?.state); }

  _cen(n) {
    const p = this._c(n);
    const nome = (this._st(`input_text.${p}_nome`)?.state || "").trim() || `Cenário ${n}`;
    const dias = {}, rooms = {};
    AQ_DIAS.forEach((d) => (dias[d] = this._on(`input_boolean.${p}_${d}`)));
    this._cfg.divisoes.forEach((d) => (rooms[d.id] = this._on(`input_boolean.${p}_${d.id}`)));
    return {
      n, nome, dias, rooms,
      ativo: this._on(`input_boolean.${p}_ativo`),
      run: this._on(`input_boolean.${p}_a_decorrer`),
      ini: aqHM(this._st(`input_datetime.${p}_inicio`)?.state),
      fim: aqHM(this._st(`input_datetime.${p}_fim`)?.state),
    };
  }
  _cens() {
    const out = [];
    for (let n = 1; n <= this._cfg.cenarios; n++) out.push(this._cen(n));
    return out;
  }
  // Alvo de uma divisão, igual à ZonaAquecimento: setpoint se marcada num cenário a decorrer, senão a mínima (nunca abaixo dela)
  _alvo(d, cens) {
    const conf = this._val(this._cfg.conforto);
    const c = cens.find((x) => x.run && x.rooms[d.id]);
    if (!c) return { v: conf, src: "mínima" };
    const sp = this._val(`input_number.aq_${d.id}_setpoint`);
    return { v: Number.isFinite(conf) ? Math.max(sp, conf) : sp, src: c.nome };
  }
  _estado() {
    const c = this._cfg, on = this._on(c.caldeira), forced = this._on(c.forcar), auto = this._on(c.automatico);
    if (on && forced) return { k: "force", t: "Forçado", c: AQ.amber, on };
    if (on) return { k: "heat", t: "A aquecer", c: AQ.heat, on };
    if (auto) return { k: "wait", t: "Em espera", c: AQ.wait, on };
    return { k: "off", t: "Inativo", c: AQ.off, on };
  }
  // Blocos de um dia na grelha (um horário que passa da meia-noite continua no dia seguinte)
  _blocos(dia, cens) {
    const out = [], prev = AQ_DIAS[(AQ_DIAS.indexOf(dia) + 6) % 7];
    cens.forEach((c) => {
      if (!c.ativo || c.ini === c.fim) return;
      const a = aqMin(c.ini), b = aqMin(c.fim);
      if (a < b) { if (c.dias[dia]) out.push({ c, s: a, e: b }); }
      else {
        if (c.dias[dia]) out.push({ c, s: a, e: 1440 });
        if (c.dias[prev]) out.push({ c, s: 0, e: b });
      }
    });
    return out;
  }

  // ---------- ações ----------
  _call(domain, service, data) { return this._hass.callService(domain, service, data); }
  _bool(id, on) { return this._call("input_boolean", on ? "turn_on" : "turn_off", { entity_id: id }); }
  _step(id, dir) {
    const o = this._st(id);
    if (!o) return;
    const a = o.attributes || {}, step = aqNum(a.step, 0.5);
    const v = Math.round((aqNum(o.state, 0) + dir * step) * 100) / 100;
    this._call("input_number", "set_value", { entity_id: id, value: Math.min(aqNum(a.max, 1e9), Math.max(aqNum(a.min, -1e9), v)) });
  }

  _onClick(e) {
    const t = e.target.closest?.("[data-a],[data-tog],[data-open],[data-room],[data-conf],[data-sp],[data-regras]");
    if (!t) return;
    const c = this._cfg;
    if (t.dataset.tog) {
      e.stopPropagation();
      const id = `input_boolean.${this._c(t.dataset.tog)}_ativo`;
      return this._bool(id, !this._on(id));
    }
    if (t.dataset.open) return this._openEd(Number(t.dataset.open));
    if ("regras" in t.dataset) return this._openEd("regras");
    if (t.dataset.room) { this._open = this._open === t.dataset.room ? null : t.dataset.room; return this._render(); }
    if (t.dataset.conf) return this._step(c.conforto, Number(t.dataset.conf));
    if (t.dataset.sp) return this._step(`input_number.aq_${t.dataset.sp}_setpoint`, Number(t.dataset.d));
    const a = t.dataset.a;
    if (a === "auto") this._bool(c.automatico, true);
    if (a === "manual") this._bool(c.automatico, false);
    if (a === "forcar") this._bool(c.forcar, !this._on(c.forcar));
  }

  // ---------- desenho ----------
  _render() {
    if (!this._hass || !this._cfg) return;
    const c = this._cfg, tablet = c.layout === "tablet";
    const cens = this._cens(), st = this._estado(), auto = this._on(c.automatico), forced = this._on(c.forcar);
    const pedem = c.divisoes.filter((d) => this._on(`input_boolean.aq_${d.id}_pede_calor`));
    const run = cens.filter((x) => x.run);
    const media = this._val(c.media), conf = this._val(c.conforto);
    const now = new Date(), nowM = now.getHours() * 60 + now.getMinutes(), hoje = AQ_DIAS[(now.getDay() + 6) % 7];

    const sub = (pedem.length ? `${pedem.length} de ${c.divisoes.length} divisões a pedir calor` : "Nenhuma divisão a pedir calor") +
      (run.length ? `<br>${aqEsc(run[0].nome)} até ${run[0].fim}` : "");
    const hint = auto
      ? (forced ? "Forçar está ligado: a caldeira fica ligada. Muda para Manual para o desligar."
        : "Auto: liga sozinha quando uma divisão fica abaixo do alvo. Forçar só em Manual.")
      : (forced ? "Forçada: fica ligada até desligares." : "Manual: a caldeira só liga se a forçares.");
    const bar = `<div class="bar" style="--c:${st.c}">
        <div class="flame"><ha-icon class="${st.on ? "pulse" : ""}" icon="mdi:fire"></ha-icon></div>
        <div class="bt"><div class="e">${st.t}</div><div class="s">${sub}</div></div>
        <div class="big"><b>${aqF1(media)}°</b><small>média casa</small></div>
        ${tablet ? `<div class="mcol">${this._modes(auto, forced)}<div class="hint">${hint}</div></div>` : ""}
      </div>`;
    const inf = this._val(c.offset_inferior), sup = this._val(c.offset_superior);
    const confBox = `<div class="reg">
        <div class="rh"><ha-icon icon="mdi:tune-variant"></ha-icon><b>Como funciona</b><button class="aj" data-regras><ha-icon icon="mdi:tune"></ha-icon>Ajustar</button></div>
        <div class="lin"><ha-icon icon="mdi:shield-home" style="color:${AQ.wait}"></ha-icon><span>Fora dos cenários, nenhuma divisão desce abaixo de <b class="v">${aqF1(conf)}°</b>.</span></div>
        <div class="lin"><ha-icon icon="mdi:swap-vertical" style="color:${AQ.amber}"></ha-icon><span>Cada divisão pede calor <b>${aqF1(inf)}°</b> abaixo do alvo e deixa de pedir <b>${aqF1(sup)}°</b> acima.</span></div>
      </div>`;

    // Semana
    const horas = tablet ? [0, 3, 6, 9, 12, 15, 18, 21, 24] : [0, 6, 12, 18, 24];
    const pct = (m) => (m / 1440 * 100).toFixed(2) + "%";
    let wk = `<span></span><div class="hrs">${horas.map((h) => `<span style="left:${h / 24 * 100}%">${String(h).padStart(2, "0")}h</span>`).join("")}</div>`;
    AQ_DIAS.forEach((d, k) => {
      const t = d === hoje;
      wk += `<span class="dl ${t ? "today" : ""}">${AQ_DIA_L[k]}</span><div class="ln ${t ? "today" : ""}"><div class="grid6"></div>` +
        this._blocos(d, cens).map((x) => `<button class="blk ${t && x.c.run ? "run" : ""}" data-open="${x.c.n}" style="--k:${AQ_CORES[(x.c.n - 1) % 6]};left:${pct(x.s)};width:${pct(x.e - x.s)}" aria-label="${aqEsc(x.c.nome)}">${tablet && x.e - x.s >= 120 ? `<b>${aqEsc(x.c.nome)}</b><small>${x.c.ini}–${x.c.fim}</small>` : ""}</button>`).join("") +
        (t ? `<div class="nowl" style="left:${pct(nowM)}"></div>` : "") + `</div>`;
    });
    const chips = cens.map((x) => `<div class="cc ${x.run ? "run" : x.ativo ? "" : "off"}" data-open="${x.n}" role="button" tabindex="0" style="--k:${AQ_CORES[(x.n - 1) % 6]}">
        <span class="dot"></span><span class="cm"><span class="cn">${aqEsc(x.nome)}</span><small>${x.ini}–${x.fim}</small></span>
        <button class="sw ${x.ativo ? "on" : ""}" data-tog="${x.n}" role="switch" aria-checked="${x.ativo}" aria-label="Ligar ${aqEsc(x.nome)}"></button></div>`).join("");
    const semana = `<div class="card">
        <div class="st"><span><ha-icon icon="mdi:calendar-range"></ha-icon>Semana</span><em>${cens.filter((x) => x.ativo).length} de ${cens.length} ligados</em></div>
        <div class="wk">${wk}</div>
        <div class="cl">${chips}</div>
      </div>`;

    // Divisões
    const list = c.divisoes.map((d) => {
      const a = this._alvo(d, cens), hot = this._on(`input_boolean.aq_${d.id}_pede_calor`) && st.on, op = this._open === d.id;
      const inc = cens.filter((x) => x.ativo && x.rooms[d.id]);
      return `<div class="it ${hot ? "hot" : ""} ${op ? "open" : ""}">
        <button class="ih" data-room="${d.id}" aria-expanded="${op}">
          <ha-icon icon="${d.icon}"></ha-icon>
          <span class="nm">${aqEsc(d.nome)}<small>${hot ? "A aquecer" : "Em espera"} · ${aqEsc(a.src)}</small></span>
          <span class="t">${aqF1(this._val(d.temp))}°</span><span class="a">${aqF1(a.v)}°</span>
          <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
        </button>
        ${op ? `<div class="ib">
          <div class="big-step">
            <button class="rnd" data-sp="${d.id}" data-d="-1" aria-label="Baixar ${aqEsc(d.nome)}"><ha-icon icon="mdi:minus"></ha-icon></button>
            <div class="spv"><b>${aqF1(this._val(`input_number.aq_${d.id}_setpoint`))}°</b><small>setpoint nos cenários</small></div>
            <button class="rnd" data-sp="${d.id}" data-d="1" aria-label="Subir ${aqEsc(d.nome)}"><ha-icon icon="mdi:plus"></ha-icon></button>
          </div>
          <div class="inc">Aquece em: ${inc.length ? inc.map((x) => `<span class="k" style="--k:${AQ_CORES[(x.n - 1) % 6]}">${aqEsc(x.nome)} ${x.ini}–${x.fim}</span>`).join("") : "nenhum cenário ligado"}</div>
        </div>` : ""}
      </div>`;
    }).join("");
    const divisoes = `<div class="card">
        <div class="st"><span><ha-icon icon="mdi:home-thermometer-outline"></ha-icon>Divisões</span><em>${pedem.length && st.on ? `${pedem.length} a aquecer` : "todas em espera"}</em></div>
        ${tablet ? "" : confBox}
        <div class="cols"><span></span><span>Divisão</span><span>Agora</span><span>Alvo</span><span></span></div>
        <div class="list">${list}</div>
      </div>`;

    const body = tablet
      ? `<div class="strip">${bar}${confBox}</div><div class="main">${semana}${divisoes}</div>`
      : `${bar}${this._modes(auto, forced)}<div class="hint">${hint}</div>${semana}${divisoes}`;
    this.shadowRoot.innerHTML = `<style>${AquecimentoCard.css}</style><div class="root ${tablet ? "tablet" : "phone"}">${body}</div>`;
    if (this._edit) this._renderEd();
  }

  _modes(auto, forced) {
    return `<div class="modes" role="group" aria-label="Modo da caldeira">
        <button class="${auto ? "on" : ""}" data-a="auto"><ha-icon icon="mdi:autorenew"></ha-icon>Auto</button>
        <button class="${!auto ? "on" : ""}" data-a="manual"><ha-icon icon="mdi:hand-back-right"></ha-icon>Manual</button>
        <button class="${forced ? "fon" : ""}" data-a="forcar" ${auto && !forced ? "disabled" : ""}><ha-icon icon="mdi:lightning-bolt"></ha-icon>Forçar</button>
      </div>`;
  }

  // ---------- editor do cenário (vive no body, como os pop-ups do Bubble Card) ----------
  _openEd(n) {
    this._edit = n;
    if (!this._pushed) {
      this._pushed = true;
      history.pushState(history.state, "", location.pathname + location.search + AQ_HASH);
      window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
    }
    this._renderEd();
  }
  _closeEd() {
    this._edit = null;
    this._typing = false;
    if (this._portal) { this._portal.remove(); this._portal = null; }
    if (this._pushed) { this._pushed = false; history.back(); }
  }
  _renderEd() {
    if (!this._edit || !this._hass) return;
    if (!this._portal) {
      this._portal = document.createElement("div");
      this._portal.attachShadow({ mode: "open" });
      const sr = this._portal.shadowRoot;
      sr.addEventListener("click", (e) => this._onEdClick(e));
      sr.addEventListener("change", (e) => this._onEdChange(e));
      sr.addEventListener("focusin", (e) => { if (e.target.matches?.("input[type=text]")) this._typing = true; });
      sr.addEventListener("focusout", (e) => { if (e.target.matches?.("input[type=text]")) { this._typing = false; this._saveName(e.target); } });
      sr.addEventListener("keydown", (e) => {
        if (e.key === "Escape") this._closeEd();
        if (e.key === "Enter" && e.target.matches?.("input[type=text]")) e.target.blur();
      });
      document.body.appendChild(this._portal);
      this._fresh = true;
    }
    if (this._typing) return; // não apagar o que está a ser escrito
    const sr = this._portal.shadowRoot, prev = sr.querySelector(".ed"), scroll = prev ? prev.scrollTop : 0;
    if (this._edit === "regras") {
      sr.innerHTML = `<style>${AquecimentoCard.css}${AquecimentoCard.edCss}</style>${this._regrasHtml()}`;
      this._fresh = false;
      return;
    }
    const x = this._cen(this._edit), tablet = this._cfg.layout === "tablet", cross = aqMin(x.ini) > aqMin(x.fim);
    sr.innerHTML = `<style>${AquecimentoCard.css}${AquecimentoCard.edCss}</style>
      <div class="scrim ${tablet ? "center" : "bottom"} ${this._fresh ? "anim" : ""}" data-x="1">
        <div class="ed" role="dialog" aria-modal="true" aria-label="Configurar cenário" style="--k:${AQ_CORES[(x.n - 1) % 6]}">
          <div class="grab"></div>
          <div class="shh"><h2><i></i>Configurar cenário</h2><button class="x" data-x="1" aria-label="Fechar"><ha-icon icon="mdi:close"></ha-icon></button></div>
          <div><div class="lbl">Nome</div><input class="txt" type="text" maxlength="30" value="${aqEsc(x.nome)}" aria-label="Nome do cenário"></div>
          <button class="op ${x.ativo ? "on" : ""}" data-e="ativo"><ha-icon icon="mdi:power"></ha-icon><span class="ot">Cenário ligado<small>Desligado não aquece, mas guarda tudo</small></span><span class="sw ${x.ativo ? "on" : ""}"></span></button>
          <div><div class="lbl">Horário</div><div class="times">
            <label class="tm"><span><ha-icon icon="mdi:play" style="color:${AQ.green}"></ha-icon>Ligar</span><input type="time" data-t="inicio" value="${x.ini}"></label>
            <label class="tm"><span><ha-icon icon="mdi:stop" style="color:${AQ.red}"></ha-icon>Desligar</span><input type="time" data-t="fim" value="${x.fim}"></label>
          </div></div>
          ${cross ? `<div class="note"><ha-icon icon="mdi:weather-night" style="color:${AQ.amber}"></ha-icon>Passa da meia-noite: conta para o dia em que começa.</div>` : ""}
          <div><div class="lbl">Dias <span class="qs"><button class="q" data-qd="uteis">Dias úteis</button><button class="q" data-qd="todos">Todos</button></span></div>
            <div class="dsel">${AQ_DIAS.map((d, k) => `<button class="${x.dias[d] ? "on" : ""}" data-day="${d}">${AQ_DIA_L[k]}</button>`).join("")}</div></div>
          <div><div class="lbl">Divisões a aquecer <span class="qs"><button class="q" data-qr="1">Todas</button><button class="q" data-qr="0">Nenhuma</button></span></div>
            <div class="rsel">${this._cfg.divisoes.map((d) => `<button class="${x.rooms[d.id] ? "on" : ""}" data-cr="${d.id}"><ha-icon icon="${d.icon}"></ha-icon>${aqEsc(d.nome)}</button>`).join("")}</div></div>
          <div class="note"><ha-icon icon="mdi:information-outline" style="color:${AQ.cyan}"></ha-icon>Cada divisão marcada aquece até ao seu setpoint enquanto o cenário decorre.</div>
          <button class="done" data-x="1">Feito</button>
        </div>
      </div>`;
    this._fresh = false;
    const ed = sr.querySelector(".ed");
    if (ed) ed.scrollTop = scroll;
  }
  // janela "Ajustar": mínima de conforto e histerese, com um exemplo que mostra quando liga e quando pára
  _regrasHtml() {
    const c = this._cfg, tablet = c.layout === "tablet";
    const conf = this._val(c.conforto), inf = this._val(c.offset_inferior), sup = this._val(c.offset_superior);
    const a = this._exAlvo, lig = a - (Number.isFinite(inf) ? inf : 0), des = a + (Number.isFinite(sup) ? sup : 0);
    const lo = a - 1.5, hi = a + 1, p = (v) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100)).toFixed(1);
    const row = (cor, ic, n, d, v, ent) => `<div class="rrow" style="--k:${cor}"><span class="ric"><ha-icon icon="${ic}"></ha-icon></span><div class="rtx"><b>${n}</b><small>${d}</small></div>
      <div class="rstp"><button data-num="${ent}" data-d="-1" aria-label="Menos"><ha-icon icon="mdi:minus"></ha-icon></button><b>${aqF1(v)}°</b><button data-num="${ent}" data-d="1" aria-label="Mais"><ha-icon icon="mdi:plus"></ha-icon></button></div></div>`;
    return `<div class="scrim ${tablet ? "center" : "bottom"} ${this._fresh ? "anim" : ""}" data-x="1">
      <div class="ed" role="dialog" aria-modal="true" aria-label="Regras do aquecimento">
        <div class="grab"></div>
        <div class="shh"><h2><ha-icon icon="mdi:tune-variant" style="color:${AQ.wait}"></ha-icon>Regras do aquecimento</h2><button class="x" data-x="1" aria-label="Fechar"><ha-icon icon="mdi:close"></ha-icon></button></div>
        ${row(AQ.wait, "mdi:shield-home", "Mínima de conforto", "Fora dos cenários, nenhuma divisão desce abaixo disto", conf, c.conforto)}
        ${row(AQ.heat, "mdi:arrow-down", "Pede calor abaixo do alvo", "Quanto a divisão tem de arrefecer para começar a aquecer", inf, c.offset_inferior)}
        ${row(AQ.green, "mdi:arrow-up", "Deixa de pedir acima do alvo", "Quanto passa do alvo antes de parar", sup, c.offset_superior)}
        <div class="regua">
          <div class="rtt"><span>Exemplo</span><span class="ralvo">alvo <button data-ex="-1" aria-label="Baixar o alvo do exemplo"><ha-icon icon="mdi:minus"></ha-icon></button><b>${aqF1(a)}°</b><button data-ex="1" aria-label="Subir o alvo do exemplo"><ha-icon icon="mdi:plus"></ha-icon></button></span></div>
          <div class="trk"><div class="tb"></div><div class="tz" style="left:${p(lig)}%;width:${(p(des) - p(lig)).toFixed(1)}%"></div>
            <div class="mk lig" style="left:${p(lig)}%"><i></i>${aqF1(lig)}°</div><div class="mk alv" style="left:${p(a)}%"><i></i></div><div class="mk des" style="left:${p(des)}%"><i></i>${aqF1(des)}°</div></div>
          <div class="frase">Com alvo <b>${aqF1(a)}°</b>, a divisão <b style="color:${AQ.heat}">começa a pedir calor a ${aqF1(lig)}°</b> e <b style="color:${AQ.green}">pára a ${aqF1(des)}°</b>. Entre os dois mantém o que estava a fazer, para a caldeira não ligar e desligar a toda a hora.</div>
        </div>
        <button class="done" data-x="1">Feito</button>
      </div>
    </div>`;
  }
  _saveName(inp) {
    const n = this._edit;
    if (!n) return;
    const id = `input_text.${this._c(n)}_nome`, v = inp.value.trim();
    if (v && v !== (this._st(id)?.state || "").trim()) this._call("input_text", "set_value", { entity_id: id, value: v });
  }
  _onEdClick(e) {
    if (e.target.classList?.contains("scrim") || e.target.closest?.("[data-x]:not(.scrim)")) return this._closeEd();
    if (this._edit === "regras") {
      const b = e.target.closest?.("[data-num],[data-ex]");
      if (!b) return;
      if (b.dataset.num) return this._step(b.dataset.num, Number(b.dataset.d));
      this._exAlvo = Math.min(26, Math.max(10, this._exAlvo + Number(b.dataset.ex) * 0.5));
      return this._renderEd();
    }
    const p = this._c(this._edit);
    const t = e.target.closest?.("[data-e],[data-day],[data-qd],[data-cr],[data-qr]");
    if (!t) return;
    if (t.dataset.e === "ativo") return this._bool(`input_boolean.${p}_ativo`, !this._on(`input_boolean.${p}_ativo`));
    if (t.dataset.day) { const id = `input_boolean.${p}_${t.dataset.day}`; return this._bool(id, !this._on(id)); }
    if (t.dataset.cr) { const id = `input_boolean.${p}_${t.dataset.cr}`; return this._bool(id, !this._on(id)); }
    if (t.dataset.qd) {
      const on = AQ_DIAS.filter((d, k) => t.dataset.qd === "todos" || k < 5).map((d) => `input_boolean.${p}_${d}`);
      const off = AQ_DIAS.filter((d, k) => t.dataset.qd !== "todos" && k >= 5).map((d) => `input_boolean.${p}_${d}`);
      this._call("input_boolean", "turn_on", { entity_id: on });
      if (off.length) this._call("input_boolean", "turn_off", { entity_id: off });
    }
    if (t.dataset.qr) {
      const ids = this._cfg.divisoes.map((d) => `input_boolean.${p}_${d.id}`);
      this._call("input_boolean", t.dataset.qr === "1" ? "turn_on" : "turn_off", { entity_id: ids });
    }
  }
  _onEdChange(e) {
    const t = e.target;
    if (this._edit === "regras") return;
    if (!t.dataset?.t || !t.value) return;
    this._call("input_datetime", "set_datetime", { entity_id: `input_datetime.${this._c(this._edit)}_${t.dataset.t}`, time: `${t.value}:00` });
  }

  static get css() {
    return `
      :host { display:block; }
      * { box-sizing:border-box; }
      ha-icon { --mdc-icon-size:20px; }
      button { font:inherit; color:inherit; cursor:pointer; }
      button:focus-visible, [role=button]:focus-visible, input:focus-visible { outline:2px solid ${AQ.cyan}; outline-offset:2px; }
      .root { color:#fff; display:flex; flex-direction:column; gap:12px; }
      .card { background:rgba(0,0,0,0.24); border:1px solid rgba(255,255,255,0.15); border-radius:20px; padding:14px; display:flex; flex-direction:column; gap:12px; min-width:0; }
      .bar { display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:20px;
        background:linear-gradient(120deg, color-mix(in srgb, var(--c) 22%, transparent), rgba(0,0,0,0.25) 75%); border:1px solid color-mix(in srgb, var(--c) 40%, transparent); }
      .flame { width:52px; height:52px; border-radius:50%; flex:none; display:grid; place-items:center; background:color-mix(in srgb, var(--c) 18%, transparent); border:1.5px solid color-mix(in srgb, var(--c) 55%, transparent); }
      .flame ha-icon { --mdc-icon-size:30px; color:var(--c); }
      .flame ha-icon.pulse { animation:aqp 1.6s ease-in-out infinite; }
      @keyframes aqp { 50% { transform:scale(1.13); } }
      @media (prefers-reduced-motion: reduce) { .flame ha-icon.pulse { animation:none; } }
      .bt { flex:1; min-width:0; }
      .bt .e { font-size:19px; font-weight:700; color:var(--c); }
      .bt .s { font-size:12.5px; color:${AQ.muted}; margin-top:2px; line-height:1.35; }
      .big { text-align:right; flex:none; }
      .big b { display:block; font-size:30px; font-weight:300; line-height:1; color:${AQ.setpoint}; font-variant-numeric:tabular-nums; }
      .big small { font-size:10.5px; color:${AQ.muted}; }
      .modes { display:grid; grid-template-columns:1fr 1fr 1fr; gap:4px; padding:4px; border-radius:14px; background:rgba(0,0,0,0.28); border:1px solid rgba(255,255,255,0.08); }
      .modes button { display:flex; align-items:center; justify-content:center; gap:5px; padding:9px 4px; border-radius:10px; font-size:13px; font-weight:600; background:none; border:1px solid transparent; color:${AQ.muted}; }
      .modes button ha-icon { --mdc-icon-size:17px; }
      .modes button.on { background:rgba(60,200,180,0.18); border-color:rgba(60,200,180,0.6); color:#fff; }
      .modes button.on ha-icon { color:${AQ.teal}; }
      .modes button.fon { background:color-mix(in srgb, ${AQ.amber} 18%, transparent); border-color:color-mix(in srgb, ${AQ.amber} 60%, transparent); color:#fff; }
      .modes button.fon ha-icon { color:${AQ.amber}; }
      .modes button:disabled { opacity:.35; cursor:not-allowed; }
      .hint { font-size:12px; color:${AQ.muted}; margin:-4px 4px 0; line-height:1.4; }
      .st { display:flex; align-items:center; justify-content:space-between; gap:6px; font-size:12.5px; font-weight:600; color:${AQ.muted}; text-transform:uppercase; letter-spacing:.05em; }
      .st span { display:flex; align-items:center; gap:6px; } .st ha-icon { --mdc-icon-size:17px; }
      .st em { font-style:normal; text-transform:none; letter-spacing:0; font-weight:500; font-size:12px; }
      .wk { display:grid; grid-template-columns:30px 1fr; row-gap:5px; column-gap:6px; align-items:center; }
      .dl { font-size:11px; font-weight:700; color:${AQ.muted}; } .dl.today { color:#fff; }
      .ln { position:relative; height:22px; border-radius:6px; background:rgba(255,255,255,0.035); }
      .ln.today { background:rgba(255,255,255,0.07); outline:1px solid rgba(255,255,255,0.18); }
      .grid6 { position:absolute; inset:0; background-image:linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px); background-size:25% 100%; border-radius:6px; pointer-events:none; }
      .blk { position:absolute; top:2px; bottom:2px; border-radius:5px; background:color-mix(in srgb, var(--k) 45%, transparent); border:1px solid var(--k); padding:0; overflow:hidden; text-align:left; }
      .blk.run { box-shadow:0 0 0 2px ${AQ.heat}; }
      .nowl { position:absolute; top:-3px; bottom:-3px; width:2px; background:#fff; border-radius:1px; box-shadow:0 0 6px rgba(255,255,255,.7); pointer-events:none; }
      .hrs { position:relative; height:12px; font-size:9.5px; color:${AQ.muted}; font-variant-numeric:tabular-nums; }
      .hrs span { position:absolute; transform:translateX(-50%); } .hrs span:first-child { transform:none; } .hrs span:last-child { transform:translateX(-100%); }
      .cl { display:flex; gap:6px; overflow-x:auto; padding:2px 2px 4px; scrollbar-width:none; }
      .cl::-webkit-scrollbar { display:none; }
      .cc { flex:none; display:flex; align-items:center; gap:8px; padding:8px 10px 8px 8px; border-radius:14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); cursor:pointer; }
      .cc.off { opacity:.5; } .cc.run { border-color:rgba(255,120,65,0.65); background:rgba(255,120,65,0.12); }
      .cc .dot { width:12px; height:12px; border-radius:4px; background:var(--k); flex:none; }
      .cc .cm { display:flex; flex-direction:column; }
      .cc .cn { font-size:13px; font-weight:600; white-space:nowrap; } .cc small { font-size:11px; color:${AQ.muted}; font-variant-numeric:tabular-nums; white-space:nowrap; }
      .sw { width:34px; height:20px; border-radius:999px; background:rgba(255,255,255,0.18); position:relative; flex:none; border:none; padding:0; transition:background .2s; }
      .sw::after { content:""; position:absolute; top:3px; left:3px; width:14px; height:14px; border-radius:50%; background:#fff; transition:left .2s; }
      .sw.on { background:${AQ.teal}; } .sw.on::after { left:17px; }
      .reg { display:flex; flex-direction:column; gap:8px; padding:12px 14px; border-radius:16px; background:rgba(100,160,255,0.06); border:1px solid rgba(100,160,255,0.28); }
      .reg .rh { display:flex; align-items:center; gap:8px; }
      .reg .rh > ha-icon { color:${AQ.wait}; }
      .reg .rh b { flex:1; font-size:14px; font-weight:650; }
      .aj { display:flex; align-items:center; gap:5px; font-size:12.5px; font-weight:600; padding:7px 12px; border-radius:999px; background:rgba(100,160,255,0.14); border:1px solid rgba(100,160,255,0.45); }
      .aj ha-icon { --mdc-icon-size:16px; color:#64A0FF; }
      .lin { display:flex; gap:8px; align-items:flex-start; font-size:12.5px; line-height:1.45; color:rgba(255,255,255,0.78); }
      .lin ha-icon { --mdc-icon-size:16px; flex:none; margin-top:1px; }
      .lin b { font-weight:600; color:#fff; font-variant-numeric:tabular-nums; } .lin b.v { color:${AQ.setpoint}; }
      .tablet .reg { justify-content:center; padding:14px 18px; border-radius:20px; }
      .conf { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:14px; background:rgba(100,160,255,0.07); border:1px solid rgba(100,160,255,0.28); }
      .conf > ha-icon { color:${AQ.wait}; }
      .conf .ct { flex:1; font-size:13px; } .conf .ct small { display:block; font-size:11.5px; color:${AQ.muted}; }
      .sv { width:52px; text-align:center; font-size:17px; font-weight:300; color:${AQ.setpoint}; font-variant-numeric:tabular-nums; }
      .rnd { width:44px; height:44px; border-radius:50%; display:grid; place-items:center; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.14); padding:0; flex:none; }
      .rnd.sm { width:34px; height:34px; border-radius:10px; } .rnd.sm ha-icon { --mdc-icon-size:18px; }
      .cols, .ih { display:grid; grid-template-columns:24px minmax(0,1fr) 52px 52px 20px; gap:8px; }
      .cols { padding:0 12px; font-size:10px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:rgba(255,255,255,0.35); }
      .cols span:nth-child(3), .cols span:nth-child(4) { text-align:right; }
      .list { display:flex; flex-direction:column; border-radius:14px; border:1px solid rgba(255,255,255,0.08); overflow:hidden; }
      .it { border-top:1px solid rgba(255,255,255,0.08); } .it:first-child { border-top:none; }
      .ih { width:100%; align-items:center; padding:11px 12px; background:rgba(255,255,255,0.05); border:none; text-align:left; }
      .ih > ha-icon:first-child { --mdc-icon-size:19px; color:cadetblue; }
      .ih .nm { font-size:14px; font-weight:600; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .ih .nm small { display:block; font-size:11px; font-weight:400; color:${AQ.muted}; overflow:hidden; text-overflow:ellipsis; }
      .ih .t { font-size:16px; font-variant-numeric:tabular-nums; text-align:right; }
      .ih .a { font-size:12.5px; color:${AQ.muted}; font-variant-numeric:tabular-nums; text-align:right; }
      .ih .chev { color:${AQ.muted}; transition:transform .25s; }
      .it.open .ih .chev { transform:rotate(180deg); }
      .it.hot .ih { background:linear-gradient(90deg, rgba(255,120,65,0.18), rgba(255,255,255,0.03) 75%); }
      .it.hot .ih > ha-icon:first-child, .it.hot .ih .t { color:${AQ.heat}; }
      .ib { padding:12px; background:rgba(0,0,0,0.2); display:flex; flex-direction:column; gap:10px; }
      .big-step { display:flex; align-items:center; justify-content:center; gap:18px; }
      .spv { text-align:center; min-width:96px; }
      .spv b { display:block; font-size:34px; font-weight:300; color:${AQ.setpoint}; font-variant-numeric:tabular-nums; line-height:1; }
      .spv small { font-size:11px; color:${AQ.muted}; }
      .inc { display:flex; flex-wrap:wrap; gap:5px; align-items:center; font-size:11.5px; color:${AQ.muted}; }
      .inc .k { padding:3px 8px; border-radius:999px; background:color-mix(in srgb, var(--k) 18%, transparent); border:1px solid color-mix(in srgb, var(--k) 50%, transparent); color:#fff; }

      /* tablet: faixa em cima + duas colunas */
      .tablet { gap:16px; }
      .tablet .strip { display:grid; grid-template-columns:1.45fr 1fr; gap:16px; align-items:stretch; }
      .tablet .bar { padding:14px 18px; } .tablet .flame { width:58px; height:58px; }
      .tablet .bt .e { font-size:22px; } .tablet .big b { font-size:36px; }
      .tablet .mcol { display:flex; flex-direction:column; gap:7px; justify-content:center; width:340px; flex:none; margin-left:8px; padding-left:18px; border-left:1px solid rgba(255,255,255,0.12); }
      .tablet .mcol .modes { background:rgba(0,0,0,0.3); }
      .tablet .mcol .hint { margin:0 4px; font-size:11.5px; }
      .tablet .main { display:grid; grid-template-columns:1.45fr 1fr; gap:16px; align-items:start; }
      .tablet .wk { row-gap:8px; column-gap:10px; grid-template-columns:38px 1fr; }
      .tablet .ln { height:44px; border-radius:9px; } .tablet .dl { font-size:13px; }
      .tablet .grid6 { background-size:12.5% 100%; }
      .tablet .blk { border-radius:8px; top:3px; bottom:3px; display:flex; flex-direction:column; justify-content:center; padding:0 8px; }
      .tablet .blk b { font-size:12px; font-weight:650; white-space:nowrap; }
      .tablet .blk small { font-size:10.5px; color:rgba(255,255,255,0.75); white-space:nowrap; font-variant-numeric:tabular-nums; }
      .tablet .hrs { height:14px; font-size:11px; }
      .tablet .cl { flex-wrap:wrap; overflow:visible; }
      @media (max-width: 1000px) {
        .tablet .strip, .tablet .main { grid-template-columns:1fr; }
        .tablet .mcol { width:300px; }
      }
    `;
  }
  static get edCss() {
    return `
      .scrim { position:fixed; inset:0; z-index:9999; background:rgba(2,8,11,.62); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); display:flex; justify-content:center; color:#fff; font-family:var(--paper-font-body1_-_font-family, Roboto, sans-serif); }
      .scrim.bottom { align-items:flex-end; }
      .scrim.center { align-items:center; padding:16px; }
      .ed { width:100%; max-width:560px; max-height:88vh; overflow-y:auto; background:#10232A; border:1px solid rgba(255,255,255,0.15); display:flex; flex-direction:column; gap:12px; padding:10px 14px calc(18px + env(safe-area-inset-bottom, 0px)); }
      .bottom .ed { border-radius:22px 22px 0 0; border-bottom:none; }
      .anim.bottom .ed { animation:aqup .25s ease; } .anim.center .ed { animation:aqin .2s ease; }
      .center .ed { border-radius:22px; padding:16px 20px 20px; }
      @keyframes aqup { from { transform:translateY(40px); opacity:0; } }
      @keyframes aqin { from { transform:scale(.97); opacity:0; } }
      .grab { width:42px; height:4px; border-radius:2px; background:rgba(255,255,255,0.25); margin:0 auto 2px; }
      .center .grab { display:none; }
      .shh { display:flex; align-items:center; justify-content:space-between; gap:8px; }
      .shh h2 { margin:0; font-size:17px; font-weight:650; display:flex; align-items:center; gap:8px; }
      .shh h2 i { width:14px; height:14px; border-radius:4px; background:var(--k); }
      .x { width:34px; height:34px; border-radius:50%; display:grid; place-items:center; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.08); padding:0; }
      .lbl { font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:rgba(255,255,255,0.4); margin-bottom:6px; display:flex; justify-content:space-between; align-items:center; }
      .qs { display:flex; gap:5px; }
      .q { font-size:11.5px; font-weight:500; padding:4px 10px; border-radius:999px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.08); text-transform:none; letter-spacing:0; }
      .txt { width:100%; font:inherit; font-size:15px; color:#fff; padding:11px 12px; border-radius:12px; background:rgba(95,158,160,0.10); border:1px solid rgba(95,158,160,0.4); }
      .op { width:100%; display:flex; align-items:center; gap:10px; padding:11px 12px; border-radius:14px; text-align:left; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); }
      .op > ha-icon { color:${AQ.muted}; } .op .ot { flex:1; display:flex; flex-direction:column; } .op small { font-size:11.5px; color:${AQ.muted}; }
      .op.on { border-color:rgba(60,200,180,0.55); background:rgba(60,200,180,0.12); } .op.on > ha-icon { color:${AQ.teal}; }
      .dsel { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
      .dsel button, .rsel button { padding:10px 0; border-radius:11px; font-size:12.5px; font-weight:600; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); }
      .dsel button.on, .rsel button.on { background:rgba(60,200,180,0.18); border-color:rgba(60,200,180,0.65); }
      .rsel { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
      .rsel button { display:flex; align-items:center; gap:7px; padding:10px; font-weight:500; text-align:left; }
      .rsel button ha-icon { color:${AQ.muted}; --mdc-icon-size:18px; } .rsel button.on ha-icon { color:${AQ.teal}; }
      .times { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
      .tm { display:flex; flex-direction:column; gap:4px; padding:10px; border-radius:14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); }
      .tm span { font-size:11.5px; color:${AQ.muted}; display:flex; align-items:center; gap:4px; } .tm span ha-icon { --mdc-icon-size:15px; }
      .tm input { font:inherit; font-size:22px; font-weight:300; color:#fff; background:transparent; border:none; padding:0; width:100%; color-scheme:dark; }
      .note { font-size:12px; color:${AQ.muted}; line-height:1.4; display:flex; gap:6px; } .note ha-icon { --mdc-icon-size:16px; flex:none; }
      .done { width:100%; padding:14px; border-radius:16px; font-size:15px; font-weight:650; border:none; background:linear-gradient(135deg, ${AQ.teal}, #0EA5A4); color:#fff; }
      .shh h2 ha-icon { --mdc-icon-size:20px; }
      .rrow { display:flex; align-items:center; gap:12px; padding:12px; border-radius:16px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); }
      .ric { width:40px; height:40px; border-radius:12px; display:grid; place-items:center; flex:none; background:color-mix(in srgb, var(--k) 15%, transparent); color:var(--k); }
      .ric ha-icon { --mdc-icon-size:22px; }
      .rtx { flex:1; min-width:0; } .rtx b { display:block; font-size:14px; } .rtx small { display:block; font-size:11.5px; color:${AQ.muted}; margin-top:2px; line-height:1.35; }
      .rstp { display:flex; align-items:center; gap:6px; flex:none; }
      .rstp button, .ralvo button { display:grid; place-items:center; padding:0; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.14); }
      .rstp button { width:34px; height:34px; border-radius:10px; } .rstp button ha-icon { --mdc-icon-size:18px; }
      .rstp b { min-width:54px; text-align:center; font-size:17px; font-weight:400; color:var(--k); font-variant-numeric:tabular-nums; }
      .regua { padding:12px; border-radius:16px; background:rgba(0,0,0,0.25); border:1px solid rgba(255,255,255,0.08); display:flex; flex-direction:column; gap:10px; }
      .rtt { font-size:12px; color:${AQ.muted}; display:flex; justify-content:space-between; align-items:center; gap:8px; }
      .ralvo { display:flex; align-items:center; gap:6px; }
      .ralvo button { width:26px; height:26px; border-radius:8px; } .ralvo button ha-icon { --mdc-icon-size:15px; }
      .ralvo b { color:${AQ.setpoint}; font-weight:600; min-width:42px; text-align:center; }
      .trk { position:relative; height:46px; }
      .trk .tb { position:absolute; left:0; right:0; top:20px; height:6px; border-radius:3px; background:rgba(255,255,255,0.08); }
      .trk .tz { position:absolute; top:20px; height:6px; border-radius:3px; background:linear-gradient(90deg, ${AQ.heat}, ${AQ.setpoint}); }
      .trk .mk { position:absolute; top:6px; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:2px; font-size:10.5px; color:${AQ.muted}; font-variant-numeric:tabular-nums; white-space:nowrap; }
      .trk .mk i { width:2px; height:20px; background:currentColor; border-radius:1px; }
      .trk .mk.lig { color:${AQ.heat}; } .trk .mk.des { color:${AQ.green}; } .trk .mk.alv { color:${AQ.setpoint}; top:0; } .trk .mk.alv i { height:28px; }
      .frase { font-size:12.5px; line-height:1.45; color:rgba(255,255,255,0.8); } .frase b { font-variant-numeric:tabular-nums; }
    `;
  }
}

if (!customElements.get("aquecimento-card")) {
  customElements.define("aquecimento-card", AquecimentoCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "aquecimento-card", name: "Aquecimento", description: `Caldeira, cenários e divisões (v${AQ_VERSION}).` });
}
