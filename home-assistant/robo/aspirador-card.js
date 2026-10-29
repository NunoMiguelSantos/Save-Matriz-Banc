// aspirador-card v1.0 — robô de limpeza (Dreame), em português
const ASP_VERSION = "1.0.0";
const AC = {
  blue: "#64A0FF", teal: "#3CC8B4", green: "#4ADE80", amber: "#FBBF24", red: "#F87171", purple: "#A78BFA", cyan: "#65D8DE",
  muted: "rgba(255,255,255,0.58)", faint: "rgba(255,255,255,0.10)",
};

const MODOS = {
  sweeping: { n: "Aspirar", i: "mdi:broom" },
  mopping: { n: "Esfregar", i: "mdi:water" },
  sweeping_and_mopping: { n: "Aspirar e esfregar", i: "mdi:broom" },
  mopping_after_sweeping: { n: "Esfregar depois", i: "mdi:transfer-right" },
};
const POTENCIA = { quiet: "Silencioso", standard: "Normal", strong: "Forte", turbo: "Turbo" };

const DIVISOES_DEF = [
  { e: "input_boolean.vacuum_area_8", n: "Escritório", i: "mdi:briefcase-outline" },
  { e: "input_boolean.vacuum_area_1", n: "Quarto bebé", i: "mdi:baby-face-outline" },
  { e: "input_boolean.vacuum_area_9", n: "Suite", i: "mdi:bed-king-outline" },
  { e: "input_boolean.vacuum_area_7", n: "WC Suite", i: "mdi:shower" },
  { e: "input_boolean.vacuum_area_10", n: "Hall quartos", i: "mdi:door-open" },
  { e: "input_boolean.vacuum_area_2", n: "Cozinha", i: "mdi:stove" },
  { e: "input_boolean.vacuum_area_4", n: "WC Geral", i: "mdi:toilet" },
  { e: "input_boolean.vacuum_area_3", n: "Hall entrada", i: "mdi:door" },
  { e: "input_boolean.vacuum_area_5", n: "Sala jantar", i: "mdi:silverware-fork-knife" },
  { e: "input_boolean.vacuum_area_6", n: "Sala estar", i: "mdi:sofa-outline" },
];

const PECAS = [
  { k: "filter", n: "Filtro", i: "mdi:air-filter" },
  { k: "main_brush", n: "Escova principal", i: "mdi:broom" },
  { k: "side_brush", n: "Escova lateral", i: "mdi:fan" },
  { k: "sensor_dirty", n: "Sensores", i: "mdi:eye-outline", reset: "sensor" },
];

const BASE = [
  { k: "clean_water_tank_status", n: "Água limpa", i: "mdi:water" },
  { k: "dirty_water_tank_status", n: "Água suja", i: "mdi:water-opacity" },
  { k: "detergent_status", n: "Detergente", i: "mdi:bottle-tonic-outline" },
  { k: "dust_bag_status", n: "Saco do pó", i: "mdi:delete-variant" },
];

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const num = (v, d = 0) => (isFinite(v) ? v : 0).toLocaleString("pt-PT", { minimumFractionDigits: d, maximumFractionDigits: d });
const ago = (t) => {
  const min = (Date.now() - t) / 60000;
  if (min < 60) return `há ${Math.max(1, Math.round(min))} min`;
  if (min < 1440) return `há ${Math.round(min / 60)} h`;
  const d = Math.round(min / 1440);
  return d === 1 ? "ontem" : `há ${d} dias`;
};
const hm = (d) => d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
const dataCurta = (d) => d.toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" });

class AspiradorCard extends HTMLElement {
  setConfig(config) {
    const p = (config && config.prefix) || "vaccuminator";
    this._c = Object.assign({
      parte: "tudo", // controlo | info | tudo
      vacuum: `vacuum.${p}`,
      s: (k) => `sensor.${p}_${k}`,
      modo: `select.${p}_cleaning_mode`,
      potencia: `select.${p}_suction_level`,
      humidade: `number.${p}_wetness_level`,
      reset: (k) => `button.${p}_reset_${k}`,
      modo_area: "input_boolean.mod_total_or_area",
      script_areas: "script.vaccuminator_segments",
      divisoes: DIVISOES_DEF,
      auto: "automation.limpeza_vaccuminator_automatic_v2",
      feita_hoje: "input_boolean.limpeza_feita_hoje",
      auto_texto: "Seg, qua e sex a partir das 11h, quando não está ninguém em casa",
      popup: "#definicoes-robo",
    }, config || {});
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._confirm = {};
  }

  set hass(h) {
    this._h = h;
    const c = this._c;
    const ids = [c.vacuum, c.modo, c.potencia, c.humidade, c.modo_area, c.auto, c.feita_hoje,
      ...c.divisoes.map((d) => d.e),
      ...["battery_level", "charging_status", "current_room", "cleaning_progress", "cleaned_area", "cleaning_time", "error", "low_water_warning",
        "drying_left", "cleaning_history", "total_cleaned_area", "total_cleaning_time", "cleaning_count", "status"].map(c.s),
      ...PECAS.flatMap((x) => [c.s(x.k + "_left"), c.s(x.k + "_time_left")]), ...BASE.map((x) => c.s(x.k))];
    const sig = ids.map((e) => { const s = h.states[e]; return s ? s.state + "|" + (e === c.vacuum ? JSON.stringify([s.attributes.cleaning_progress, s.attributes.cleaned_area, s.attributes.washing, s.attributes.drying]) : "") : "-"; }).join(";");
    if (sig !== this._sig) { this._sig = sig; this._render(); }
  }

  getCardSize() { return 8; }
  getGridOptions() { return { columns: "full", rows: "auto" }; }

  st(e) { return this._h.states[e]; }
  val(e) { return this.st(e)?.state; }
  attr(e, a) { return this.st(e)?.attributes?.[a]; }
  ok(e) { const v = this.val(e); return v !== undefined && v !== "unavailable" && v !== "unknown"; }
  n(e) { return parseFloat(this.val(e)); }
  call(d, s, data) { return this._h.callService(d, s, data); }

  // ---------- estado ----------
  _estado() {
    const c = this._c, v = this.st(c.vacuum);
    if (!v || v.state === "unavailable") return { k: "off", t: "Sem ligação", c: AC.muted, i: "mdi:wifi-off" };
    const a = v.attributes || {};
    const erro = this.val(c.s("error"));
    if (v.state === "error" || a.has_error || (erro && !["no_error", "unavailable", "unknown"].includes(erro)))
      return { k: "error", t: "Precisa de ajuda", c: AC.red, i: "mdi:robot-vacuum-alert" };
    if (a.washing) return { k: "washing", t: "A lavar a mopa", c: AC.cyan, i: "mdi:water-sync" };
    if (a.drying) return { k: "drying", t: "A secar a mopa", c: AC.amber, i: "mdi:weather-windy" };
    if (v.state === "cleaning") return { k: "cleaning", t: "A limpar", c: AC.teal, i: "mdi:robot-vacuum" };
    if (v.state === "paused") return { k: "paused", t: "Em pausa", c: AC.amber, i: "mdi:pause-circle-outline" };
    if (v.state === "returning") return { k: "returning", t: "A voltar à base", c: AC.purple, i: "mdi:home-import-outline" };
    if (v.state === "docked") {
      const bat = this.n(c.s("battery_level"));
      if (a.charging || this.val(c.s("charging_status")) === "charging") return { k: "docked", t: "A carregar", c: AC.blue, i: "mdi:battery-charging" };
      return { k: "docked", t: bat >= 100 ? "Pronto na base" : "Na base", c: AC.blue, i: "mdi:robot-vacuum" };
    }
    return { k: "idle", t: "Parado", c: AC.muted, i: "mdi:robot-vacuum" };
  }

  _historico() {
    const at = this.st(this._c.s("cleaning_history"))?.attributes || {};
    return Object.values(at).filter((x) => x && typeof x === "object" && x.timestamp)
      .map((x) => ({ t: x.timestamp * 1000, min: parseFloat(x.cleaning_time), m2: parseFloat(x.cleaned_area), ok: x.completed !== false, quartos: /room/i.test(x.status || "") }))
      .sort((a, b) => b.t - a.t);
  }

  _hero(E) {
    const c = this._c, a = this.st(c.vacuum)?.attributes || {};
    const bat = this.n(c.s("battery_level"));
    const ativo = ["cleaning", "paused", "washing"].includes(E.k);
    const prog = ativo ? (this.ok(c.s("cleaning_progress")) ? this.n(c.s("cleaning_progress")) : parseFloat(a.cleaning_progress) || 0) : 0;
    const R = 62, L = 2 * Math.PI * R;
    let l1 = "", l2 = "";
    if (E.k === "error") {
      const desc = this.attr(c.s("error"), "description") || this.val(c.s("error")) || "";
      l1 = esc(desc.replace(/_/g, " "));
      l2 = "Vê o robô e resolve o problema; depois carrega em Retomar ou Base.";
    } else if (ativo) {
      const m2 = this.ok(c.s("cleaned_area")) ? this.n(c.s("cleaned_area")) : a.cleaned_area;
      const min = this.ok(c.s("cleaning_time")) ? this.n(c.s("cleaning_time")) : a.cleaning_time;
      l1 = `<b>${num(m2)} m²</b> em ${num(min)} min`;
      const room = this.val(c.s("current_room"));
      l2 = room && this.ok(c.s("current_room")) ? `Agora em: ${esc(this._nomeDivisao(room))}` : "";
    } else if (E.k === "drying") {
      const left = this.n(c.s("drying_left"));
      l1 = isFinite(left) && left > 0 ? `Faltam <b>${num(left)} min</b> de secagem` : "A secar a mopa na base";
    } else if (E.k === "returning") {
      l1 = "A regressar para carregar ou lavar a mopa";
    } else {
      const h = this._historico()[0];
      l1 = h ? `Última limpeza <b>${ago(h.t)}</b>` : "Sem limpezas registadas";
      l2 = h ? `${num(h.m2)} m² em ${num(h.min)} min${h.ok ? "" : " · não terminou"}` : "";
    }
    const avisos = [];
    const lw = this.val(c.s("low_water_warning"));
    if (lw && !["no_warning", "unavailable", "unknown"].includes(lw)) avisos.push({ i: "mdi:water-alert", t: "Pouca água", c: AC.amber });
    BASE.forEach((b) => { const v = this.val(c.s(b.k)); if (v && !["installed", "unavailable", "unknown", "enabled"].includes(v)) avisos.push({ i: b.i, t: `${b.n}: ${v.replace(/_/g, " ")}`, c: AC.amber }); });
    const batCor = bat < 20 ? AC.red : bat < 50 ? AC.amber : AC.green;
    return `
      <div class="hero" style="--c:${E.c}">
        <div class="ring">
          <svg viewBox="0 0 144 144"><circle cx="72" cy="72" r="${R}" class="trk"/>
            <circle cx="72" cy="72" r="${R}" class="val" style="stroke-dasharray:${L};stroke-dashoffset:${L * (1 - (ativo ? prog : bat) / 100)};stroke:${ativo ? E.c : batCor}"/></svg>
          <div class="ri"><ha-icon icon="${E.i}" class="${E.k === "cleaning" ? "mov" : ""}"></ha-icon>
            <div class="pct">${ativo ? num(prog) + "%" : num(bat) + "%"}</div><div class="pl">${ativo ? "progresso" : "bateria"}</div></div>
        </div>
        <div class="ht">
          <div class="estado">${E.t}</div>
          <div class="l1">${l1}</div>${l2 ? `<div class="l2">${l2}</div>` : ""}
          ${avisos.length ? `<div class="chips">${avisos.map((x) => `<span class="chip" style="--c:${x.c}"><ha-icon icon="${x.i}"></ha-icon>${esc(x.t)}</span>`).join("")}</div>` : ""}
        </div>
      </div>`;
  }

  _nomeDivisao(room) {
    const m = { "Kitchen": "Cozinha", "Hallway": "Hall entrada", "Bathroom": "WC Geral", "Dining Room": "Sala jantar", "Living Room": "Sala estar",
      "Bathroom 2": "WC Suite", "Office": "Escritório", "Master Bedroom": "Suite", "Hallway 2": "Hall quartos", "Baby Room": "Quarto bebé" };
    return m[room] || room;
  }

  // ---------- ações ----------
  _btn(id, txt, icon, cls = "", dis = false) {
    const conf = this._confirm[id] > Date.now();
    return `<button class="act ${cls}" data-a="${id}" ${dis ? "disabled" : ""}><ha-icon icon="${icon}"></ha-icon>${conf ? "Toca outra vez" : txt}</button>`;
  }

  _acoes(E) {
    const c = this._c;
    const areas = this.val(c.modo_area) === "on";
    const sel = c.divisoes.filter((d) => this.val(d.e) === "on").length;
    let b = "", aviso = "";
    if (["docked", "idle"].includes(E.k)) {
      if (areas) {
        b = this._btn("start", sel ? `Limpar ${sel} ${sel === 1 ? "divisão" : "divisões"}` : "Escolhe as divisões", "mdi:play", "primary", !sel);
        if (!sel) aviso = "Escolhe pelo menos uma divisão em baixo.";
      } else b = this._btn("start", "Limpar a casa toda", "mdi:play", "primary");
    } else if (E.k === "cleaning" || E.k === "washing") {
      b = this._btn("pause", "Pausar", "mdi:pause", "warn") + this._btn("home", "Voltar à base", "mdi:home-import-outline");
    } else if (E.k === "paused" || E.k === "error") {
      b = this._btn("resume", "Retomar", "mdi:play", "primary") + this._btn("home", "Voltar à base", "mdi:home-import-outline") + this._btn("stop", "Parar", "mdi:stop", "danger");
    } else if (E.k === "returning") {
      b = this._btn("stop", "Parar", "mdi:stop", "danger");
    } else if (E.k === "drying") {
      b = this._btn("start", areas ? `Limpar ${sel} divisões` : "Limpar a casa toda", "mdi:play", "primary", areas && !sel);
    }
    const mini = `<button class="mini" data-a="locate"><ha-icon icon="mdi:map-marker-radius"></ha-icon>Localizar</button>
      <button class="mini" data-a="defs"><ha-icon icon="mdi:cog-outline"></ha-icon>Definições</button>`;
    return `<div class="acts">${b}</div>${aviso ? `<div class="aviso"><ha-icon icon="mdi:information-outline"></ha-icon>${aviso}</div>` : ""}<div class="minis">${mini}</div>`;
  }

  _modo() {
    const c = this._c, m = this.st(c.modo);
    if (!m) return "";
    const ops = m.attributes.options || Object.keys(MODOS);
    const pot = this.st(c.potencia);
    const hum = this.st(c.humidade);
    const aspira = m.state !== "mopping", esfrega = m.state !== "sweeping";
    let h = `<div class="sec"><div class="st"><ha-icon icon="mdi:tune-variant"></ha-icon>Modo de limpeza</div>
      <div class="seg">${ops.map((o) => `<button class="sg ${o === m.state ? "on" : ""}" data-modo="${o}"><ha-icon icon="${(MODOS[o] || {}).i || "mdi:broom"}"></ha-icon>${(MODOS[o] || { n: o }).n}</button>`).join("")}</div>`;
    if (aspira && pot && pot.state !== "unavailable") {
      h += `<div class="sub">Potência de aspiração</div><div class="seg s4">${(pot.attributes.options || []).map((o) =>
        `<button class="sg sm ${o === pot.state ? "on" : ""}" data-pot="${o}">${POTENCIA[o] || o}</button>`).join("")}</div>`;
    }
    if (esfrega && hum && hum.state !== "unavailable") {
      const v = parseFloat(hum.state), mn = hum.attributes.min ?? 1, mx = hum.attributes.max ?? 32;
      h += `<div class="sub">Humidade da mopa</div><div class="hum">
        <button class="rnd" data-hum="${v - 1}" ${v <= mn ? "disabled" : ""}><ha-icon icon="mdi:minus"></ha-icon></button>
        <div class="hb"><div style="width:${((v - mn) / (mx - mn)) * 100}%"></div></div><b>${num(v)}</b>
        <button class="rnd" data-hum="${v + 1}" ${v >= mx ? "disabled" : ""}><ha-icon icon="mdi:plus"></ha-icon></button></div>`;
    } else if (esfrega) {
      h += `<div class="nota">A humidade fica disponível quando a mopa estiver colocada.</div>`;
    }
    return h + `</div>`;
  }

  _divisoes(E) {
    const c = this._c, areas = this.val(c.modo_area) === "on";
    const ocupado = ["cleaning", "paused", "washing", "returning"].includes(E.k);
    let h = `<div class="sec"><div class="st"><ha-icon icon="mdi:floor-plan"></ha-icon>O que limpar</div>
      <div class="seg s2"><button class="sg ${!areas ? "on" : ""}" data-area="off" ${ocupado ? "disabled" : ""}><ha-icon icon="mdi:home-outline"></ha-icon>Casa toda</button>
      <button class="sg ${areas ? "on" : ""}" data-area="on" ${ocupado ? "disabled" : ""}><ha-icon icon="mdi:floor-plan"></ha-icon>Divisões</button></div>`;
    if (areas) {
      const sel = c.divisoes.filter((d) => this.val(d.e) === "on").length;
      h += `<div class="rooms">${c.divisoes.map((d) => `<button class="room ${this.val(d.e) === "on" ? "on" : ""}" data-room="${d.e}" ${ocupado ? "disabled" : ""}>
          <ha-icon icon="${d.i}"></ha-icon><span>${esc(d.n)}</span></button>`).join("")}</div>
        <div class="rowb"><button class="q" data-rooms="all" ${ocupado ? "disabled" : ""}>Todas</button>
        <button class="q" data-rooms="none" ${ocupado || !sel ? "disabled" : ""}>Limpar seleção</button></div>`;
    } else {
      h += `<div class="nota">O robô limpa todas as divisões pela ordem definida na app.</div>`;
    }
    return h + `</div>`;
  }

  // ---------- informação ----------
  _manutencao() {
    const c = this._c;
    const rows = PECAS.filter((x) => this.ok(c.s(x.k + "_left"))).map((x) => {
      const pct = this.n(c.s(x.k + "_left")), hrs = this.n(c.s(x.k + "_time_left"));
      const col = pct < 10 ? AC.red : pct < 25 ? AC.amber : AC.green;
      const id = "reset_" + (x.reset || x.k);
      const conf = this._confirm[id] > Date.now();
      return `<div class="pc"><ha-icon icon="${x.i}" style="color:${col}"></ha-icon>
        <div class="pm"><div class="pn"><span>${x.n}</span><span style="color:${col}">${num(pct)}%${isFinite(hrs) ? ` · ${num(hrs)} h` : ""}</span></div>
        <div class="bar"><div style="width:${Math.max(2, pct)}%;background:${col}"></div></div></div>
        <button class="rs ${conf ? "on" : ""}" data-a="${id}" title="Marcar como trocado">${conf ? "Confirmar" : "Já troquei"}</button></div>`;
    }).join("");
    const urg = PECAS.filter((x) => this.n(c.s(x.k + "_left")) < 25).map((x) => x.n.toLowerCase());
    const base = BASE.filter((b) => this.st(c.s(b.k))).map((b) => {
      const v = this.val(c.s(b.k)), okk = ["installed", "enabled"].includes(v);
      return `<span class="chip" style="--c:${okk ? AC.green : AC.amber}"><ha-icon icon="${b.i}"></ha-icon>${b.n}${okk ? "" : ": " + esc((v || "").replace(/_/g, " "))}</span>`;
    }).join("");
    return `<div class="sec"><div class="st"><ha-icon icon="mdi:wrench-outline"></ha-icon>Manutenção</div>
      ${urg.length ? `<div class="aviso"><ha-icon icon="mdi:alert-outline"></ha-icon>A trocar ou limpar em breve: ${urg.join(", ")}.</div>` : ""}
      <div class="pcs">${rows}</div>
      ${base ? `<div class="sub">Base</div><div class="chips">${base}</div>` : ""}</div>`;
  }

  _estatisticas() {
    const c = this._c, hist = this._historico();
    const n = this.n(c.s("cleaning_count")), m2 = this.n(c.s("total_cleaned_area")), min = this.n(c.s("total_cleaning_time"));
    const d30 = hist.filter((x) => Date.now() - x.t < 30 * 864e5);
    const item = (t, v, s) => `<div class="kv"><span>${t}</span><b>${v}</b>${s ? `<small>${s}</small>` : ""}</div>`;
    const ult = hist.slice(0, 4).map((x) => `<div class="hl"><span>${dataCurta(new Date(x.t))}, ${hm(new Date(x.t))}</span><span>${num(x.m2)} m² · ${num(x.min)} min${x.ok ? "" : " · interrompida"}</span></div>`).join("");
    return `<div class="sec"><div class="st"><ha-icon icon="mdi:chart-box-outline"></ha-icon>Estatísticas</div>
      <div class="kvs">
        ${item("Últimos 30 dias", `${d30.length} limpezas`, d30.length ? `${num(d30.reduce((a, x) => a + x.m2, 0))} m²` : "")}
        ${item("Média por limpeza", n > 0 ? `${num(m2 / n)} m²` : "—", n > 0 ? `${num(min / n)} min` : "")}
        ${item("Total", isFinite(n) ? `${num(n)} limpezas` : "—", isFinite(m2) ? `${num(m2)} m² · ${num(min / 60)} h` : "")}
      </div>
      ${ult ? `<div class="sub">Últimas limpezas</div><div class="hist">${ult}</div>` : ""}</div>`;
  }

  _automacao() {
    const c = this._c, a = this.st(c.auto);
    if (!a) return "";
    const on = a.state === "on", feita = this.val(c.feita_hoje) === "on";
    const lt = a.attributes.last_triggered ? new Date(a.attributes.last_triggered) : null;
    return `<div class="sec"><div class="st"><ha-icon icon="mdi:calendar-clock"></ha-icon>Limpeza automática</div>
      <button class="op ${on ? "on" : ""}" data-a="auto"><ha-icon icon="mdi:robot-vacuum"></ha-icon><div class="ot"><b>${on ? "Ligada" : "Desligada"}</b><small>${esc(c.auto_texto)}</small></div><span class="sw"></span></button>
      <div class="chips">${feita ? `<span class="chip" style="--c:${AC.green}"><ha-icon icon="mdi:check"></ha-icon>Já limpou hoje</span>` : ""}
      ${lt ? `<span class="chip" style="--c:${AC.muted}"><ha-icon icon="mdi:history"></ha-icon>Última automática ${ago(lt)}</span>` : ""}</div></div>`;
  }

  _render() {
    if (!this._h || !this.shadowRoot) return;
    const E = this._estado(), p = this._c.parte;
    const ctl = this._hero(E) + this._acoes(E) + this._divisoes(E) + this._modo();
    const inf = this._manutencao() + this._automacao() + this._estatisticas();
    this.shadowRoot.innerHTML = `<style>${AspiradorCard.css}</style>
      <ha-card><div class="col">${p === "controlo" ? ctl : p === "info" ? inf : ctl + inf}</div></ha-card>`;
    this._bind();
  }

  _bind() {
    const R = this.shadowRoot, c = this._c;
    const confirmar = (id, fn) => {
      if (this._confirm[id] > Date.now()) { this._confirm[id] = 0; fn(); }
      else { this._confirm[id] = Date.now() + 4000; setTimeout(() => this._render(), 4100); }
      this._render();
    };
    R.querySelectorAll("[data-a]").forEach((b) => b.addEventListener("click", () => {
      const a = b.dataset.a, v = { entity_id: c.vacuum };
      if (a === "start") {
        if (this.val(c.modo_area) === "on") this.call("script", "turn_on", { entity_id: c.script_areas });
        else this.call("vacuum", "start", v);
      }
      if (a === "resume") this.call("vacuum", "start", v);
      if (a === "pause") this.call("vacuum", "pause", v);
      if (a === "home") this.call("vacuum", "return_to_base", v);
      if (a === "locate") this.call("vacuum", "locate", v);
      if (a === "stop") confirmar("stop", () => this.call("vacuum", "stop", v));
      if (a === "auto") this.call("automation", this.val(c.auto) === "on" ? "turn_off" : "turn_on", { entity_id: c.auto });
      if (a === "defs") {
        history.pushState(null, "", location.pathname + location.search + c.popup);
        window.dispatchEvent(new Event("location-changed"));
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      }
      if (a.startsWith("reset_")) confirmar(a, () => this.call("button", "press", { entity_id: c.reset(a.slice(6)) }));
    }));
    R.querySelectorAll("[data-modo]").forEach((b) => b.addEventListener("click", () => this.call("select", "select_option", { entity_id: c.modo, option: b.dataset.modo })));
    R.querySelectorAll("[data-pot]").forEach((b) => b.addEventListener("click", () => this.call("select", "select_option", { entity_id: c.potencia, option: b.dataset.pot })));
    R.querySelectorAll("[data-hum]").forEach((b) => b.addEventListener("click", () => this.call("number", "set_value", { entity_id: c.humidade, value: +b.dataset.hum })));
    R.querySelectorAll("[data-area]").forEach((b) => b.addEventListener("click", () => {
      if ((this.val(c.modo_area) === "on") !== (b.dataset.area === "on")) this.call("input_boolean", b.dataset.area === "on" ? "turn_on" : "turn_off", { entity_id: c.modo_area });
    }));
    R.querySelectorAll("[data-room]").forEach((b) => b.addEventListener("click", () => this.call("input_boolean", "toggle", { entity_id: b.dataset.room })));
    R.querySelectorAll("[data-rooms]").forEach((b) => b.addEventListener("click", () =>
      this.call("input_boolean", b.dataset.rooms === "all" ? "turn_on" : "turn_off", { entity_id: c.divisoes.map((d) => d.e) })));
  }

  static get css() {
    return `
      :host { display:block; container-type:inline-size; }
      ha-card { background: rgba(0,0,0,0.24); border:1px solid rgba(255,255,255,0.15); border-radius:20px; box-shadow:none; padding:14px; color:#fff; }
      ha-icon { --mdc-icon-size:18px; }
      .col { display:flex; flex-direction:column; gap:12px; }
      .hero { display:flex; gap:16px; align-items:center; padding:12px; border-radius:18px;
        background: linear-gradient(135deg, color-mix(in srgb, var(--c) 16%, transparent), rgba(255,255,255,0.02));
        border:1px solid color-mix(in srgb, var(--c) 35%, transparent); }
      .ring { position:relative; width:124px; height:124px; flex:none; }
      .ring svg { width:100%; height:100%; transform:rotate(-90deg); }
      .trk { fill:none; stroke:${AC.faint}; stroke-width:9; }
      .val { fill:none; stroke-width:9; stroke-linecap:round; transition: stroke-dashoffset .8s ease; }
      .ri { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
      .ri ha-icon { --mdc-icon-size:34px; color:var(--c); }
      .ri ha-icon.mov { animation: mov 2.6s ease-in-out infinite; }
      @keyframes mov { 25% { transform: translateX(-4px) rotate(-6deg); } 75% { transform: translateX(4px) rotate(6deg); } }
      .pct { font-size:19px; font-weight:700; line-height:1.1; margin-top:2px; }
      .pl { font-size:10.5px; color:${AC.muted}; }
      .ht { min-width:0; }
      .estado { font-size:24px; font-weight:750; color:var(--c); line-height:1.15; }
      .l1 { font-size:15px; margin-top:6px; }
      .l2 { font-size:12.5px; color:${AC.muted}; margin-top:2px; }
      .chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
      .chip { display:inline-flex; align-items:center; gap:4px; font-size:11.5px; padding:3px 8px; border-radius:999px;
        color:var(--c); background: color-mix(in srgb, var(--c) 12%, transparent); border:1px solid color-mix(in srgb, var(--c) 30%, transparent); }
      .chip ha-icon { --mdc-icon-size:14px; }
      .acts { display:flex; gap:8px; flex-wrap:wrap; }
      .act { flex:1; min-width:120px; display:flex; align-items:center; justify-content:center; gap:8px; font:inherit; font-size:15.5px; font-weight:650;
        padding:15px 12px; border-radius:16px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color:#fff; cursor:pointer; }
      .act ha-icon { --mdc-icon-size:22px; }
      .act.primary { background: linear-gradient(135deg, ${AC.teal}, #0EA5A4); border-color: transparent; }
      .act.warn { background: color-mix(in srgb, ${AC.amber} 22%, transparent); border-color: color-mix(in srgb, ${AC.amber} 55%, transparent); }
      .act.danger { background: color-mix(in srgb, ${AC.red} 16%, transparent); border-color: color-mix(in srgb, ${AC.red} 45%, transparent); }
      .act:disabled { opacity:.4; cursor:not-allowed; }
      .minis { display:flex; gap:8px; }
      .mini { flex:1; display:flex; align-items:center; justify-content:center; gap:6px; font:inherit; font-size:13px; color:#fff; padding:9px; border-radius:12px; cursor:pointer;
        background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.10); }
      .mini ha-icon { color:${AC.muted}; }
      .aviso { display:flex; gap:8px; align-items:flex-start; font-size:13px; line-height:1.4; padding:9px 12px; border-radius:12px;
        background: rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.25); margin-bottom:8px; }
      .aviso ha-icon { color:${AC.amber}; flex:none; }
      .sec { background: rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:12px; }
      .st { display:flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; color:${AC.muted}; margin-bottom:10px; text-transform:uppercase; letter-spacing:.04em; }
      .sub { font-size:12px; color:${AC.muted}; margin:12px 0 6px; }
      .nota { font-size:12px; color:${AC.muted}; margin-top:8px; }
      .seg { display:grid; grid-template-columns: repeat(2, 1fr); gap:6px; }
      .seg.s2 { grid-template-columns: 1fr 1fr; }
      .seg.s4 { grid-template-columns: repeat(4, 1fr); }
      .sg { display:flex; align-items:center; justify-content:center; gap:6px; font:inherit; font-size:13.5px; color:#fff; padding:11px 8px; border-radius:12px; cursor:pointer;
        background: rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.10); text-align:center; }
      .sg.sm { font-size:12.5px; padding:9px 4px; }
      .sg ha-icon { color:${AC.muted}; }
      .sg.on { background: rgba(60,200,180,0.18); border-color: rgba(60,200,180,0.65); }
      .sg.on ha-icon { color:${AC.teal}; }
      .sg:disabled, .room:disabled, .q:disabled, .rnd:disabled { opacity:.4; cursor:not-allowed; }
      .rooms { display:grid; grid-template-columns: repeat(auto-fill, minmax(108px, 1fr)); gap:6px; margin-top:10px; }
      .room { display:flex; align-items:center; gap:6px; font:inherit; font-size:13px; color:#fff; padding:10px 8px; border-radius:12px; cursor:pointer;
        background: rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.10); text-align:left; }
      .room ha-icon { color:${AC.muted}; flex:none; }
      .room span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .room.on { background: rgba(60,200,180,0.18); border-color: rgba(60,200,180,0.65); }
      .room.on ha-icon { color:${AC.teal}; }
      .rowb { display:flex; gap:6px; margin-top:8px; }
      .q { font:inherit; font-size:12.5px; color:#fff; padding:6px 12px; border-radius:999px; cursor:pointer; background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.10); }
      .hum { display:flex; align-items:center; gap:10px; }
      .hb { flex:1; height:8px; border-radius:4px; background:${AC.faint}; overflow:hidden; }
      .hb div { height:100%; background:${AC.blue}; border-radius:4px; }
      .rnd { width:40px; height:40px; border-radius:50%; flex:none; display:grid; place-items:center; cursor:pointer; color:#fff;
        background: rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.14); }
      .pcs { display:flex; flex-direction:column; gap:10px; }
      .pc { display:flex; align-items:center; gap:10px; }
      .pm { flex:1; min-width:0; }
      .pn { display:flex; justify-content:space-between; font-size:13.5px; gap:6px; }
      .bar { height:6px; border-radius:3px; background:${AC.faint}; margin-top:5px; overflow:hidden; }
      .bar div { height:100%; border-radius:3px; }
      .rs { font:inherit; font-size:11.5px; color:#fff; padding:6px 10px; border-radius:999px; cursor:pointer; flex:none;
        background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); }
      .rs.on { background: color-mix(in srgb, ${AC.red} 22%, transparent); border-color: color-mix(in srgb, ${AC.red} 55%, transparent); }
      .kvs { display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; }
      @container (max-width: 360px) { .kvs { grid-template-columns: 1fr 1fr; } .seg.s4 { grid-template-columns: 1fr 1fr; } }
      .kv { display:flex; flex-direction:column; }
      .kv span { font-size:11.5px; color:${AC.muted}; } .kv b { font-size:16px; font-weight:650; } .kv small { font-size:11px; color:${AC.muted}; }
      .hist { display:flex; flex-direction:column; gap:4px; }
      .hl { display:flex; justify-content:space-between; gap:8px; font-size:12.5px; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.06); }
      .hl span:last-child { color:${AC.muted}; }
      .op { width:100%; display:flex; align-items:center; gap:10px; font:inherit; color:#fff; padding:12px; border-radius:14px; cursor:pointer; text-align:left;
        background: rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.10); }
      .op .ot { flex:1; display:flex; flex-direction:column; } .op small { font-size:11.5px; color:${AC.muted}; }
      .op ha-icon { color:${AC.muted}; }
      .op .sw { width:38px; height:22px; border-radius:999px; background: rgba(255,255,255,0.18); position:relative; flex:none; }
      .op .sw::after { content:""; position:absolute; top:3px; left:3px; width:16px; height:16px; border-radius:50%; background:#fff; transition:left .2s; }
      .op.on { border-color: rgba(60,200,180,0.55); background: rgba(60,200,180,0.12); }
      .op.on ha-icon { color:${AC.teal}; } .op.on .sw { background:${AC.teal}; } .op.on .sw::after { left:19px; }
      @container (max-width: 400px) { .ring { width:104px; height:104px; } .estado { font-size:21px; } .hero { gap:12px; } }
    `;
  }
}

if (!customElements.get("aspirador-card")) customElements.define("aspirador-card", AspiradorCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "aspirador-card", name: "Robô de limpeza", description: "Estado, divisões, modo, manutenção, estatísticas e limpeza automática do robô (Dreame)." });
console.info(`%c ASPIRADOR-CARD %c v${ASP_VERSION} `, "background:#3CC8B4;color:#000", "");
