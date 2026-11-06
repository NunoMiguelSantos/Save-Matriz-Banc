// =====================================================================
//  casa-card · página inicial da casa (telemóvel e tablet)
// ---------------------------------------------------------------------
//  Este ficheiro tem o FUNCIONAMENTO do cartão. Normalmente não precisas
//  de lhe mexer:
//    • divisões, luzes, estores, cenários, cores das fitas e alertas
//      configuram-se no YAML do cartão, no próprio dashboard;
//    • cores e tamanhos do visual estão em estilos.js.
//  Ver LEIA-ME.md (na mesma pasta) para exemplos.
//
//  Se alterares este ficheiro ou o estilos.js, sobe o número ?v= do
//  recurso em Definições → Painéis → ⋮ → Recursos.
// =====================================================================

// os estilos vêm do estilos.js (com o mesmo ?v= deste ficheiro, para o browser não usar uma cópia antiga)
const ESTILOS = await import(new URL("./estilos.js", import.meta.url).href + new URL(import.meta.url).search);

const VERSAO = "2.5.3";

// ---------------------------------------------------------------------
//  Valores por omissão. Tudo o que estiver no YAML do cartão substitui
//  estes valores. Os dados da casa (divisões, cenários, alertas...) não
//  estão aqui: estão no YAML do cartão.
// ---------------------------------------------------------------------
const PADRAO = {
  layout: "phone", // "phone" (telemóvel) ou "tablet"
  tablet_height: "calc(100vh - 128px)", // altura do ecrã do tablet (128px = barra de navegação)
  return_after: null, // segundos sem toques até voltar a "Casa toda" (tablet: 60 por omissão; telemóvel: desligado)
  humidity_alert: 80, // limite de humidade se a divisão não tiver hum_limit
  energy_view: "energypainel", // vista para onde vão os botões "Ver energia"
  vacuum_view: "vacuum", // vista para onde vai o botão "Ver robô"
  weather: null, // tempo agora e previsão por hora (ex.: met.no)
  weather_days: null, // previsão por dias na janela da meteorologia (ex.: IPMA); sem isto usa weather
  weather_name: null, // nome no topo da janela (por omissão o nome de weather_days)
  alarm: null,
  top_alarm: true, // escudo do alarme no topo do telemóvel (false = não mostra)
  water_alert: null,
  boiler: null,
  all_cover: null,
  persons: [],
  rooms: [],
  scenes: [],
  alerts: {},
  led_whites: [],
  led_colors: [],
  plan: null, // planta 3D (só tablet)
  history_avg: "sensor.temperatura_media_da_casa", // temperatura média da casa (texto "média" e janela do histórico)
  history_rooms: null, // divisões da janela do histórico (por omissão HIST_ROOMS, em baixo)
  calendars: null, // calendários da janela do calendário: [{entity, name, color}] (por omissão todos os calendar.*)
};

// divisões da janela do histórico: t = temperatura, h = humidade (precisam de state_class: measurement)
const HIST_ROOMS = [
  { id: "sala", name: "Sala", t: "sensor.sensorsalas_temperature", h: "sensor.sensorsalas_humidity" },
  { id: "cozinha", name: "Cozinha", t: "sensor.sensorcozinha_temperature", h: "sensor.sensorcozinha_humidity" },
  { id: "suite", name: "Suite", t: "sensor.esp_th_suite_temperatura", h: "sensor.esp_th_suite_humidade" },
  { id: "quarto2", name: "Quarto 2", t: "sensor.sensorroom2_temperature", h: "sensor.sensorroom2_humidity" },
  { id: "gaming", name: "Gaming room", t: "sensor.sensorthescritorio_temperature", h: "sensor.sensorthescritorio_humidity" },
  { id: "wcg", name: "WC geral", t: "sensor.lumi_lumi_sens_temperature", h: "sensor.lumi_lumi_sens_humidity" },
  { id: "wcs", name: "WC suite", t: "sensor.sensorwcsuite_temperature", h: "sensor.sensorwcsuite_humidity" },
];
const p2 = (n) => String(n).padStart(2, "0");

// botões de intensidade das fitas: [nome, %]
const LEVELS = [
  ["Noite", 5],
  ["Suave", 25],
  ["Médio", 55],
  ["Pleno", 100],
];
// modos do ar condicionado: [modo no HA, ícone, nome no botão]
const MODES = [
  ["off", "mdi:power", "Off"],
  ["cool", "mdi:snowflake", "Frio"],
  ["heat", "mdi:fire", "Calor"],
  ["dry", "mdi:water-percent", "Seco"],
];
// velocidades e presets do AC (só aparecem os que o aparelho suporta)
const FANS = [
  ["auto", "Auto"],
  ["low", "Baixo"],
  ["medium", "Médio"],
  ["high", "Alto"],
];
const PRESETS = [
  ["none", "Off"],
  ["eco", "Eco"],
  ["boost", "Boost"],
  ["sleep", "Sleep"],
];
// ícone para cada estado do tempo
const WX = {
  "clear-night": "mdi:weather-night",
  cloudy: "mdi:weather-cloudy",
  fog: "mdi:weather-fog",
  hail: "mdi:weather-hail",
  lightning: "mdi:weather-lightning",
  "lightning-rainy": "mdi:weather-lightning-rainy",
  partlycloudy: "mdi:weather-partly-cloudy",
  pouring: "mdi:weather-pouring",
  rainy: "mdi:weather-rainy",
  snowy: "mdi:weather-snowy",
  "snowy-rainy": "mdi:weather-snowy-rainy",
  sunny: "mdi:weather-sunny",
  windy: "mdi:weather-windy",
};
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function num(v, def = null) {
  const n = Number(v);
  return v !== null && v !== "" && Number.isFinite(n) ? n : def;
}
function fmt1(n) {
  return Number(n).toLocaleString("pt-PT", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
const rgbCss = (a) => (Array.isArray(a) && a.length >= 3 ? `rgb(${a[0]},${a[1]},${a[2]})` : null);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const dist4 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2], (a[3] || 0) - (b[3] || 0));
const hexRgb = (h) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(h || "");
  return m ? [0, 2, 4].map((k) => parseInt(m[1].substr(k, 2), 16)) : null;
};
class CasaTlmCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._sig = "";
    this._busy = false;
    this._sheet = null;
    this._portal = null;
    this._pushed = false;
    this._pendTemp = {};
    this._gateAsk = false;
    this._confirm = null;
    this._zimg = null;
    this._zc = {};
    this._ro = new ResizeObserver(() => this._fitPlan());
    try {
      this._sel = localStorage.getItem("casa-tlm-sel") || "casa";
    } catch (_) {
      this._sel = "casa";
    }
    this._onPop = () => {
      if (this._sheet && location.hash !== "#casa-painel") {
        this._pushed = false;
        this._closeSheet();
      }
    };
    const sr = this.shadowRoot;
    sr.addEventListener("click", (e) => this._onClick(e));
    sr.addEventListener("input", (e) => this._onInput(e));
    sr.addEventListener("change", (e) => this._onChange(e));
    sr.addEventListener("pointerdown", (e) => {
      this._armIdle();
      const g = e.target.closest?.(".rng");
      if (g) this._drag = { g, x0: e.clientX, y0: e.clientY, id: e.pointerId, on: false, p: null };
    });
    sr.addEventListener("pointermove", (e) => this._dragMove(e));
    sr.addEventListener("pointerup", () => this._dragEnd());
    sr.addEventListener("pointercancel", () => this._dragCancel());
  }
  setConfig(config) {
    this._cfg = { ...PADRAO, ...(config || {}) };
    this._ids = null;
  }
  static getStubConfig() {
    return {};
  }
  getCardSize() {
    return 12;
  }
  get _tab() {
    return this._cfg?.layout === "tablet";
  }
  getGridOptions() {
    return { columns: "full", rows: "auto" };
  }
  connectedCallback() {
    window.addEventListener("popstate", this._onPop);
    window.addEventListener("hashchange", this._onPop);
    window.addEventListener("location-changed", this._onPop);
    this._timer = setInterval(() => this._render(), 30000);
    this._ro.observe(this);
    this._armIdle();
  }
  disconnectedCallback() {
    clearInterval(this._timer);
    clearTimeout(this._idle);
    this._ro.disconnect();
    window.removeEventListener("popstate", this._onPop);
    window.removeEventListener("hashchange", this._onPop);
    window.removeEventListener("location-changed", this._onPop);
    this._pushed = false;
    this._closeSheet();
  }
  set hass(hass) {
    this._hass = hass;
    const sig = this._signature();
    if (sig !== this._sig) {
      this._sig = sig;
      this._render();
      if (this._sheet) this._renderSheet();
    }
  }
  // ---------- dados ----------
  _st(id) {
    return id ? this._hass?.states?.[id] : undefined;
  }
  _on(id) {
    return this._st(id)?.state === "on";
  }
  // lista de todas as entidades que o cartão usa (para saber quando redesenhar)
  _watch() {
    if (this._ids) return this._ids;
    const c = this._cfg,
      A = c.alerts || {},
      ids = [
        c.weather,
        c.weather_days,
        c.alarm,
        c.water_alert,
        c.boiler,
        c.history_avg,
        ...(c.history_rooms || HIST_ROOMS).flatMap((r) => [r.t, r.h]),
        ...(c.scenes || []).map((x) => (typeof x.data?.entity_id === "string" && x.data.entity_id.startsWith("script.") ? x.data.entity_id : null)),
        ...(c.persons || []).map((p) => p.entity),
        A.base_power,
        A.base_limit,
        A.unidentified,
        A.fridge,
        A.backup_stale,
        A.dishwasher_door,
        A.vacuum_error,
        A.vacuum_water,
        ...(A.vacuum_parts || []).map((x) => x.entity),
        ...(A.batteries || []).map((x) => x.entity),
        ...(A.offline || []).map((x) => x.entity),
      ];
    for (const r of c.rooms) {
      ids.push(r.temp, r.hum, r.climate, r.heat, r.fan, r.camera, r.privacy, r.media, r.gate?.sensor, r.hum_limit, r.fan_timeout);
      (r.lights || []).forEach((l) => ids.push(l.entity));
      (r.covers || []).forEach((v) => ids.push(v.entity));
    }
    this._ids = ids.filter(Boolean);
    return this._ids;
  }
  // "impressão digital" do estado atual: só se redesenha quando isto muda
  _signature() {
    const s = this._hass?.states || {},
      A = this._cfg.alerts || {};
    return this._watch()
      .map((id) => {
        const o = s[id];
        if (!o) return "-";
        // a potência não identificada muda a cada segundo: só interessa se passou o limite (senão o ecrã e os painéis estão sempre a redesenhar)
        if (id === A.unidentified) return String(num(o.state, 0) > (A.unidentified_limit ?? 800));
        const a = o.attributes;
        return [
          o.state,
          a.current_position,
          a.temperature,
          a.current_temperature,
          a.brightness,
          a.rgb_color,
          a.rgbw_color,
          a.color_temp_kelvin,
          a.fan_mode,
          a.preset_mode,
        ].join("|");
      })
      .join(";");
  }
  _room(id) {
    return this._cfg.rooms.find((r) => r.id === id);
  }
  _limit(r) {
    return num(this._st(r.hum_limit)?.state, this._cfg.humidity_alert);
  }
  _lightOn(l) {
    return this._on(l.entity);
  }
  _roomLit(r) {
    return (r.lights || []).some((l) => this._lightOn(l));
  }
  _pos(v) {
    const o = this._st(v.entity);
    if (!o) return null;
    return Math.round(num(o.attributes.current_position, o.state === "open" ? 100 : 0));
  }
  _hvac(r) {
    return r.climate ? this._st(r.climate)?.state || "off" : null;
  }
  _acOn(r) {
    const m = this._hvac(r);
    return m && m !== "off" && m !== "unavailable";
  }
  _acIcon(m) {
    return m === "heat"
      ? ["mdi:fire", "h"]
      : m === "cool"
        ? ["mdi:snowflake", "c"]
        : m === "dry"
          ? ["mdi:water-percent", "c"]
          : m === "fan_only"
            ? ["mdi:fan", "c"]
            : ["mdi:thermostat-auto", "c"];
  }
  // ícones de estado de uma divisão: luz, AC, aquecimento, ventilação, estore aberto
  _status(r) {
    const s = [];
    if (this._roomLit(r)) s.push(["mdi:lightbulb", "l"]);
    if (this._acOn(r)) s.push(this._acIcon(this._hvac(r)));
    if (r.heat && this._on(r.heat)) s.push(["mdi:radiator", "h"]);
    if (r.fan && this._on(r.fan)) s.push(["mdi:fan", "f"]);
    if ((r.covers || []).some((v) => (this._pos(v) || 0) > 0)) s.push(["mdi:window-shutter-open", "b"]);
    return s;
  }
  _gateClosed(r) {
    const o = this._st(r.gate?.sensor);
    return o ? o.state === (r.gate.closed_state || "on") : null;
  }
  _path(view) {
    return `/${location.pathname.split("/")[1] || "lovelace"}/${view}`;
  }
  // ---------- ALERTAS ----------
  // cada alerta: k = id, lvl = gravidade (bad/warn/off/info), t = título, s = detalhe,
  // btn + act = botão para resolver aqui, phys = texto para os que se resolvem fisicamente
  _alerts() {
    const c = this._cfg,
      A = c.alerts || {},
      out = [],
      S = (id) => this._st(id)?.state;
    const bad = (v) => v && !["unavailable", "unknown"].includes(v);
    if (this._on(c.water_alert))
      out.push({
        k: "water",
        lvl: "bad",
        icon: "mdi:water-alert",
        t: "Esvaziar a água da caldeira",
        s: "O sensor de água (Shelly Flood) detetou água",
        phys: "Some quando o sensor secar",
      });
    const err = S(A.vacuum_error);
    if (bad(err) && err !== "no_error")
      out.push({
        k: "verr",
        lvl: "bad",
        icon: "mdi:robot-vacuum-alert",
        t: "O robô precisa de ajuda",
        s: this._st(A.vacuum_error).attributes.description || err.replace(/_/g, " "),
        btn: "Ver robô",
        act: { nav: this._path(c.vacuum_view) },
      });
    const wat = S(A.vacuum_water);
    if (bad(wat) && wat !== "no_warning")
      out.push({
        k: "vwat",
        lvl: "warn",
        icon: "mdi:water-off",
        t: "Robô: pouca água",
        s: "Enche o depósito de água limpa ou esvazia o da água suja",
        phys: "Some quando a base tiver água",
      });
    for (const r of c.rooms) {
      if (r.gate && this._gateClosed(r) === false)
        out.push({
          k: "gate",
          lvl: "bad",
          icon: "mdi:garage-open",
          t: "Portão da garagem aberto",
          s: "",
          btn: "Ver portão",
          act: { select: r.id },
        });
      const h = num(this._st(r.hum)?.state);
      if (r.fan && h != null && h > this._limit(r) && !this._on(r.fan))
        out.push({
          k: "hum-" + r.id,
          lvl: "warn",
          icon: "mdi:water-percent-alert",
          t: `${r.name} com ${Math.round(h)}% de humidade`,
          s: `Limite ${Math.round(this._limit(r))}%`,
          btn: "Ligar ventilação",
          act: { call: ["fan", "turn_on", { entity_id: r.fan }] },
        });
    }
    for (const p of A.vacuum_parts || []) {
      const v = num(S(p.entity));
      if (v != null && v < (A.parts_limit ?? 10))
        out.push({
          k: "vp-" + p.entity,
          lvl: "warn",
          icon: "mdi:robot-vacuum",
          t: `Robô: ${p.name} a ${Math.round(v)}%`,
          s: "Troca ou limpa e depois confirma aqui",
          btn: "Já troquei",
          confirm: !!p.reset,
          act: p.reset ? { call: ["button", "press", { entity_id: p.reset }] } : { nav: this._path(c.vacuum_view) },
        });
    }
    const base = num(S(A.base_power)),
      lim = num(S(A.base_limit));
    if (base != null && lim != null && base > lim)
      out.push({
        k: "base",
        lvl: "warn",
        icon: "mdi:flash-alert",
        t: `Consumo base alto: ${Math.round(base)} W`,
        s: `Limite ${Math.round(lim)} W · média da noite (02h–05h)`,
        btn: "Ver energia",
        act: { nav: this._path(c.energy_view) },
      });
    const un = num(S(A.unidentified));
    if (un != null && un > (A.unidentified_limit ?? 800))
      out.push({
        k: "unid",
        lvl: "warn",
        icon: "mdi:flash-alert",
        t: `Consumo não identificado: ${Math.round(un)} W`,
        s: "Algo não medido está ligado, ou um sensor falhou",
        btn: "Ver energia",
        act: { nav: this._path(c.energy_view) },
      });
    if (this._on(A.fridge))
      out.push({
        k: "fridge",
        lvl: "warn",
        icon: "mdi:fridge-alert",
        t: "Frigorífico com consumo alto",
        s: "A porta pode ter ficado mal fechada",
        phys: "Some quando o consumo normalizar",
      });
    for (const b of A.batteries || []) {
      const v = num(S(b.entity));
      if (v != null && v < (A.battery_limit ?? 15))
        out.push({
          k: "bat-" + b.entity,
          lvl: "warn",
          icon: "mdi:battery-alert-variant-outline",
          t: `Pilha fraca: ${b.name} (${Math.round(v)}%)`,
          s: "Troca a pilha em breve",
          phys: "Some quando trocares a pilha",
        });
    }
    const off = (A.offline || []).filter((o) => S(o.entity) === "unavailable");
    if (off.length)
      out.push({
        k: "off",
        lvl: "off",
        icon: "mdi:access-point-network-off",
        t: off.length === 1 ? `${off[0].name}: sensor sem sinal` : `${off.length} sensores sem sinal`,
        s: off.map((o) => o.name).join(", "),
        phys: "Verifica as pilhas ou a rede Zigbee",
      });
    if (this._on(A.backup_stale))
      out.push({
        k: "bk",
        lvl: "warn",
        icon: "mdi:cloud-alert",
        t: "Backup atrasado",
        s: "O último backup automático já tem alguns dias",
        phys: "Vê em Definições → Sistema → Cópias de segurança",
      });
    if (this._on(A.dishwasher_door))
      out.push({
        k: "dw",
        lvl: "info",
        icon: "mdi:dishwasher-alert",
        t: "Porta da máquina da louça aberta",
        s: "",
        phys: "Some quando fechares a porta",
      });
    const ord = { bad: 0, warn: 1, off: 2, info: 3 };
    return out.sort((a, b) => ord[a.lvl] - ord[b.lvl]);
  }
  _alertRow(a) {
    const lv = { bad: "urgente", warn: "atenção", off: "sem sinal", info: "info" }[a.lvl];
    return `<div class="arow"><span class="dot d-${a.lvl}"></span><span class="at"><b>${esc(a.t)}</b></span>${
      a.btn
        ? `<button class="abtn ${this._confirm === a.k ? "cf" : ""}" data-alert="${esc(a.k)}">${this._confirm === a.k ? "Confirmar?" : esc(a.btn)}</button>`
        : `<small>${lv}</small>`
    }</div>`;
  }
  _alertsCard(al) {
    if (!al.length)
      return `<div class="card"><div class="lab">Alertas</div><div class="allok"><ha-icon icon="mdi:check"></ha-icon>Tudo em ordem</div></div>`;
    return `<div class="card"><div class="lab">Alertas<em>${al.length}</em></div>${al
      .slice(0, 3)
      .map((a) => this._alertRow(a))
      .join("")}
${al.length > 3 ? `<button class="more" data-allalerts>Ver todos os alertas (${al.length}) ›</button>` : `<button class="more" data-allalerts>Ver detalhes ›</button>`}</div>`;
  }
  _doAlert(key) {
    const a = this._alerts().find((x) => x.k === key);
    if (!a || !a.act) return;
    if (a.confirm && this._confirm !== key) {
      this._confirm = key;
      this._render();
      if (this._sheet) this._renderSheet();
      return;
    }
    this._confirm = null;
    const x = a.act;
    if (x.nav) {
      if (this._sheet) this._closeSheet();
      setTimeout(() => {
        history.pushState(null, "", x.nav);
        window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
      }, 60);
      return;
    }
    if (x.select) {
      if (this._sheet) this._closeSheet();
      return this._select(x.select);
    }
    if (x.call) this._call(...x.call);
    this._render();
    if (this._sheet) this._renderSheet();
  }
  _ledColor(l) {
    const o = this._st(l.entity);
    return rgbCss(o?.attributes?.rgb_color) || "#ffd9a0";
  }
  _whites() {
    return this._cfg.led_whites || [];
  }
  _colors() {
    return this._cfg.led_colors || [];
  }
  // descobre qual das predefinições (ex.: "w2" = 3.º branco, "c0" = 1.ª cor) está aplicada agora na fita
  _ledPreset(l) {
    const a = this._st(l.entity)?.attributes || {},
      W = this._whites(),
      C = this._colors();
    if (a.color_mode === "color_temp" && a.color_temp_kelvin) {
      let best = null;
      W.forEach((w, i) => {
        if (
          w.kelvin &&
          Math.abs(w.kelvin - a.color_temp_kelvin) <= 250 &&
          (best == null || Math.abs(w.kelvin - a.color_temp_kelvin) < Math.abs(W[best].kelvin - a.color_temp_kelvin))
        )
          best = i;
      });
      return best == null ? null : "w" + best;
    }
    if (a.color_mode === "rgbw" && Array.isArray(a.rgbw_color)) {
      const v = a.rgbw_color;
      // o branco (4.º canal) pode estar mais baixo que na predefinição: compara só as cores e se há branco
      const wi = W.findIndex((w) => Array.isArray(w.rgbw) && dist(w.rgbw.slice(0, 3), v.slice(0, 3)) < 30 && (w.rgbw[3] > 0) === (v[3] > 0));
      if (wi >= 0) return "w" + wi;
      const ci = C.findIndex((c) => dist4([...c.rgb, 0], v) < 30);
      return ci >= 0 ? "c" + ci : null;
    }
    if (Array.isArray(a.rgb_color)) {
      let best = null;
      C.forEach((c, i) => {
        if (dist(c.rgb, a.rgb_color) < 40 && (best == null || dist(c.rgb, a.rgb_color) < dist(C[best].rgb, a.rgb_color)))
          best = i;
      });
      return best == null ? null : "c" + best;
    }
    return null;
  }
  _presetName(id) {
    if (!id) return "Cor própria";
    const list = id[0] === "w" ? this._whites() : this._colors();
    return list[Number(id.slice(1))]?.name || "Cor própria";
  }
  // aplica uma predefinição: brancos usam Kelvin (fitas com branco real) ou RGBW; cores usam RGB(W)
  _applyPreset(entity_id, id) {
    const modes = this._st(entity_id)?.attributes?.supported_color_modes || [];
    const i = Number(id.slice(1));
    if (id[0] === "w") {
      const w = this._whites()[i];
      if (!w) return;
      if (modes.includes("color_temp") && w.kelvin)
        return this._call("light", "turn_on", { entity_id, color_temp_kelvin: w.kelvin });
      if (modes.includes("rgbw") && w.rgbw) return this._call("light", "turn_on", { entity_id, rgbw_color: w.rgbw });
      return this._call("light", "turn_on", { entity_id, rgb_color: hexRgb(w.color) || [255, 200, 150] });
    }
    const c = this._colors()[i];
    if (!c) return;
    if (modes.includes("rgbw")) return this._call("light", "turn_on", { entity_id, rgbw_color: [...c.rgb, 0] });
    return this._call("light", "turn_on", { entity_id, rgb_color: c.rgb });
  }
  _bri(l) {
    const b = this._st(l.entity)?.attributes?.brightness;
    return b ? Math.max(1, Math.round((b / 255) * 100)) : 0;
  }
  // fitas RGBW (Shelly) num branco: o canal branco tem brilho próprio e não obedece à intensidade geral
  _whiteLvl(l) {
    const a = this._st(l.entity)?.attributes || {},
      modes = a.supported_color_modes || [];
    if (modes.includes("color_temp") || !modes.includes("rgbw") || a.color_mode !== "rgbw" || !Array.isArray(a.rgbw_color)) return null;
    const id = this._ledPreset(l);
    if (!id || id[0] !== "w") return null;
    const i = Number(id.slice(1)),
      w = this._whites()[i];
    if (!w?.rgbw?.[3]) return null;
    return { i, pct: Math.max(1, Math.min(100, Math.round((a.rgbw_color[3] / 255) * 100))) };
  }
  // muda só o canal branco de uma fita RGBW (0–255), mantendo as cores do branco escolhido
  _setWhite(entity_id, i, pct) {
    const w = this._whites()[i];
    if (!w?.rgbw) return;
    const p = Math.max(1, Math.min(100, Math.round(pct)));
    return this._call("light", "turn_on", { entity_id, rgbw_color: [w.rgbw[0], w.rgbw[1], w.rgbw[2], Math.max(1, Math.round((255 * p) / 100))] });
  }
  // ---------- desenho ----------
  _render() {
    if (!this._hass || !this._cfg || this._busy) return;
    // com um painel aberto não se redesenha o fundo (a planta por trás do desfoque piscava); atualiza ao fechar
    if (this._sheet) {
      this._stale = true;
      return;
    }
    this._stale = false;
    if (this._tab) return this._renderTablet();
    const c = this._cfg,
      H = new Date().getHours();
    const hello = H < 6 ? "Boa noite" : H < 13 ? "Bom dia" : H < 20 ? "Boa tarde" : "Boa noite";
    const wx = this._st(this._wxId());
    const date = new Date().toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "");
    const wxTxt = wx
      ? `<button data-wxpop aria-label="Ver meteorologia" style="display:inline-flex;align-items:center;gap:4px;font:inherit;color:inherit;cursor:pointer;background:rgba(101,216,222,.08);border:1px solid rgba(101,216,222,.32);border-radius:999px;padding:1px 8px 1px 5px"><ha-icon icon="${WX[wx.state] || "mdi:weather-cloudy"}"></ha-icon>${Math.round(num(wx.attributes.temperature, 0))}°</button><span><button data-calpop aria-label="Ver calendário" style="display:inline-flex;align-items:center;gap:4px;font:inherit;color:inherit;cursor:pointer;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:1px 8px 1px 5px"><ha-icon icon="mdi:calendar-month-outline"></ha-icon>${esc(date)}</button></span>`
      : `<span><button data-calpop aria-label="Ver calendário" style="display:inline-flex;align-items:center;gap:4px;font:inherit;color:inherit;cursor:pointer;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:1px 8px 1px 5px"><ha-icon icon="mdi:calendar-month-outline"></ha-icon>${esc(date)}</button></span>`;
    const people = c.persons
      .map((p) => {
        const o = this._st(p.entity),
          pic = o?.attributes?.entity_picture;
        return `<span class="av ${o?.state === "home" ? "home" : ""}" data-ppl role="button" title="${esc(o?.attributes?.friendly_name || "")}" style="cursor:pointer;background-color:${p.color};${pic ? `background-image:url('${esc(pic)}')` : ""}">${pic ? "" : esc(p.initial)}</span>`;
      })
      .join("");
    const al = this._alerts();
    const items = [{ id: "casa", name: "Casa", icon: "mdi:home" }, ...c.rooms];
    const pick = items
      .map((x) => {
        let st;
        if (x.id === "casa") {
          const all = c.rooms.flatMap((r) => this._status(r));
          const seen = new Set();
          st = all.filter(([i]) => (seen.has(i) ? false : seen.add(i))).slice(0, 4);
        } else st = this._status(x);
        const row = st.length
          ? st.map(([i, k]) => `<ha-icon class="${k}" icon="${i}"></ha-icon>`).join("")
          : `<span class="z">tudo off</span>`;
        return `<button class="rb ${x.lights && this._roomLit(x) ? "lit" : ""} ${this._sel === x.id ? "sel" : ""}" data-pick="${x.id}" aria-pressed="${this._sel === x.id}">
<ha-icon icon="${x.icon}"></ha-icon><span class="nm">${esc(x.name)}</span><span class="stt">${row}</span></button>`;
      })
      .join("");
    this.shadowRoot.innerHTML = `<style>${ESTILOS.CORES}${ESTILOS.BASE}${ESTILOS.TELEMOVEL}</style>
<div class="root">
<div class="top"><div class="g">${hello}<small>${wxTxt}</small></div>${people}${this._topIcons()}
${(c.scenes || []).length ? `<button class="bell" data-scenepop aria-label="Cenários"><ha-icon icon="mdi:palette-outline"></ha-icon></button>` : ""}</div>
<div class="pick">${pick}</div>
<div class="room">${this._sel === "casa" ? this._casa(al) : this._roomView(this._room(this._sel) || c.rooms[0])}</div>
</div>`;
  }
  // alarme e portão no topo, ao lado das pessoas: só o ícone (vermelho quando armado / aberto)
  _topIcons() {
    const c = this._cfg,
      alarm = this._st(c.alarm),
      armed = alarm && alarm.state !== "disarmed",
      gr = c.rooms.find((r) => r.gate),
      gc = gr ? this._gateClosed(gr) : null;
    let h = "";
    if (c.alarm && c.top_alarm !== false) {
      const t = armed ? "Alarme armado" : "Alarme desarmado";
      h += `<button class="ico2 ${armed ? "dang" : ""}" data-alarmpop aria-label="${t}" title="${t}"><ha-icon icon="${armed ? "mdi:shield-lock" : "mdi:shield-off-outline"}"></ha-icon></button>`;
    }
    if (gr) {
      const t = gc == null ? "Portão" : gc ? "Portão fechado" : "Portão aberto";
      h += `<button class="ico2 ${gc === false ? "dang" : ""}" data-gatepop aria-label="${t}" title="${t}"><ha-icon icon="mdi:garage${gc === false ? "-open" : ""}"></ha-icon></button>`;
    }
    return h;
  }
  // painel "Casa toda": alertas, ligado agora e estores (o alarme e o portão estão no topo)
  _casa(al) {
    const c = this._cfg;
    const temps = c.rooms.map((r) => num(this._st(r.temp)?.state)).filter((v) => v != null);
    const avg = num(this._st(c.history_avg)?.state) ?? (temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : null);
    const home = c.persons.filter((p) => this._st(p.entity)?.state === "home").length;
    const rows = c.rooms
      .map((r) => {
        const it = [];
        // luzes: um botão por divisão que apaga todas; AC: desliga ao 2.º toque ("Desligar?")
        const nl = (r.lights || []).filter((l) => this._lightOn(l)).length;
        if (nl)
          it.push(
            `<button class="onb l" data-roff="${r.id}" aria-label="Apagar as luzes de ${esc(r.name)}"><ha-icon icon="mdi:lightbulb"></ha-icon>${nl > 1 ? nl + " luzes" : "1 luz"}<ha-icon class="x" icon="mdi:close"></ha-icon></button>`,
          );
        if (this._acOn(r)) {
          const [ic, k] = this._acIcon(this._hvac(r)),
            ask = this._acAsk === r.id;
          it.push(
            `<button class="onb ${k} ${ask ? "ask" : ""}" data-acoff="${r.id}" aria-label="Desligar o AC de ${esc(r.name)}"><ha-icon icon="${ask ? "mdi:power" : ic}"></ha-icon>${ask ? "Desligar?" : `AC ${num(this._st(r.climate)?.attributes?.temperature, "")}°`}<ha-icon class="x" icon="mdi:close"></ha-icon></button>`,
          );
        }
        if (r.heat && this._on(r.heat)) it.push(`<i class="h"><ha-icon icon="mdi:radiator"></ha-icon>Aquecimento</i>`);
        if (r.fan && this._on(r.fan)) it.push(`<i class="f"><ha-icon icon="mdi:fan"></ha-icon>Ventilação</i>`);
        return it.length
          ? `<div class="onrow"><button class="onm" data-pick="${r.id}">${esc(r.name)}<small>›</small></button><span>${it.join("")}</span></div>`
          : "";
      })
      .join("");
    const anyLight = c.rooms.some((r) => this._roomLit(r));
    const covers = c.rooms.flatMap((r) => (r.covers || []).map((v) => ({ r, v, p: this._pos(v) })));
    const open = covers.filter((x) => (x.p || 0) > 0).length;
    const all = covers.map((x) => x.p);
    const boilerOn = this._on(c.boiler);
    const alarm = this._st(c.alarm);
    const armed = alarm && alarm.state !== "disarmed";
    const gr = c.rooms.find((r) => r.gate);
    const gc = gr ? this._gateClosed(gr) : null;
    return `<div class="rh"><b>Casa</b><span>${avg != null ? `<button data-histpop aria-label="Ver histórico de temperatura e humidade" style="font:inherit;color:inherit;cursor:pointer;padding:0;text-decoration:underline dotted rgba(246,184,75,.8);text-underline-offset:3px">${fmt1(avg)}° média</button> · ` : ""}${home} em casa</span></div>
${this._alertsCard(al)}
<div class="card"><div class="lab">Ligado agora<em>Caldeira ${boilerOn ? "a aquecer" : "desligada"}</em></div>
${rows || `<div class="allok"><ha-icon icon="mdi:check"></ha-icon>Nada ligado</div>`}
<button class="tg ${anyLight ? "" : "dis"}" data-alloff style="margin-top:6px;${anyLight ? "color:var(--warm);background:rgba(255,196,107,.12);border-color:rgba(255,196,107,.3)" : ""}"><ha-icon icon="mdi:lightbulb-off-outline"></ha-icon>Apagar todas as luzes<em>${anyLight ? "" : "já está tudo apagado"}</em></button></div>
<div class="card"><div class="lab">Estores<em>${open ? open + (open > 1 ? " abertos" : " aberto") : "todos fechados"}</em></div>
${
  this._tab
    ? `<div class="ochips">${
        open
          ? covers
              .filter((x) => (x.p || 0) > 0)
              .map(({ r, v, p }) => `<button data-pick="${r.id}">${esc(v.short || r.name)} · ${p}%</button>`)
              .join("")
          : "<span>Nenhum estore aberto</span>"
      }</div>`
    : `<div class="bl8">${covers.map(({ r, v, p }) => `<button class="bw ${(p || 0) > 0 ? "op" : ""}" data-pick="${r.id}"><span class="mw"><i style="height:${100 - (p || 0)}%"></i></span>${esc(v.short || r.name)}<span class="bp">${p == null ? "—" : p === 0 ? "fechado" : p === 100 ? "aberto" : p + "%"}</span></button>`).join("")}</div>`
}
<div class="quick">${[0, 25, 50, 75, 100].map((q) => `<button class="${all.every((p) => p === q) ? "on" : ""}" data-allq="${q}" style="height:38px">${q === 0 ? "Fechar" : q === 100 ? "Abrir" : q + "%"}</button>`).join("")}</div></div>
${
  this._tab
    ? `<div class="extras">
<button class="tg ${armed ? "dang" : ""}" data-alarmpop><ha-icon icon="${armed ? "mdi:shield-lock" : "mdi:shield-off-outline"}"></ha-icon>${armed ? "Alarme armado" : "Desarmado"}</button>
${gr ? `<button class="tg ${gc === false ? "dang" : ""}" data-gatepop><ha-icon icon="mdi:garage${gc === false ? "-open" : ""}"></ha-icon>Portão<em>${gc == null ? "—" : gc ? "fechado · abrir ›" : "aberto · fechar ›"}</em></button>` : ""}
</div>`
    : ""
}`;
  }
  // painel de uma divisão: luzes, AC, estores, extras (aquecimento, ventilação, câmara, TV) e portão
  _roomView(r) {
    const t = num(this._st(r.temp)?.state),
      h = num(this._st(r.hum)?.state);
    let out = `<div class="rh"><b>${esc(r.name)}</b><span>${t != null ? `<span>${fmt1(t)}°C</span>` : ""}${h != null ? `<span class="${h > this._limit(r) ? "hi" : ""}">${Math.round(h)}% hum.</span>` : ""}</span></div>`;
    if (r.lights?.length) {
      const n = r.lights.filter((l) => this._lightOn(l)).length;
      out += `<div class="card"><div class="lab">Luzes<em>${n ? n + (n > 1 ? " acesas" : " acesa") : "apagadas"}</em></div><div class="lights">${r.lights
        .map((l, i) => {
          const o = this._st(l.entity),
            on = o?.state === "on",
            na = !o || o.state === "unavailable";
          if (l.led) {
            const pr = on ? this._presetName(this._ledPreset(l)) + " · " + (this._whiteLvl(l)?.pct ?? this._bri(l)) + "%" : "desligada";
            return `<button class="lt led ${on ? "on" : ""} ${na ? "na" : ""}" style="--c:${this._ledColor(l)}" data-led="${r.id}:${i}"><span class="sw"></span>${esc(l.name)}<small>${pr}</small></button>`;
          }
          return `<button class="lt ${on ? "on" : ""} ${na ? "na" : ""}" data-light="${esc(l.entity)}"><ha-icon icon="${on ? "mdi:lightbulb" : "mdi:lightbulb-outline"}"></ha-icon>${esc(l.name)}</button>`;
        })
        .join("")}</div></div>`;
    }
    if (r.climate) {
      const o = this._st(r.climate),
        m = o?.state || "off";
      const set = this._pendTemp[r.climate] ?? num(o?.attributes?.temperature, "—");
      const cur = num(o?.attributes?.current_temperature);
      const cls = m === "off" || m === "unavailable" ? "off" : ["cool", "heat", "dry"].includes(m) ? m : "other";
      const txt =
        {
          off: "desligado",
          cool: "a arrefecer",
          heat: "a aquecer",
          dry: "a desumidificar",
          fan_only: "só ventilação",
          auto: "automático",
          unavailable: "indisponível",
        }[m] || m;
      out += `<div class="card clima ${cls}"><div class="lab">Ar condicionado${cur != null ? " · agora " + cur + "°" : ""}<button data-acmore="${r.id}">Mais opções ›</button></div>
<div class="dial"><button class="pm" data-ac="${r.id}:-1" aria-label="Baixar temperatura">−</button><div class="tgt">${set}°<small>${txt}</small></div><button class="pm" data-ac="${r.id}:1" aria-label="Subir temperatura">+</button></div>
<div class="modes">${MODES.map(([k, ic, n]) => `<button class="m-${k} ${m === k ? "on" : ""}" data-mode="${r.id}:${k}"><ha-icon icon="${ic}"></ha-icon>${n}</button>`).join("")}</div></div>`;
    }
    if (r.covers?.length) {
      out += `<div class="card"><div class="lab">${r.covers.length > 1 ? "Estores" : "Estore"}</div>${r.covers
        .map((v, i) => {
          const p = this._pos(v) ?? 0,
            o = this._st(v.entity),
            mov = o && (o.state === "opening" || o.state === "closing");
          const lbl = mov
            ? o.state === "opening"
              ? "A abrir"
              : "A fechar"
            : p === 0
              ? "Fechado"
              : p === 100
                ? "Aberto"
                : p + "%";
          return `<div class="blind"><div class="win"><i id="w-${r.id}-${i}" style="height:${100 - p}%"></i></div>
<div class="bctl"><div class="bname">${r.covers.length > 1 ? esc(v.name) : "Posição"}<em id="t-${r.id}-${i}">${lbl}</em></div>
<div class="rng"><input type="range" min="0" max="100" step="5" value="${p}" id="s-${r.id}-${i}" data-cov="${r.id}:${i}" style="--p:${p}%" aria-label="Estore ${esc(r.name)} ${esc(v.name)}"></div>
<div class="quick">${[0, 25, 50, 75, 100].map((q) => `<button class="${p === q ? "on" : ""}" data-q="${r.id}:${i}:${q}">${q === 0 ? "Fechar" : q === 100 ? "Abrir" : q + "%"}</button>`).join("")}</div></div></div>`;
        })
        .join("")}</div>`;
    }
    const x = [];
    if (r.heat) {
      const on = this._on(r.heat),
        boil = this._on(this._cfg.boiler);
      x.push(
        `<div class="tg ro ${on ? "hot" : ""}"><ha-icon icon="mdi:radiator${on ? "" : "-off"}"></ha-icon>Aquecimento<em>${on ? (boil ? "a aquecer" : "a pedir calor") : "parado"}</em></div>`,
      );
    }
    if (r.fan) {
      const on = this._on(r.fan);
      x.push(
        `<button class="tg ${on ? "on" : ""}" data-toggle="${r.fan}"><ha-icon icon="mdi:fan${on ? "" : "-off"}"></ha-icon>Ventilação<em>${on ? "ligada" : "off"}</em></button>`,
      );
    }
    if (r.camera)
      x.push(`<button class="tg" data-more="${r.camera}"><ha-icon icon="mdi:cctv"></ha-icon>Câmara<em>ver ›</em></button>`);
    if (r.privacy) {
      const on = this._on(r.privacy);
      x.push(
        `<button class="tg ${on ? "on" : ""}" data-toggle="${r.privacy}"><ha-icon icon="mdi:eye-off-outline"></ha-icon>Privacidade<em>${on ? "on" : "off"}</em></button>`,
      );
    }
    if (r.media) {
      const o = this._st(r.media),
        on = o && !["off", "standby", "unavailable"].includes(o.state);
      x.push(
        `<button class="tg ${on ? "on" : ""}" data-more="${r.media}"><ha-icon icon="mdi:television"></ha-icon>TV<em>${on ? esc(o.attributes.app_name ? "ligada" : o.state) : "desligada"} ›</em></button>`,
      );
    }
    if (x.length) out += `<div class="extras">${x.join("")}</div>`;
    if (r.hum_limit || r.fan_timeout) {
      const row = (ent, label, unit) => {
        const o = this._st(ent);
        if (!o) return "";
        return `<div class="stp"><span>${label}</span><button data-num="${ent}:-1" aria-label="Baixar">−</button><b>${Math.round(num(o.state, 0))}${unit}</b><button data-num="${ent}:1" aria-label="Subir">+</button></div>`;
      };
      out += `<div class="card"><div class="lab">Ventilação automática</div>${row(r.hum_limit, "Liga acima de", "%")}${row(r.fan_timeout, "Fica ligada (os 2 WC)", " min")}</div>`;
    }
    if (r.gate) {
      const gc = this._gateClosed(r);
      out += `<div class="card"><div class="lab">Portão</div>${
        this._gateAsk
          ? `<div class="extras"><button class="tg dang" data-gate="yes">Sim, ${gc === false ? "fechar" : "abrir"}</button><button class="tg" data-gate="no">Cancelar</button></div>`
          : `<button class="tg ${gc === false ? "dang" : ""}" data-gate="ask"><ha-icon icon="mdi:garage${gc === false ? "-open" : ""}"></ha-icon>${gc == null ? "Portão" : gc ? "Fechado" : "Aberto"}<em>${gc === false ? "fechar ›" : "abrir ›"}</em></button>`
      }</div>`;
    }
    return out;
  }
  // ---------- tablet ----------
  // ecrã do tablet: topo (hora, alertas, alarme, pessoas), planta, painel de informações e cenários
  _renderTablet() {
    const c = this._cfg,
      al = this._alerts(),
      now = new Date(),
      H = now.getHours();
    const hello = H < 6 ? "Boa noite" : H < 13 ? "Bom dia" : H < 20 ? "Boa tarde" : "Boa noite";
    const hhmm = String(H).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
    const date = now.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "short" }).replace(/\./g, "");
    const wx = this._st(this._wxId());
    const worst = al[0]?.lvl,
      nUrg = al.filter((a) => a.lvl === "bad").length;
    const chip = al.length
      ? `<button class="achip ${worst === "bad" ? "" : "w"}" data-allalerts><ha-icon icon="mdi:bell-alert-outline"></ha-icon>${al.length} ${al.length > 1 ? "alertas" : "alerta"}${nUrg ? ` · ${nUrg} urgente${nUrg > 1 ? "s" : ""}` : ""}</button>`
      : `<span class="achip ok"><ha-icon icon="mdi:check"></ha-icon>Tudo em ordem</span>`;
    const alarm = this._st(c.alarm),
      armed = alarm && alarm.state !== "disarmed";
    const people = c.persons
      .map((p) => {
        const o = this._st(p.entity),
          pic = o?.attributes?.entity_picture;
        return `<span class="av ${o?.state === "home" ? "home" : ""}" data-ppl role="button" title="${esc(o?.attributes?.friendly_name || "")}" style="cursor:pointer;width:36px;height:36px;background-color:${p.color};${pic ? `background-image:url('${esc(pic)}')` : ""}">${pic ? "" : esc(p.initial)}</span>`;
      })
      .join("");
    const room = this._sel === "casa" ? null : this._room(this._sel);
    const scenes = (c.scenes || [])
      .map(
        (x, i) =>
          `<button class="sc2" style="--sc:${x.color}" data-scene="${i}"><span class="ci"><ha-icon icon="${x.icon}"></ha-icon></span>${esc(x.name)}</button>`,
      )
      .join("");
    const gar = c.rooms.find((r) => r.gate);
    this.shadowRoot.innerHTML = `<style>${ESTILOS.CORES}${ESTILOS.BASE}${ESTILOS.TELEMOVEL}${ESTILOS.TABLET}</style>
<div class="tab" style="--h:${c.tablet_height}">
<div class="ttop"><div class="clock">${hhmm}</div><div class="tdate"><b>${hello}</b><br><button data-calpop aria-label="Ver calendário" style="display:inline-flex;align-items:center;gap:4px;font:inherit;color:inherit;cursor:pointer;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:1px 8px 1px 5px"><ha-icon icon="mdi:calendar-month-outline"></ha-icon>${esc(date)}</button>${wx ? ` · <button data-wxpop aria-label="Ver meteorologia" style="display:inline-flex;align-items:center;gap:4px;font:inherit;color:inherit;cursor:pointer;background:rgba(101,216,222,.08);border:1px solid rgba(101,216,222,.32);border-radius:999px;padding:2px 10px 2px 6px"><ha-icon icon="${WX[wx.state] || "mdi:weather-cloudy"}"></ha-icon>${Math.round(num(wx.attributes.temperature, 0))}°</button>` : ""}</div>
<div class="tmid">${chip}</div>
<button class="pill ${armed ? "arm" : ""}" data-alarmpop><ha-icon icon="${armed ? "mdi:shield-lock" : "mdi:shield-off-outline"}"></ha-icon>${armed ? "Armado" : "Desarmado"}</button>
<div style="display:flex;padding-left:6px">${people}</div></div>
<div class="tbody">
<div class="pcol" id="pcol"><div class="pwrap" id="pwrap">${this._planHTML()}</div>
<div class="pbtns"><button class="${this._sel === "casa" ? "on" : ""}" data-pick="casa"><ha-icon icon="mdi:home"></ha-icon>Casa toda</button>${gar ? `<button class="${this._sel === gar.id ? "on" : ""}" data-pick="${gar.id}"><ha-icon icon="mdi:garage"></ha-icon>${esc(gar.name)}</button>` : ""}</div></div>
<div class="tside"><div class="room">${room ? this._roomView(room) : this._casa(al)}</div></div>
<div class="scol"><div class="lab">Cenários</div>${scenes}</div>
</div>
</div>`;
    this._fitPlan();
  }
  // planta 3D: imagem base + luzes acesas por cima + realce/cor do clima + etiquetas de temperatura
  _planHTML() {
    const P = this._cfg.plan;
    if (!P) return "";
    const dir = P.dir || "/local/floorplan/";
    if (!this._zimg) {
      this._zimg = P.zones.map((z) => {
        const i = new Image();
        i.src = dir + z[1] + ".png?v=8";
        return i;
      });
      this._bimg = new Image();
      this._bimg.onload = () => this._fitPlan();
      this._bimg.src = P.base;
    }
    const ov = P.lights
      .map(([e, img]) => `<img class="ov ${this._on(e) ? "on" : ""}" src="${dir}${img}.png?v=8" alt="">`)
      .join("");
    const bx = P.boxes
      .map(([rid, l, t, w, h]) => {
        const r = this._room(rid),
          m = r ? this._hvac(r) : null;
        const cls =
          (r?.heat && this._on(r.heat)) || m === "heat" ? "heat" : m && !["off", "unavailable"].includes(m) ? "cool" : "";
        return `<div class="bx ${cls} ${this._sel === rid ? "sel" : ""}" style="left:${l - w / 2}%;top:${t - h / 2}%;width:${w}%;height:${h}%"></div>`;
      })
      .join("");
    const lb = P.labels
      .map(([rid, l, t]) => {
        const r = this._room(rid);
        if (!r) return "";
        const tv = num(this._st(r.temp)?.state);
        const ic = this._status(r)
          .map(([i, k]) => `<ha-icon class="${k}" icon="${i}"></ha-icon>`)
          .join("");
        if (tv == null && !ic) return "";
        return `<div class="bdg ${this._sel === rid ? "sel" : ""}" style="left:${l}%;top:${t}%">${tv != null ? fmt1(tv) + "°" : esc(r.name)}${ic}</div>`;
      })
      .join("");
    return `<div class="pl" id="pl" data-plan><img src="${P.base}" alt="Planta da casa">${ov}${bx}${lb}</div>`;
  }
  // a planta ocupa o máximo do espaço à esquerda dos botões Garagem / Casa toda
  _fitPlan() {
    if (!this._tab) return;
    const sr = this.shadowRoot,
      wrap = sr.getElementById("pwrap"),
      pl = sr.getElementById("pl"),
      im = this._bimg;
    if (!wrap || !pl || !im || !im.naturalWidth) return;
    const ar = im.naturalWidth / im.naturalHeight,
      W = wrap.clientWidth - 16,
      H = wrap.clientHeight - 16;
    let w = W,
      h = W / ar;
    if (h > H) {
      h = H;
      w = H * ar;
    }
    pl.style.width = w + "px";
    pl.style.height = h + "px";
  }
  // descobre em que divisão se tocou na planta (usa a transparência das imagens toque-*.png)
  _planHit(e) {
    const pl = this.shadowRoot.getElementById("pl"),
      P = this._cfg.plan;
    if (!pl || !P) return null;
    const R = pl.getBoundingClientRect(),
      x = ((e.clientX - R.left) / R.width) * 100,
      y = ((e.clientY - R.top) / R.height) * 100;
    let fallback = null;
    for (let k = P.zones.length - 1; k >= 0; k--) {
      const [rid, , l, t, w] = P.zones[k],
        im = this._zimg?.[k];
      if (!im || !im.naturalWidth) continue;
      const h = w * (im.naturalHeight / im.naturalWidth) * (R.width / R.height);
      const x0 = l - w / 2,
        y0 = t - h / 2;
      if (x < x0 || x > x0 + w || y < y0 || y > y0 + h) continue;
      fallback = fallback || rid;
      if (this._alpha(k, im, (x - x0) / w, (y - y0) / h) > 20) return rid;
    }
    return fallback;
  }
  _alpha(k, im, u, v) {
    try {
      let cv = this._zc[k];
      if (!cv) {
        cv = document.createElement("canvas");
        cv.width = im.naturalWidth;
        cv.height = im.naturalHeight;
        cv.getContext("2d").drawImage(im, 0, 0);
        this._zc[k] = cv;
      }
      return cv
        .getContext("2d")
        .getImageData(Math.min(cv.width - 1, Math.floor(u * cv.width)), Math.min(cv.height - 1, Math.floor(v * cv.height)), 1, 1)
        .data[3];
    } catch (_) {
      return 255;
    }
  }
  // ---------- meteorologia (toque no tempo do topo) ----------
  // tempo agora: usa weather (met.no); se estiver em baixo, usa weather_days (IPMA)
  _wxId() {
    const c = this._cfg,
      ok = (e) => e && this._st(e) && !["unavailable", "unknown"].includes(this._st(e).state);
    return ok(c.weather) ? c.weather : ok(c.weather_days) ? c.weather_days : c.weather;
  }
  // pede ao HA as previsões por hora (weather) e por dia (weather_days, ex.: IPMA) quando a janela abre
  _openWx() {
    this._openSheet({ kind: "wx" });
    if (this._wxData && Date.now() - this._wxData.t < 600000) return;
    const c = this._cfg,
      ask = (e, type) =>
        e
          ? this._hass
              .callWS({ type: "call_service", domain: "weather", service: "get_forecasts", service_data: { type }, target: { entity_id: e }, return_response: true })
              .then((r) => r?.response?.[e]?.forecast || [])
              .catch(() => [])
          : Promise.resolve([]);
    Promise.all([ask(this._wxId(), "hourly"), ask(c.weather_days || c.weather, "daily")]).then(([h, d]) => {
      // o IPMA manda -99 quando não tem probabilidade de chuva para aquela hora: fica vazio
      const ok = (L) => L.map((f) => (f.precipitation_probability < 0 ? { ...f, precipitation_probability: null } : f));
      this._wxData = { h: ok(h), d: ok(d), t: Date.now() };
      if (this._sheet?.kind === "wx") this._renderSheet();
    });
  }
  _wxHtml() {
    const c = this._cfg,
      o = this._st(this._wxId()),
      od = this._st(c.weather_days) || o,
      a = o?.attributes || {},
      D = this._wxData;
    const PT = { "clear-night": "Céu limpo", cloudy: "Nublado", exceptional: "Tempo excecional", fog: "Nevoeiro", hail: "Granizo", lightning: "Trovoada", "lightning-rainy": "Trovoada e chuva", partlycloudy: "Pouco nublado", pouring: "Chuva forte", rainy: "Chuva", snowy: "Neve", "snowy-rainy": "Neve e chuva", sunny: "Sol", windy: "Vento", "windy-variant": "Vento e nuvens" };
    const COR = { sunny: "#FBBF24", "clear-night": "#C7D2FE", partlycloudy: "#FCD9A0", rainy: "#64A0FF", pouring: "#64A0FF", "lightning-rainy": "#A78BFA", lightning: "#A78BFA", snowy: "#E0F2FE", "snowy-rainy": "#BAE6FD" };
    const ico = (k) => `<ha-icon icon="${WX[k] || "mdi:weather-cloudy"}" style="color:${COR[k] || "var(--fg)"}"></ha-icon>`;
    const r0 = (v) => (v == null || !isFinite(v) ? "–" : String(Math.round(v)));
    const d1 = (v) => String(Math.round(v * 10) / 10).replace(".", ",");
    const rumo = (b) => (typeof b === "string" ? b.replace(/W/g, "O") : isFinite(b) ? ["N", "NE", "E", "SE", "S", "SO", "O", "NO"][Math.round(b / 45) % 8] : "");
    const nome = c.weather_name || od?.attributes?.friendly_name || "";
    const Dd = (D?.d || []).slice(0, 10),
      hoje = Dd[0] && new Date(Dd[0].datetime).toDateString() === new Date().toDateString() ? Dd[0] : null;
    const prob = hoje?.precipitation_probability;
    const chips = [
      ["Humidade", a.humidity != null ? r0(a.humidity) + "%" : null],
      ["Vento", a.wind_speed != null ? `${r0(a.wind_speed)} ${a.wind_speed_unit || "km/h"} ${rumo(a.wind_bearing)}` : null],
      prob != null ? ["Chuva hoje", r0(prob) + "%"] : ["Índice UV", a.uv_index != null ? d1(a.uv_index) : null],
      ["Pressão", a.pressure != null ? `${r0(a.pressure)} ${a.pressure_unit || "hPa"}` : null],
    ].filter((x) => x[1] != null);
    // próximas 24 horas: colunas + curva da temperatura por cima
    const H = (D?.h || []).filter((f) => Date.parse(f.datetime) > Date.now() - 3600000).slice(0, 24),
      W = 56,
      n = H.length;
    let hrs = "";
    if (n) {
      const t = H.map((f) => f.temperature),
        lo = Math.min(...t) - 2,
        hi = Math.max(...t) + 2,
        y = (v) => 66 + (1 - (v - lo) / (hi - lo || 1)) * 44,
        P = H.map((f, i) => [i * W + W / 2, y(f.temperature)]),
        ln = P.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
      const svg = `<svg width="${n * W}" height="150" style="position:absolute;left:0;top:0;pointer-events:none" aria-hidden="true"><defs><linearGradient id="wxg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBBF24" stop-opacity=".28"/><stop offset="1" stop-color="#FBBF24" stop-opacity="0"/></linearGradient></defs>
<path d="${ln} L${P[n - 1][0]} 116 L${P[0][0]} 116 Z" fill="url(#wxg)"/><path d="${ln}" fill="none" stroke="#FBBF24" stroke-width="2"/>${P.map(
        (p, i) => `<circle cx="${p[0]}" cy="${p[1].toFixed(1)}" r="3" fill="#0f2029" stroke="#FBBF24" stroke-width="2"/><text x="${p[0]}" y="${(p[1] - 8).toFixed(1)}" text-anchor="middle" fill="#eefaff" font-size="12.5" font-weight="600">${r0(H[i].temperature)}°</text>`,
      ).join("")}</svg>`;
      const cols = H.map((f, i) => {
        const d = new Date(f.datetime),
          hh = d.getHours(),
          novo = i > 0 && hh === 0,
          mm = f.precipitation,
          pr = mm != null ? d1(mm) + " mm" : f.precipitation_probability != null ? r0(f.precipitation_probability) + "%" : "";
        return `<div class="wc ${novo ? "nd" : ""}" ${novo ? `data-d="${esc(d.toLocaleDateString("pt-PT", { weekday: "long" }))}"` : ""}><span class="wh ${i ? "" : "now"}">${i ? String(hh).padStart(2, "0") + "h" : "Agora"}</span>${ico(f.condition)}<span class="wm ${mm > 0 || f.precipitation_probability > 0 ? "r" : ""}">${pr}</span></div>`;
      }).join("");
      hrs = `<div class="wst">Próximas 24 horas<em>desliza para o lado</em></div><div class="wxh"><div class="wxt" style="width:${n * W}px">${svg}${cols}</div></div>`;
    }
    // próximos dias
    let days = "";
    if (Dd.length) {
      const tl = (f) => (f.templow ?? f.temperature),
        lo = Math.min(...Dd.map(tl)),
        hi = Math.max(...Dd.map((f) => f.temperature)),
        p = (v) => ((v - lo) / (hi - lo || 1)) * 100,
        temProb = Dd.some((f) => f.precipitation_probability != null);
      days = `<div class="wst">Próximos ${Dd.length} dias<em>${temProb ? "% = probabilidade de chuva" : "chuva prevista"}</em></div><div class="wds">${Dd.map((f) => {
        const d = new Date(f.datetime),
          dn = f === hoje ? "Hoje" : d.toLocaleDateString("pt-PT", { weekday: "short" }).replace(".", ""),
          pr = temProb ? (f.precipitation_probability ? r0(f.precipitation_probability) + "%" : "") : f.precipitation ? d1(f.precipitation) + " mm" : "";
        return `<div class="wd"><div class="dn">${esc(dn.charAt(0).toUpperCase() + dn.slice(1))}<small>${d.getDate()} ${esc(d.toLocaleDateString("pt-PT", { month: "short" }).replace(".", ""))}</small></div>${ico(f.condition === "clear-night" ? "sunny" : f.condition)}<span class="pp">${pr}</span><span class="lo">${r0(tl(f))}°</span><span class="rg"><i style="left:${p(tl(f)).toFixed(1)}%;right:${(100 - p(f.temperature)).toFixed(1)}%"></i></span><span class="hi">${r0(f.temperature)}°</span></div>`;
      }).join("")}</div>`;
    }
    const resto = !D ? `<p class="sub">A carregar a previsão…</p>` : hrs || days ? hrs + days : `<p class="sub">Não foi possível obter a previsão. Tenta outra vez daqui a pouco.</p>`;
    return `<style>.wxn{display:flex;flex-direction:column;gap:12px;padding:12px;border-radius:18px;background:rgba(0,0,0,.2);border:1px solid var(--line);margin-bottom:12px}.wxa{display:flex;align-items:center;gap:10px}.wxa>ha-icon{--mdc-icon-size:46px}.wxa .big{font-size:46px;font-weight:300;line-height:1;font-variant-numeric:tabular-nums}.wxa b{display:block;font-size:15px}.wxa small{display:block;font-size:12.5px;color:var(--dim);margin-top:2px}.wxc{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}@media (min-width:521px){.wxc{grid-template-columns:repeat(4,1fr)}}.wxc div{padding:7px 9px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid var(--line2)}.wxc span{display:block;font-size:10.5px;color:var(--mute);text-transform:uppercase;letter-spacing:.05em}.wxc b{font-size:14px;font-variant-numeric:tabular-nums;white-space:nowrap}.wst{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mute);margin:4px 2px 6px}.wst em{font-style:normal;text-transform:none;letter-spacing:0;font-weight:400}.wxh{overflow-x:auto;border-radius:16px;background:rgba(0,0,0,.2);border:1px solid var(--line);margin-bottom:12px;-webkit-overflow-scrolling:touch}.wxt{position:relative;height:150px;display:flex}.wc{width:56px;flex:none;display:flex;flex-direction:column;align-items:center;padding:8px 0 7px;position:relative}.wc .wh{font-size:12px;color:var(--dim)}.wc .wh.now{color:var(--cyan);font-weight:700}.wc ha-icon{--mdc-icon-size:22px;margin-top:4px}.wc .wm{margin-top:auto;font-size:10.5px;color:var(--mute);white-space:nowrap}.wc .wm.r{color:#64A0FF}.wc.nd{border-left:1px dashed rgba(255,255,255,.18)}.wc.nd::after{content:attr(data-d);position:absolute;left:4px;bottom:24px;font-size:10px;color:var(--mute);white-space:nowrap}.wds{display:flex;flex-direction:column;border-radius:16px;background:rgba(0,0,0,.2);border:1px solid var(--line);overflow:hidden}.wd{display:grid;grid-template-columns:62px 26px 42px 30px 1fr 30px;align-items:center;gap:8px;padding:8px 12px;font-size:14px;font-variant-numeric:tabular-nums}.wd+.wd{border-top:1px solid var(--line2)}.wd .dn{font-weight:600}.wd .dn small{display:block;font-weight:400;font-size:11px;color:var(--mute)}.wd ha-icon{--mdc-icon-size:22px}.wd .pp{font-size:12px;color:#64A0FF;text-align:right}.wd .lo{color:var(--dim);text-align:right}.wd .hi{font-weight:600}.wd .rg{height:6px;border-radius:3px;background:rgba(255,255,255,.08);position:relative}.wd .rg i{position:absolute;top:0;bottom:0;border-radius:3px;background:linear-gradient(90deg,#7DD3FC,#FBBF24,#FF7841)}</style>
<div class="sh"><div><b>Meteorologia</b>${nome ? `<small>${esc(nome)}</small>` : ""}</div><button class="x" data-close>Fechar</button></div>
<div class="wxn"><div class="wxa">${ico(o?.state)}<span class="big">${r0(a.temperature)}°</span><div><b>${esc(PT[o?.state] || o?.state || "")}</b>${hoje ? `<small>Máx. ${r0(hoje.temperature)}° · Mín. ${r0(hoje.templow)}°</small>` : ""}</div></div>
<div class="wxc">${chips.map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join("")}</div></div>
${resto}`;
  }
  // ---------- histórico de temperatura / humidade (toque em "21,4° média") ----------
  // dados: estatísticas de longo prazo do HA (recorder/statistics_during_period), só pedidas com a janela aberta
  _histRooms() {
    return this._cfg.history_rooms || HIST_ROOMS;
  }
  // sensores do chip escolhido: Casa/temperatura usa o sensor da média; Casa/humidade faz a média das divisões
  _histSrc() {
    const H = this._hist;
    if (H.sel === "casa") {
      if (H.mode === "t") return { ids: [this._cfg.history_avg].filter(Boolean), name: "Média da casa" };
      return { ids: this._histRooms().map((r) => r.h).filter(Boolean), avg: true, name: "Média da casa" };
    }
    const r = this._histRooms().find((x) => x.id === H.sel) || {};
    return { ids: [H.mode === "t" ? r.t : r.h].filter(Boolean), name: r.name || "" };
  }
  _histNow(src) {
    const v = src.ids.map((id) => num(this._st(id)?.state)).filter((x) => x != null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  }
  // período escolhido: início, fim, resolução dos dados pedidos e intervalos das barras
  _histRange() {
    const H = this._hist,
      [y, m, d] = H.date.split("-").map(Number),
      K = [];
    const lg = (t) => t.toLocaleDateString("pt-PT", { weekday: "long" }).replace("-feira", "");
    const sh = (t) => lg(t).slice(0, 3);
    const dm = (t) => t.getDate() + " " + t.toLocaleDateString("pt-PT", { month: "short" }).replace(".", "");
    const mes = (t) => t.toLocaleDateString("pt-PT", { month: "long" });
    let a,
      b,
      fine = "hour",
      label;
    if (H.per === "d") {
      a = new Date(y, m - 1, d);
      b = new Date(y, m - 1, d + 1);
      // o HA guarda valores de 5 em 5 minutos só nos últimos 10 dias; antes disso usa os de hora a hora
      if (Date.now() - b.getTime() < 9 * 86400000) fine = "5minute";
      for (let i = 0; i < 24; i += 3) K.push({ t: new Date(y, m - 1, d, i).getTime(), l: i + "h" });
      label = `${lg(a)}, ${dm(a)} ${y}`;
    } else if (H.per === "w" || H.per === "m") {
      const w = H.per === "w",
        off = w ? (new Date(y, m - 1, d).getDay() + 6) % 7 : 0,
        d0 = w ? d - off : 1,
        n = w ? 7 : new Date(y, m, 0).getDate();
      a = new Date(y, m - 1, d0);
      b = new Date(y, m - 1, d0 + n);
      for (let i = 0; i < n; i++) {
        const s = new Date(y, m - 1, d0 + i),
          l = w ? sh(s) : [1, 5, 10, 15, 20, 25, 30].includes(i + 1) ? String(i + 1) : "";
        if (l) K.push({ t: s.getTime() + 43200000, l });
      }
      const z = new Date(y, m - 1, d0 + n - 1);
      label = w ? (a.getMonth() === z.getMonth() ? `${a.getDate()}–${dm(z)} ${z.getFullYear()}` : `${dm(a)} – ${dm(z)} ${z.getFullYear()}`) : `${mes(a)} ${y}`;
    } else {
      fine = "day";
      a = new Date(y, 0, 1);
      b = new Date(y + 1, 0, 1);
      for (let i = 0; i < 12; i++) K.push({ t: new Date(y, i, 15).getTime(), l: mes(new Date(y, i, 1)).charAt(0).toUpperCase() });
      label = String(y);
    }
    return { a, b, fine, K, label };
  }
  _histKey(src, R) {
    return src.ids.join(",") + "|" + R.fine + "|" + R.a.getTime();
  }
  // pede os dados do período (e o valor de há 1 hora, para a tendência) se ainda não estiverem guardados
  _histLoad() {
    const src = this._histSrc(),
      R = this._histRange(),
      k = this._histKey(src, R),
      now = Date.now(),
      redo = () => this._sheet?.kind === "hist" && this._renderSheet();
    this._hc = this._hc || {};
    this._ht = this._ht || {};
    if (!src.ids.length) return;
    const c = this._hc[k];
    if (!c || (!c.loading && R.b.getTime() > now && now - c.t > 600000)) {
      this._hc[k] = { loading: true, rows: c?.rows };
      this._hass
        .callWS({ type: "recorder/statistics_during_period", start_time: R.a.toISOString(), end_time: R.b.toISOString(), statistic_ids: src.ids, period: R.fine, types: ["mean", "min", "max"] })
        .then((res) => (this._hc[k] = { rows: this._histRows(res || {}, src), t: Date.now() }))
        .catch(() => (this._hc[k] = { err: true, t: Date.now() }))
        .finally(redo);
    }
    const tk = src.ids.join(",");
    if (!this._ht[tk] || now - this._ht[tk].t > 300000) {
      this._ht[tk] = { t: now, v: this._ht[tk]?.v ?? null };
      this._hass
        .callWS({ type: "recorder/statistics_during_period", start_time: new Date(now - 3900000).toISOString(), end_time: new Date(now - 3300000).toISOString(), statistic_ids: src.ids, period: "5minute", types: ["mean"] })
        .then((res) => {
          const r = this._histRows(res || {}, src);
          this._ht[tk].v = r.length ? r[r.length - 1].mean : null;
        })
        .catch(() => {})
        .finally(redo);
    }
  }
  // junta a resposta numa lista {t, mean, min, max}; na humidade da casa faz a média das divisões em cada instante
  _histRows(res, src) {
    const T = (x) => (typeof x === "number" ? x : Date.parse(x));
    if (!src.avg)
      return (res[src.ids[0]] || [])
        .filter((r) => r.mean != null)
        .map((r) => ({ t: T(r.start), mean: r.mean, min: r.min ?? r.mean, max: r.max ?? r.mean }));
    const g = {};
    for (const id of src.ids) for (const r of res[id] || []) if (r.mean != null) (g[T(r.start)] ||= []).push(r.mean);
    return Object.keys(g)
      .map(Number)
      .sort((a, b) => a - b)
      .map((t) => {
        const v = g[t].reduce((a, b) => a + b, 0) / g[t].length;
        return { t, mean: v, min: v, max: v };
      });
  }
  // pontos do período, média, mínima e máxima (cada ponto é o valor médio daquele momento)
  _histAgg(rows, R) {
    const p = rows.filter((r) => r.t >= R.a.getTime() && r.t < R.b.getTime());
    let S = 0,
      mn = null,
      mx = null;
    for (const r of p) {
      S += r.mean;
      if (!mn || r.mean < mn.v) mn = { v: r.mean, t: r.t };
      if (!mx || r.mean > mx.v) mx = { v: r.mean, t: r.t };
    }
    return { p, mean: p.length ? S / p.length : null, mn, mx };
  }
  // quando foi a mínima / máxima
  _histWhen(t) {
    if (!t) return "";
    const d = new Date(t),
      per = this._hist.per;
    if (per === "d") return "às " + p2(d.getHours()) + ":" + p2(d.getMinutes());
    if (per === "y") return d.getDate() + " " + d.toLocaleDateString("pt-PT", { month: "short" }).replace(".", "");
    return d.toLocaleDateString("pt-PT", { weekday: "long" }).slice(0, 3) + ", " + d.getDate() + " · " + p2(d.getHours()) + "h";
  }
  // texto do ponto tocado no gráfico
  _histTip(t) {
    const d = new Date(t),
      per = this._hist.per,
      dia = d.toLocaleDateString("pt-PT", { weekday: "long" }).replace("-feira", "") + ", " + d.getDate() + " " + d.toLocaleDateString("pt-PT", { month: "short" }).replace(".", "");
    if (per === "y") return dia;
    return dia + " · " + p2(d.getHours()) + ":" + p2(d.getMinutes());
  }
  // gráfico de linha simples: um ponto por valor guardado (5 min, 1 hora ou 1 dia)
  _histSvg(A, R, U) {
    const W = 340,
      HH = 190,
      L = 34,
      RP = 8,
      TP = 12,
      BP = 24,
      pw = W - L - RP,
      ph = HH - TP - BP,
      P = A.p,
      a0 = R.a.getTime(),
      span = R.b.getTime() - a0,
      sel = this._hist.hi;
    const vals = P.map((r) => r.mean);
    let lo = Math.min(...vals),
      hi = Math.max(...vals);
    const rg = Math.max(hi - lo, U === "%" ? 4 : 1);
    let st = rg <= 3 ? 0.5 : rg <= 6 ? 1 : rg <= 12 ? 2 : rg <= 30 ? 5 : 10;
    lo = Math.floor((lo - rg * 0.12) / st) * st;
    hi = Math.ceil((hi + rg * 0.12) / st) * st;
    if (hi <= lo) hi = lo + st;
    while ((hi - lo) / st > 6) st *= 2;
    const X = (t) => L + ((t - a0) / span) * pw,
      Y = (v) => TP + (1 - (v - lo) / (hi - lo)) * ph,
      f = (v) => v.toFixed(1),
      gap = { "5minute": 300000, hour: 3600000, day: 86400000 }[R.fine] * 2.5;
    let g = "";
    for (let v = Math.ceil(lo / st) * st; v <= hi + 1e-9; v += st)
      g += `<line x1="${L}" x2="${W - RP}" y1="${f(Y(v))}" y2="${f(Y(v))}" class="gl"/><text x="${L - 5}" y="${f(Y(v) + 3.5)}" text-anchor="end" class="yl">${String(+v.toFixed(1)).replace(".", ",")}${U}</text>`;
    let line = "",
      prev = null;
    for (const r of P) {
      line += (prev != null && r.t - prev <= gap ? "L" : "M") + f(X(r.t)) + " " + f(Y(r.mean)) + " ";
      prev = r.t;
    }
    const dots = P.length <= 31 ? P.map((r) => `<circle cx="${f(X(r.t))}" cy="${f(Y(r.mean))}" r="2.6" fill="var(--ac)"/>`).join("") : "";
    const s = sel != null ? P.find((r) => r.t === sel) : null;
    const mark = s
      ? `<line x1="${f(X(s.t))}" x2="${f(X(s.t))}" y1="${TP}" y2="${TP + ph}" class="sel"/><circle cx="${f(X(s.t))}" cy="${f(Y(s.mean))}" r="4.5" fill="#fff" stroke="var(--ac)" stroke-width="2"/>`
      : "";
    const xl = R.K.map((k) => `<text x="${f(X(k.t))}" y="${HH - 7}" text-anchor="middle" class="xl">${esc(k.l)}</text>`).join("");
    return `<svg viewBox="0 0 ${W} ${HH}" role="img" aria-label="Gráfico do histórico">${g}<path d="${line}" fill="none" stroke="var(--ac)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${dots}${mark}${xl}<rect x="${L}" y="0" width="${pw}" height="${HH}" fill="transparent" data-hx/></svg>`;
  }
  // toque no gráfico: escolhe o ponto mais perto do dedo
  _histPick(e, el) {
    const bx = (el.ownerSVGElement || el).getBoundingClientRect(),
      R = this._histRange(),
      D = this._hc?.[this._histKey(this._histSrc(), R)];
    if (!D?.rows || !bx.width) return;
    const P = this._histAgg(D.rows, R).p,
      xv = ((e.clientX - bx.left) / bx.width) * 340,
      t = R.a.getTime() + ((xv - 34) / (340 - 34 - 8)) * (R.b.getTime() - R.a.getTime());
    let best = null;
    for (const r of P) if (!best || Math.abs(r.t - t) < Math.abs(best.t - t)) best = r;
    this._hist.hi = best ? best.t : null;
    this._renderSheet();
  }
  _histHtml() {
    const H = this._hist,
      src = this._histSrc(),
      R = this._histRange(),
      D = this._hc?.[this._histKey(src, R)];
    const T = H.mode === "t",
      U = T ? "°" : "%",
      AC = T ? "#f6b84b" : "#5fd0d6",
      f = (v) => (v == null ? "—" : fmt1(v) + U);
    const now = this._histNow(src),
      old = this._ht?.[src.ids.join(",")]?.v;
    let trend = "";
    if (now != null && old != null) {
      const dv = now - old,
        up = dv >= 0.05,
        dn = dv <= -0.05;
      trend = `<span class="htr ${up ? "up" : dn ? "dn" : ""}"><ha-icon icon="mdi:${up ? "trending-up" : dn ? "trending-down" : "trending-neutral"}"></ha-icon>${up ? "+" : dn ? "−" : "±"}${fmt1(Math.abs(dv))}${U} última hora</span>`;
    }
    const chips = [{ id: "casa", name: "Casa" }, ...this._histRooms()]
      .map((r) => `<button class="hc ${H.sel === r.id ? "on" : ""}" data-hc="${esc(r.id)}">${r.id === "casa" ? `<ha-icon icon="mdi:home-outline"></ha-icon>` : ""}${esc(r.name)}</button>`)
      .join("");
    const per = [["d", "Dia"], ["w", "Semana"], ["m", "Mês"], ["y", "Ano"]].map(([k, n]) => `<button class="${H.per === k ? "on" : ""}" data-hp="${k}">${n}</button>`).join("");
    const t0 = new Date(),
      today = `${t0.getFullYear()}-${p2(t0.getMonth() + 1)}-${p2(t0.getDate())}`;
    const A = D?.rows ? this._histAgg(D.rows, R) : null;
    let chart, tip;
    if (!src.ids.length) chart = `<div class="hch ld">Esta divisão não tem sensor de ${T ? "temperatura" : "humidade"}</div>`;
    else if (D?.err && !A) chart = `<div class="hch ld">Não foi possível obter o histórico. Tenta outra vez.</div>`;
    else if (!A) chart = `<div class="hch ld">A carregar…</div>`;
    else if (A.mean == null) chart = `<div class="hch ld">Sem dados neste período</div>`;
    else chart = `<div class="hch">${this._histSvg(A, R, U)}</div>`;
    const sp = H.hi != null ? A?.p.find((r) => r.t === H.hi) : null;
    tip = sp
      ? `${esc(this._histTip(sp.t))}<b>${f(sp.mean)}</b>`
      : `${esc(R.label)}<span>${A?.mean != null ? "Toca no gráfico para ver o valor" : "&nbsp;"}</span>`;
    return `<style>.hst{--ac:${AC}}.grab{position:relative;touch-action:none;cursor:grab}.grab::before{content:"";position:absolute;left:-90px;right:-90px;top:-14px;bottom:-14px}.hcs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}.hc{display:inline-flex;align-items:center;gap:5px;height:36px;padding:0 13px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);font-size:14px;font-weight:600;color:var(--dim)}.hc ha-icon{--mdc-icon-size:17px}.hc.on{background:color-mix(in srgb,var(--ac) 16%,transparent);border-color:color-mix(in srgb,var(--ac) 55%,transparent);color:var(--fg)}.hv{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-bottom:14px}.hv>div{min-width:0}.hv small{display:block;font-size:13px;color:var(--dim)}.hv .big{display:flex;align-items:baseline;flex-wrap:wrap;gap:2px 8px}.hv .big b{font-size:46px;font-weight:300;line-height:1.05;color:var(--ac);font-variant-numeric:tabular-nums}.htr{display:inline-flex;align-items:center;gap:3px;font-size:13px;color:var(--dim);white-space:nowrap}.htr ha-icon{--mdc-icon-size:16px}.htr.up{color:#ff8a5c}.htr.dn{color:#7cc4ff}.hm{display:flex;gap:4px;padding:3px;border-radius:13px;background:rgba(0,0,0,.25);flex:none}.hm button{width:44px;height:36px;border-radius:10px;color:var(--dim);display:grid;place-items:center}.hm button ha-icon{--mdc-icon-size:20px}.hm button.on{background:var(--card2);color:var(--ac);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}.hp{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:3px;border-radius:13px;background:rgba(0,0,0,.25);margin-bottom:10px}.hp button{height:36px;border-radius:10px;font-weight:600;font-size:14px;color:var(--dim)}.hp button.on{background:var(--card2);color:var(--fg);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}.hdt{display:flex;align-items:center;gap:10px;margin-bottom:10px;color:var(--dim)}.hdt ha-icon{--mdc-icon-size:22px}.hdt input{flex:1;min-width:0;height:42px;padding:0 12px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:var(--fg);font:inherit;font-size:15px;color-scheme:dark}.hti{min-height:36px;font-size:12.5px;color:var(--dim);margin:0 2px 6px;line-height:1.4}.hti b{display:block;color:var(--fg);font-weight:600;font-variant-numeric:tabular-nums}.hti span{display:block;color:var(--mute)}.hch{border-radius:16px;background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.12);padding:6px 4px 0;margin-bottom:12px}.hch.ld{aspect-ratio:340/196;display:grid;place-items:center;text-align:center;padding:16px;font-size:13px;color:var(--mute)}.hch svg{display:block;width:100%;height:auto}.hch .gl{stroke:rgba(255,255,255,.07)}.hch .sel{stroke:rgba(255,255,255,.25);stroke-dasharray:3 3}.hch .yl,.hch .xl{fill:rgba(238,250,255,.45);font-size:10.5px;font-variant-numeric:tabular-nums}.hbx{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.hbx div{padding:9px 10px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);min-width:0}.hbx span{display:block;font-size:11.5px;color:var(--mute)}.hbx b{display:block;font-size:20px;font-weight:600;font-variant-numeric:tabular-nums;margin:1px 0}.hbx small{display:block;font-size:11.5px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}</style>
<div class="hst"><div class="hcs">${chips}</div>
<div class="hv"><div><small>${esc(src.name)}</small><div class="big"><b>${f(now)}</b>${trend}</div></div>
<div class="hm"><button class="${T ? "on" : ""}" data-hm="t" aria-label="Temperatura"><ha-icon icon="mdi:thermometer"></ha-icon></button><button class="${T ? "" : "on"}" data-hm="h" aria-label="Humidade"><ha-icon icon="mdi:water-outline"></ha-icon></button></div></div>
<div class="hp">${per}</div>
<label class="hdt"><ha-icon icon="mdi:calendar-search"></ha-icon><input type="date" value="${H.date}" max="${today}" data-hd aria-label="Escolher a data"></label>
<div class="hti">${tip}</div>
${chart}
<div class="hbx"><div><span>Média</span><b style="color:${AC}">${f(A?.mean)}</b><small>no período</small></div><div><span>Mínima</span><b style="color:#7cc4ff">${f(A?.mn?.v)}</b><small>${esc(this._histWhen(A?.mn?.t))}</small></div><div><span>Máxima</span><b style="color:#ff8a5c">${f(A?.mx?.v)}</b><small>${esc(this._histWhen(A?.mx?.t))}</small></div></div></div>`;
  }
  _openHist() {
    const t = new Date();
    this._hist = { sel: "casa", mode: "t", per: "d", date: `${t.getFullYear()}-${p2(t.getMonth() + 1)}-${p2(t.getDate())}`, hi: null };
    this._openSheet({ kind: "hist" });
    this._histLoad();
  }
  // ---------- pessoas (toque nas fotos do topo) ----------
  // mapa + onde está cada um, desde quando e a que distância de casa
  _openPpl() {
    this._pz = 0;
    this._openSheet({ kind: "ppl" });
  }
  // mapa próprio, sem bibliotecas: mosaicos do OpenStreetMap escurecidos (os da CARTO passaram a pedir chave)
  // com a zona de casa e as fotos por cima; o zoom escolhe-se sozinho para caberem todos (+/− ajusta)
  _pplMap() {
    const W = 340,
      H = 210,
      pts = [],
      zh = this._st("zone.home")?.attributes;
    if (zh?.latitude != null) pts.push({ lat: zh.latitude, lon: zh.longitude, r: zh.radius || 100 });
    (this._cfg.persons || []).forEach((p) => {
      const o = this._st(p.entity),
        a = o?.attributes || {};
      if (a.latitude != null) pts.push({ lat: a.latitude, lon: a.longitude, p, pic: a.entity_picture, home: o.state === "home" });
    });
    if (!pts.length) return `<div class="pmw pme">Sem localização</div>`;
    const P = (lat, lon, z) => {
      const n = 256 * 2 ** z,
        s = Math.sin((lat * Math.PI) / 180);
      return [((lon + 180) / 360) * n, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n];
    };
    const caixa = (z) => {
      const q = pts.map((t) => P(t.lat, t.lon, z)),
        xs = q.map((v) => v[0]),
        ys = q.map((v) => v[1]);
      return { q, x1: Math.min(...xs), x2: Math.max(...xs), y1: Math.min(...ys), y2: Math.max(...ys) };
    };
    let z = 16;
    while (z > 3) {
      const c = caixa(z);
      if (c.x2 - c.x1 < W - 80 && c.y2 - c.y1 < H - 80) break;
      z--;
    }
    z = Math.max(3, Math.min(18, z + (this._pz || 0)));
    const c = caixa(z),
      x0 = (c.x1 + c.x2) / 2 - W / 2,
      y0 = (c.y1 + c.y2) / 2 - H / 2,
      n = 2 ** z,
      px = (x) => (((x - x0) / W) * 100).toFixed(3) + "%",
      py = (y) => (((y - y0) / H) * 100).toFixed(3) + "%";
    let tiles = "";
    for (let tx = Math.floor(x0 / 256); tx <= Math.floor((x0 + W) / 256); tx++)
      for (let ty = Math.floor(y0 / 256); ty <= Math.floor((y0 + H) / 256); ty++) {
        if (ty < 0 || ty >= n) continue;
        const wx = ((tx % n) + n) % n;
        tiles += `<img class="pt osm" src="https://tile.openstreetmap.org/${z}/${wx}/${ty}.png" style="left:${px(tx * 256)};top:${py(ty * 256)}" alt="" loading="lazy">`;
      }
    let marks = "",
      usados = [];
    pts.forEach((t, i) => {
      const [x, y] = c.q[i];
      if (!t.p) {
        const mpp = (156543.03 * Math.cos((t.lat * Math.PI) / 180)) / n,
          r = Math.max(10, t.r / mpp);
        marks += `<i class="pz" style="left:${px(x)};top:${py(y)};width:${((2 * r) / W) * 100}%;height:${((2 * r) / H) * 100}%"></i>`;
        return;
      }
      // duas fotos no mesmo sítio ficam lado a lado
      let dx = 0;
      while (usados.some(([ux, uy]) => Math.hypot(ux - (x + dx), uy - y) < 26)) dx += 24;
      usados.push([x + dx, y]);
      marks += `<span class="pa ${t.home ? "home" : ""}" style="left:${px(x + dx)};top:${py(y)};background-color:${t.p.color};${t.pic ? `background-image:url('${esc(t.pic)}')` : ""}">${t.pic ? "" : esc(t.p.initial)}</span>`;
    });
    return `<div class="pmw">${tiles}${marks}<div class="pmz"><button data-pz="1" aria-label="Aproximar">+</button><button data-pz="-1" aria-label="Afastar">−</button></div><small class="pcr">© OpenStreetMap</small></div>`;
  }
  // distância em linha reta entre dois pontos (km)
  _km(a, b) {
    const R = 6371,
      r = (x) => (x * Math.PI) / 180,
      dLa = r(b[0] - a[0]),
      dLo = r(b[1] - a[1]);
    const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  _pplHtml() {
    const z = this._st("zone.home")?.attributes || {},
      casa = z.latitude != null ? [z.latitude, z.longitude] : null;
    const desde = (iso) => {
      const d = new Date(iso),
        t = new Date(),
        h = p2(d.getHours()) + ":" + p2(d.getMinutes()),
        ontem = new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1);
      if (d.toDateString() === t.toDateString()) return "desde as " + h;
      if (d.toDateString() === ontem.toDateString()) return "desde ontem, " + h;
      return "desde " + d.toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "") + ", " + h;
    };
    const rows = (this._cfg.persons || [])
      .map((p) => {
        const o = this._st(p.entity),
          a = o?.attributes || {},
          st = o?.state,
          pic = a.entity_picture,
          onde = st === "home" ? "Em casa" : st === "not_home" ? "Fora" : !st || st === "unknown" || st === "unavailable" ? "Sem localização" : st,
          km = casa && st !== "home" && a.latitude != null ? this._km(casa, [a.latitude, a.longitude]) : null,
          dist = km == null ? "" : km < 1 ? "a " + Math.max(10, Math.round((km * 1000) / 10) * 10) + " m" : "a " + fmt1(km) + " km";
        return `<div class="pr"><span class="av ${st === "home" ? "home" : ""}" style="background-color:${p.color};${pic ? `background-image:url('${esc(pic)}')` : ""}">${pic ? "" : esc(p.initial)}</span><div><b>${esc(a.friendly_name || p.entity)}</b><small><i class="${st === "home" ? "in" : ""}">${esc(onde)}</i>${o ? " · " + desde(o.last_changed) : ""}</small></div>${dist ? `<em>${dist}</em>` : ""}</div>`;
      })
      .join("");
    return `<style>.pmw{position:relative;aspect-ratio:340/210;overflow:hidden;border-radius:16px;border:1px solid rgba(255,255,255,.12);background:#1b2329;margin-bottom:12px}.pme{display:grid;place-items:center;color:var(--mute);font-size:13px}.pt{position:absolute;width:75.294%;height:121.905%;max-width:none;user-select:none;pointer-events:none}.pt.osm{filter:invert(1) hue-rotate(180deg) brightness(.85) contrast(.9)}.pz{position:absolute;transform:translate(-50%,-50%);border-radius:50%;background:rgba(101,216,222,.15);border:1.5px solid rgba(101,216,222,.7)}.pa{position:absolute;width:34px;height:34px;transform:translate(-50%,-50%);border-radius:50%;border:2.5px solid var(--mute);background-size:cover;background-position:center;display:grid;place-items:center;font-weight:700;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.5)}.pa.home{border-color:var(--ok)}.pmz{position:absolute;right:8px;top:8px;display:flex;flex-direction:column;gap:4px}.pmz button{width:34px;height:34px;border-radius:10px;background:rgba(15,32,45,.85);border:1px solid rgba(255,255,255,.15);font-size:18px;font-weight:700;color:var(--fg)}.pcr{position:absolute;right:6px;bottom:3px;font-size:9px;color:rgba(255,255,255,.45)}.pr{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);margin-bottom:6px}.pr .av{width:42px;height:42px;flex:none;font-size:15px;border-radius:50%;display:grid;place-items:center;font-weight:700;position:relative;border:2px solid #10242b;background-size:cover;background-position:center}.pr .av::after{content:"";position:absolute;right:-2px;bottom:-2px;width:11px;height:11px;border-radius:50%;background:var(--mute);border:2px solid #10242b}.pr .av.home::after{background:var(--ok)}.pr div{flex:1;min-width:0}.pr b{display:block;font-size:15px}.pr small{display:block;font-size:12.5px;color:var(--dim);margin-top:1px}.pr small i{font-style:normal;font-weight:600;color:var(--fg)}.pr small i.in{color:var(--ok)}.pr em{font-style:normal;font-size:13px;font-weight:700;color:var(--cyan);white-space:nowrap}</style><div class="sh"><div><b>Pessoas</b><small>Onde está cada um</small></div><button class="x" data-close>Fechar</button></div>
${this._pplMap()}${rows}`;
  }
  // ---------- calendário (toque no dia do topo) ----------
  // calendários a mostrar: os do YAML (calendars: [{entity, name, color}]) ou, por omissão, todos os calendar.* do HA
  _calList() {
    const COR = ["#65d8de", "#f6b84b", "#a78bfa", "#5fd39a", "#ff8a5c", "#7cc4ff"];
    const L = this._cfg.calendars || Object.keys(this._hass?.states || {}).filter((e) => e.startsWith("calendar."));
    return L.map((x, i) => {
      const o = typeof x === "string" ? { entity: x } : x;
      return { entity: o.entity, name: o.name || this._st(o.entity)?.attributes?.friendly_name || o.entity, color: o.color || COR[i % COR.length] };
    });
  }
  _openCal() {
    const t = new Date();
    this._cal = { y: t.getFullYear(), m: t.getMonth(), sel: `${t.getFullYear()}-${p2(t.getMonth() + 1)}-${p2(t.getDate())}` };
    this._openSheet({ kind: "cal" });
    this._calLoad();
  }
  // 6 semanas a começar na segunda-feira antes do dia 1 do mês
  _calGrid() {
    const C = this._cal,
      f = new Date(C.y, C.m, 1),
      a = new Date(C.y, C.m, 1 - ((f.getDay() + 6) % 7));
    return { a, b: new Date(a.getFullYear(), a.getMonth(), a.getDate() + 42) };
  }
  // pede os eventos do mês visível (guardados 5 min)
  _calLoad() {
    const C = this._cal,
      k = C.y + "-" + C.m,
      L = this._calList(),
      G = this._calGrid();
    this._cc = this._cc || {};
    const c = this._cc[k];
    if (!L.length || (c && (c.loading || Date.now() - c.t < 300000))) return;
    this._cc[k] = { loading: true, ev: c?.ev };
    this._hass
      .callWS({ type: "call_service", domain: "calendar", service: "get_events", service_data: { start_date_time: G.a.toISOString(), end_date_time: G.b.toISOString() }, target: { entity_id: L.map((x) => x.entity) }, return_response: true })
      .then((r) => {
        const ev = [];
        for (const x of L) for (const e of r?.response?.[x.entity]?.events || []) ev.push({ ...e, cor: x.color, cal: x.name });
        this._cc[k] = { ev, t: Date.now() };
      })
      .catch(() => (this._cc[k] = { err: true, ev: [], t: Date.now() }))
      .finally(() => this._sheet?.kind === "cal" && this._renderSheet());
  }
  // eventos por dia ("AAAA-MM-DD" -> lista); um evento de vários dias aparece em todos
  _calByDay(ev) {
    const out = {},
      ymd = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`,
      pd = (s) => (s.length <= 10 ? new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) : new Date(s));
    for (const e of ev) {
      const allDay = String(e.start).length <= 10,
        s = pd(String(e.start)),
        en = pd(String(e.end || e.start));
      let d = new Date(s.getFullYear(), s.getMonth(), s.getDate());
      for (let n = 0; n < 62; n++) {
        if (n > 0 && (allDay ? d >= en : d >= en)) break;
        (out[ymd(d)] ||= []).push({ ...e, allDay, s, en });
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      }
    }
    for (const k in out) out[k].sort((x, y) => (x.allDay === y.allDay ? x.s - y.s : x.allDay ? -1 : 1));
    return out;
  }
  _calHtml() {
    const C = this._cal,
      L = this._calList(),
      D = this._cc?.[C.y + "-" + C.m],
      G = this._calGrid(),
      byDay = this._calByDay(D?.ev || []),
      t0 = new Date(),
      today = `${t0.getFullYear()}-${p2(t0.getMonth() + 1)}-${p2(t0.getDate())}`,
      hm = (d) => p2(d.getHours()) + ":" + p2(d.getMinutes());
    const mes = new Date(C.y, C.m, 1).toLocaleDateString("pt-PT", { month: "long", year: "numeric" }).replace(" de ", " ");
    let cells = "";
    for (let i = 0; i < 42; i++) {
      const d = new Date(G.a.getFullYear(), G.a.getMonth(), G.a.getDate() + i),
        k = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`,
        evs = byDay[k] || [],
        cores = [...new Set(evs.map((e) => e.cor))].slice(0, 3);
      cells += `<button class="cd ${d.getMonth() !== C.m ? "fo" : ""} ${k === today ? "hj" : ""} ${k === C.sel ? "se" : ""}" data-cd="${k}" aria-label="${d.getDate()}${evs.length ? ", " + evs.length + " eventos" : ""}"><b>${d.getDate()}</b><i>${cores.map((c) => `<s style="background:${c}"></s>`).join("")}</i></button>`;
    }
    const [sy, sm, sd] = C.sel.split("-").map(Number),
      sDate = new Date(sy, sm - 1, sd),
      dn = sDate.toLocaleDateString("pt-PT", { weekday: "long" }).replace("-feira", ""),
      titulo = (C.sel === today ? "Hoje · " : "") + dn.charAt(0).toUpperCase() + dn.slice(1) + ", " + sd + " " + sDate.toLocaleDateString("pt-PT", { month: "long" }),
      lst = byDay[C.sel] || [];
    const lista = !L.length
      ? `<p class="cvz">Não há calendários no Home Assistant.</p>`
      : !D || (D.loading && !D.ev)
        ? `<p class="cvz">A carregar…</p>`
        : D.err
          ? `<p class="cvz">Não foi possível ler o calendário.</p>`
          : lst.length
            ? lst
                .map(
                  (e) =>
                    `<div class="ce" style="--c:${e.cor}"><span class="ch">${e.allDay ? "Dia todo" : hm(e.s) + "<small>" + hm(e.en) + "</small>"}</span><div><b>${esc(e.summary || "(sem título)")}</b>${e.location ? `<small>${esc(e.location)}</small>` : ""}${L.length > 1 ? `<small>${esc(e.cal)}</small>` : ""}</div></div>`,
                )
                .join("")
            : `<p class="cvz">Nada marcado.</p>`;
    return `<style>.cm{display:flex;align-items:center;gap:6px;margin:2px 0 10px}.cm b{flex:1;font-size:16px;text-transform:capitalize}.cm button{height:36px;min-width:36px;padding:0 10px;border-radius:11px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);font-size:14px;font-weight:600;color:var(--dim)}.cm button ha-icon{--mdc-icon-size:20px}.cw,.cg{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}.cw span{text-align:center;font-size:11px;font-weight:700;color:var(--mute);text-transform:uppercase;padding-bottom:2px}.cd{height:44px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-variant-numeric:tabular-nums}.cd b{font-size:14.5px;font-weight:500;width:28px;height:28px;line-height:28px;border-radius:50%;text-align:center}.cd i{display:flex;gap:2px;height:5px}.cd s{width:5px;height:5px;border-radius:50%;text-decoration:none}.cd.fo{opacity:.35}.cd.hj b{color:var(--cyan);font-weight:800;box-shadow:inset 0 0 0 1.5px var(--cyan)}.cd.se{background:rgba(101,216,222,.14)}.cd.se b{background:var(--cyan);color:#06262b;box-shadow:none;font-weight:800}.cdh{font-size:13px;font-weight:700;color:var(--dim);margin:14px 2px 8px}.ce{display:flex;gap:12px;align-items:flex-start;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-left:4px solid var(--c);margin-bottom:6px}.ce .ch{width:58px;flex:none;font-size:13.5px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--c)}.ce .ch small{display:block;font-weight:500;color:var(--mute)}.ce div{min-width:0}.ce b{display:block;font-size:14.5px}.ce div small{display:block;font-size:12px;color:var(--dim);margin-top:1px}.cvz{font-size:13px;color:var(--mute);margin:4px 2px}</style><div class="sh"><div><b>Calendário</b>${L.length === 1 ? `<small>${esc(L[0].name)}</small>` : ""}</div><button class="x" data-close>Fechar</button></div>
<div class="cm"><button data-cm="-1" aria-label="Mês anterior"><ha-icon icon="mdi:chevron-left"></ha-icon></button><b>${esc(mes)}</b><button data-ct>Hoje</button><button data-cm="1" aria-label="Mês seguinte"><ha-icon icon="mdi:chevron-right"></ha-icon></button></div>
<div class="cw">${["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].map((x) => `<span>${x}</span>`).join("")}</div>
<div class="cg">${cells}</div>
<div class="cdh">${esc(titulo)}</div>${lista}`;
  }
  // ---------- cenários (botão no topo do telemóvel) ----------
  // um botão por cenário do YAML (scenes); mostra "A correr…" enquanto o script corre e "Ativado ✓" depois do toque
  _scenesHtml() {
    const S = this._cfg.scenes || [];
    const rows = S.map((x, i) => {
      const ent = typeof x.data?.entity_id === "string" && x.data.entity_id.startsWith("script.") ? x.data.entity_id : null,
        run = ent && this._st(ent)?.state === "on",
        done = this._scDone === i,
        st = run ? "A correr…" : done ? "Ativado ✓" : "";
      return `<button class="scb ${run || done ? "on" : ""} ${run ? "run" : ""}" data-scn="${i}" style="--ac:${esc(x.color || "#65d8de")}"><span><ha-icon icon="${esc(x.icon || "mdi:play")}"></ha-icon></span><div><b>${esc(x.name)}</b>${x.desc ? `<small>${esc(x.desc)}</small>` : ""}</div>${st ? `<em>${st}</em>` : `<ha-icon class="pl" icon="mdi:play"></ha-icon>`}</button>`;
    }).join("");
    return `<style>.scl{display:flex;flex-direction:column;gap:8px}.scb{display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px;border-radius:16px;text-align:left;font:inherit;color:inherit;cursor:pointer;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12)}.scb>span{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;flex:none;background:color-mix(in srgb,var(--ac) 16%,transparent);color:var(--ac)}.scb>span ha-icon{--mdc-icon-size:24px}.scb div{flex:1;min-width:0}.scb b{display:block;font-size:15.5px}.scb small{display:block;font-size:12px;opacity:.65;margin-top:1px}.scb .pl{--mdc-icon-size:20px;opacity:.45}.scb em{font-style:normal;font-size:12.5px;font-weight:700;color:var(--ac);white-space:nowrap}.scb.on{background:color-mix(in srgb,var(--ac) 16%,transparent);border-color:color-mix(in srgb,var(--ac) 60%,transparent)}.scb.run>span{animation:scp 1.2s ease-in-out infinite}@keyframes scp{50%{box-shadow:0 0 0 6px color-mix(in srgb,var(--ac) 22%,transparent)}}@media (prefers-reduced-motion: reduce){.scb.run>span{animation:none}}</style><div class="sh"><div><b>Cenários</b><small>Toca num cenário para o ativar</small></div><button class="x" data-close>Fechar</button></div>
<div class="scl">${rows || `<p class="sub">Não há cenários configurados.</p>`}</div>`;
  }
  // ---------- painéis (fita LED, AC e alertas) ----------
  _openSheet(s) {
    this._sheet = s;
    if (!this._pushed) {
      this._pushed = true;
      history.pushState(history.state, "", location.pathname + location.search + "#casa-painel");
    }
    this._renderSheet();
    this._armIdle();
  }
  _closeSheet() {
    this._sheet = null;
    if (this._portal) {
      this._portal.remove();
      this._portal = null;
    }
    if (this._stale) this._render();
    if (this._pushed) {
      this._pushed = false;
      history.back();
    }
  }
  // desenha o popup aberto (alertas, fita LED ou ar condicionado)
  _renderSheet() {
    const s = this._sheet;
    if (!s || !this._hass) return;
    if (!this._portal) {
      this._portal = document.createElement("div");
      this._portal.attachShadow({ mode: "open" });
      const sr = this._portal.shadowRoot;
      sr.addEventListener("click", (e) => this._onSheetClick(e));
      sr.addEventListener("input", (e) => this._onSheetInput(e));
      sr.addEventListener("change", (e) => this._onSheetChange(e));
      sr.addEventListener("pointerdown", (e) => {
        this._armIdle();
        if (e.target.matches?.("input[type=range]")) this._sBusy = true;
        // arrastar a pega para baixo fecha a janela
        const g = e.target.closest?.(".grab");
        if (g) {
          this._sd = { y0: e.clientY, dy: 0, el: sr.querySelector(".sheet") };
          try {
            g.setPointerCapture(e.pointerId);
          } catch (_) {}
        }
      });
      sr.addEventListener("pointermove", (e) => {
        const d = this._sd;
        if (!d?.el) return;
        d.dy = Math.max(0, e.clientY - d.y0);
        d.el.style.transition = "none";
        d.el.style.transform = `translateY(${d.dy}px)`;
      });
      const dragEnd = () => {
        const d = this._sd;
        this._sd = null;
        if (!d?.el) return;
        if (d.dy > 80) return this._closeSheet();
        d.el.style.transition = "transform .2s";
        d.el.style.transform = "";
      };
      sr.addEventListener("pointerup", dragEnd);
      sr.addEventListener("pointercancel", dragEnd);
      sr.addEventListener("keydown", (e) => {
        if (e.key === "Escape") this._closeSheet();
      });
      document.body.appendChild(this._portal);
    }
    if (this._sBusy) return;
    const r = this._room(s.room);
    let body = "";
    if (s.kind === "alerts") {
      const al = this._alerts();
      body = `<div class="sh"><div><b>Alertas</b></div><button class="x" data-close>Fechar ✕</button></div>
<p class="sub">Os que têm botão resolves aqui. Os outros pedem uma ação física e desaparecem sozinhos quando o problema acabar.</p>
${
  al.length
    ? al
        .map(
          (a) =>
            `<div class="ai ${a.lvl}"><span class="ico"><ha-icon icon="${a.icon}"></ha-icon></span><span class="tx"><b>${esc(a.t)}</b>${a.s ? `<small>${esc(a.s)}</small>` : ""}</span>${
              a.btn
                ? `<button class="abtn ${this._confirm === a.k ? "cf" : ""}" data-alert="${esc(a.k)}">${this._confirm === a.k ? "Confirmar?" : esc(a.btn)}</button>`
                : `<span class="phys">${esc(a.phys || "")}</span>`
            }</div>`,
        )
        .join("")
    : `<div class="allok"><ha-icon icon="mdi:check"></ha-icon>Tudo em ordem</div>`
}`;
    } else if (s.kind === "led") {
      const l = r.lights[s.i],
        o = this._st(l.entity),
        on = o?.state === "on",
        c = this._ledColor(l),
        wl = on ? this._whiteLvl(l) : null,
        bri = this._bri(l) || 50;
      const pre = on ? this._ledPreset(l) : null;
      const modes = o?.attributes?.supported_color_modes || [];
      const cct = modes.includes("color_temp");
      const tab = s.tab || (pre && pre[0] === "c" ? "c" : "w");
      body = `<div class="sh"><div><b>${esc(l.name)} · ${esc(r.name)}</b><small>${on ? this._presetName(pre) + " · " + bri + "%" : "Desligada"}</small></div>
<button class="pw ${on ? "on" : ""}" data-pw aria-label="Ligar ou desligar"></button></div>
<div class="glow ${on ? "" : "off"}" style="--c:${c};opacity:${on ? 0.4 + bri / 170 : 1}"></div>
<div class="sg"><label>Intensidade<em id="briT">${on ? bri + "%" : "—"}</em></label>
<input type="range" min="1" max="100" value="${bri}" data-bri style="--p:${bri}%;--fill:${c}" aria-label="Intensidade">
<div class="seg" style="margin-top:6px">${LEVELS.map(([n, v]) => `<button class="${on && Math.abs(bri - v) <= 2 ? "on" : ""}" data-lvl="${v}">${n}</button>`).join("")}</div></div>
${wl ? `<div class="sg"><label>Branco<em id="wbT">${wl.pct}%</em></label>
<input type="range" min="1" max="100" value="${wl.pct}" data-wbri style="--p:${wl.pct}%;--fill:#fff1e3" aria-label="Brilho do branco"></div>` : ""}
<div class="tabs2"><button class="${tab === "w" ? "on" : ""}" data-tab="w">Brancos</button><button class="${tab === "c" ? "on" : ""}" data-tab="c">Cores</button></div>
${
  tab === "w"
    ? `<div class="pal w5">${this._whites()
        .map(
          (w, i) =>
            `<button class="pc ${pre === "w" + i ? "on" : ""}" style="--c:${esc(w.color)}" data-pre="w${i}"><i></i>${esc(w.name)}</button>`,
        )
        .join("")}</div>
<p class="note">${cct ? "Esta fita tem branco real: cada tom envia a temperatura de cor certa." : "Fita RGBW: o branco tem brilho próprio, na barra Branco (só aparece com um branco escolhido). Cada branco começa no valor do 4.º número de rgbw na configuração do cartão."}</p>`
    : `<div class="pal">${this._colors()
        .map(
          (p, i) =>
            `<button class="pc ${pre === "c" + i ? "on" : ""}" style="--c:${rgbCss(p.rgb)}" data-pre="c${i}"><i></i>${esc(p.name)}</button>`,
        )
        .join("")}</div>
<div class="sg" style="margin:14px 0 0"><label>Outra cor</label><input type="range" class="hue" min="0" max="359" value="${num(o?.attributes?.hs_color?.[0], 200)}" data-hue aria-label="Escolher cor"></div>`
}`;
    } else if (s.kind === "alarm") {
      // menu próprio do Alarmo: estado + Desarmar / Em casa / Ausente
      const o = this._st(this._cfg.alarm),
        st = o?.state || "unavailable",
        a = o?.attributes || {};
      const M = {
        disarmed: ["Desarmado", "mdi:shield-off-outline", "#4ADE80", "A casa não está a ser vigiada"],
        armed_home: ["Armado · em casa", "mdi:shield-home", "#64A0FF", "Vigiada com alguém em casa"],
        armed_away: ["Armado · ausente", "mdi:shield-lock", "#F87171", "A casa toda está vigiada"],
        armed_night: ["Armado · noite", "mdi:shield-moon", "#A78BFA", "Modo noite"],
        arming: ["A armar…", "mdi:shield-sync", "#FBBF24", a.delay ? `Fica armado daqui a ${a.delay} s` : "Sai antes de terminar a contagem"],
        pending: ["Entrada detetada", "mdi:shield-alert", "#FBBF24", "Desarma já se foste tu"],
        triggered: ["Alarme disparado", "mdi:alarm-light", "#F87171", "Desarma para parar"],
      };
      const [txt, ic, col, desc] = M[st] || ["Indisponível", "mdi:shield-off", "#9fb3ba", "O Alarmo não está a responder"];
      const cur = st === "arming" ? a.arm_mode || a.next_state : st;
      const opts = [
        ["disarmed", "Desarmar", "mdi:shield-off-outline", "Desliga a vigilância", "#4ADE80"],
        ["armed_home", "Em casa", "mdi:shield-home", "Para quando há alguém em casa", "#64A0FF"],
        ["armed_away", "Ausente", "mdi:shield-lock", "Para quando sai toda a gente", "#F87171"],
      ];
      const abertos = a.open_sensors && typeof a.open_sensors === "object" ? Object.keys(a.open_sensors).map((e) => this._st(e)?.attributes?.friendly_name || e) : [];
      body = `<style>.alh{display:flex;align-items:center;gap:14px;padding:14px;border-radius:18px;margin:4px 0 12px;background:linear-gradient(120deg,color-mix(in srgb,var(--ac) 20%,transparent),rgba(255,255,255,.02));border:1px solid color-mix(in srgb,var(--ac) 40%,transparent)}.ali{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;flex:none;background:color-mix(in srgb,var(--ac) 18%,transparent);border:1.5px solid color-mix(in srgb,var(--ac) 60%,transparent);color:var(--ac)}.ali ha-icon{--mdc-icon-size:30px}.ali.pul{animation:alp 1.2s ease-in-out infinite}@keyframes alp{50%{box-shadow:0 0 0 8px color-mix(in srgb,var(--ac) 22%,transparent)}}.alh b{display:block;font-size:18px;color:var(--ac)}.alh small{display:block;font-size:12.5px;opacity:.7;margin-top:2px}.alw{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;line-height:1.4;padding:9px 12px;border-radius:12px;margin-bottom:10px;background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.3)}.alw ha-icon{color:#FBBF24;flex:none;--mdc-icon-size:18px}.alo{display:flex;flex-direction:column;gap:8px}.aop{display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px;border-radius:16px;text-align:left;font:inherit;color:inherit;cursor:pointer;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1)}.aop>span{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;flex:none;background:color-mix(in srgb,var(--ac) 14%,transparent);color:var(--ac)}.aop>span ha-icon{--mdc-icon-size:24px}.aop div{flex:1;min-width:0}.aop b{display:block;font-size:15px}.aop small{display:block;font-size:12px;opacity:.65;margin-top:1px}.aop.on{background:color-mix(in srgb,var(--ac) 16%,transparent);border-color:color-mix(in srgb,var(--ac) 60%,transparent)}.aop.on::after{content:"✓";color:var(--ac);font-weight:800;font-size:18px}.aop:disabled{opacity:.45;cursor:default}.almore{margin-top:10px;width:100%;padding:10px;border-radius:12px;background:none;border:1px solid rgba(255,255,255,.1);color:inherit;font:inherit;font-size:13px;opacity:.75;cursor:pointer}@media (prefers-reduced-motion: reduce){.ali.pul{animation:none}}</style><div class="sh"><div><b>Alarme</b><small>${txt}</small></div><button class="x" data-close>Fechar</button></div>
<div class="alh" style="--ac:${col}"><span class="ali ${["arming", "pending", "triggered"].includes(st) ? "pul" : ""}"><ha-icon icon="${ic}"></ha-icon></span><div><b>${txt}</b><small>${esc(desc)}</small></div></div>
${abertos.length ? `<div class="alw"><ha-icon icon="mdi:door-open"></ha-icon><span>Não armou porque há sensores abertos: ${abertos.map((n) => esc(n)).join(", ")}</span></div>` : ""}
<div class="alo">${opts
  .map(
    ([k, n, i, d, cc]) =>
      `<button class="aop ${cur === k ? "on" : ""}" data-arm="${k}" style="--ac:${cc}" ${st === "unavailable" ? "disabled" : ""}><span><ha-icon icon="${i}"></ha-icon></span><div><b>${n}</b><small>${d}</small></div></button>`,
  )
  .join("")}</div>
<button class="almore" data-more="${this._cfg.alarm}">Mais detalhes ›</button>`;
    } else if (s.kind === "gate") {
      // portão: pergunta antes de abrir ou fechar (igual à Garagem)
      const gr = this._cfg.rooms.find((x) => x.gate),
        gc = gr ? this._gateClosed(gr) : null,
        verbo = gc === false ? "fechar" : "abrir";
      body = `<div class="sh"><div><b>Portão da garagem</b><small>${gc == null ? "estado desconhecido" : gc ? "fechado" : "aberto"}</small></div><button class="x" data-close>Fechar</button></div>
<p class="sub">Queres ${verbo} o portão?</p>
<div style="display:flex;gap:10px;margin-top:6px"><button class="abtn cf" data-gyes style="flex:1;height:48px;font-size:15px">Sim, ${verbo}</button><button class="abtn" data-close style="flex:1;height:48px;font-size:15px">Cancelar</button></div>`;
    } else if (s.kind === "wx") {
      body = this._wxHtml();
    } else if (s.kind === "ppl") {
      body = this._pplHtml();
    } else if (s.kind === "cal") {
      body = this._calHtml();
    } else if (s.kind === "scenes") {
      body = this._scenesHtml();
    } else if (s.kind === "hist") {
      body = this._histHtml();
    } else if (s.kind === "ac") {
      const o = this._st(r.climate),
        a = o?.attributes || {};
      const fans = FANS.filter(([k]) => (a.fan_modes || []).includes(k));
      const pres = PRESETS.filter(([k]) => (a.preset_modes || []).includes(k));
      body = `<div class="sh"><div><b>AC · ${esc(r.name)}</b><small>${a.current_temperature != null ? "agora " + a.current_temperature + "° · " : ""}alvo ${a.temperature ?? "—"}°</small></div><button class="x" data-close>Fechar</button></div>
${fans.length ? `<div class="sg"><label>Ventoinha</label><div class="seg">${fans.map(([k, n]) => `<button class="${a.fan_mode === k ? "on" : ""}" data-fan="${k}">${n}</button>`).join("")}</div></div>` : ""}
${pres.length ? `<div class="sg"><label>Preset</label><div class="seg">${pres.map(([k, n]) => `<button class="${a.preset_mode === k ? "on" : ""}" data-preset="${k}">${n}</button>`).join("")}</div></div>` : ""}
<div class="sg" style="margin-bottom:0"><label>Outros modos</label><div class="seg"><button class="${o?.state === "auto" ? "on" : ""}" data-hv="auto">Auto</button><button class="${o?.state === "fan_only" ? "on" : ""}" data-hv="fan_only">Só ventilar</button><button data-more="${r.climate}">Detalhes ›</button></div></div>`;
    }
    // só redesenha o conteúdo do painel se mudou, e sem repetir a animação de abertura (era isto que fazia piscar)
    const inner = `${this._tab ? "" : `<div class="grab"></div>`}${body}`;
    const sheet = this._portal.shadowRoot.querySelector(".sheet");
    if (sheet) {
      if (this._sheetHtml !== inner) {
        this._sheetHtml = inner;
        sheet.innerHTML = inner;
      }
      return;
    }
    this._sheetHtml = inner;
    this._portal.shadowRoot.innerHTML = `<style>${ESTILOS.CORES}${ESTILOS.BASE}${ESTILOS.PAINEIS}</style>
<div class="scrim ${this._tab ? "ctr" : ""}" data-scrim><div class="sheet" role="dialog" aria-modal="true">${inner}</div></div>`;
  }
  // ---------- ações ----------
  _call(d, s, data) {
    return this._hass.callService(d, s, data);
  }
  _more(entityId) {
    const ev = new Event("hass-more-info", { bubbles: true, composed: true });
    ev.detail = { entityId };
    this.dispatchEvent(ev);
  }
  _endBusy() {
    if (this._busy) {
      this._busy = false;
      setTimeout(() => this._render(), 600);
    }
  }
  // slider dos estores: só mexe quando se arrasta na horizontal; tocar ou deslizar na vertical (scroll) não muda nada
  _dragMove(e) {
    const d = this._drag;
    if (!d) return;
    const dx = e.clientX - d.x0,
      dy = e.clientY - d.y0;
    if (!d.on) {
      if (Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(dx)) {
        this._drag = null;
        return;
      }
      if (Math.abs(dx) < 10) return;
      d.on = true;
      this._busy = true;
      try {
        d.g.setPointerCapture(d.id);
      } catch (_) {}
    }
    const r = d.g.getBoundingClientRect(),
      inp = d.g.querySelector("input");
    d.p = Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)) / 5) * 5;
    inp.value = d.p;
    this._onInput({ target: inp });
  }
  _dragEnd() {
    const d = this._drag;
    this._drag = null;
    if (d && d.on && d.p != null) this._onChange({ target: d.g.querySelector("input") });
    else if (d && d.on) this._endBusy();
  }
  _dragCancel() {
    const d = this._drag;
    this._drag = null;
    if (d && d.on) this._endBusy();
  }
  _select(id) {
    this._sel = id;
    this._gateAsk = false;
    try {
      localStorage.setItem("casa-tlm-sel", id);
    } catch (_) {}
    this._armIdle();
    this._render();
  }
  // fecha o painel aberto e volta a "Casa toda" depois de return_after segundos sem toques (tablet: 60 s por defeito; telemóvel: desligado)
  _armIdle() {
    clearTimeout(this._idle);
    const secs = this._cfg?.return_after ?? (this._tab ? 60 : 0);
    if (!secs || (this._sel === "casa" && !this._sheet)) return;
    this._idle = setTimeout(() => {
      if (this._busy || this._sBusy) return this._armIdle();
      if (this._sheet) this._closeSheet();
      this._sel = "casa";
      this._gateAsk = false;
      this._confirm = null;
      try {
        localStorage.setItem("casa-tlm-sel", "casa");
      } catch (_) {}
      this._render();
    }, secs * 1000);
  }
  // ---------- TOQUES NOS BOTÕES ----------
  // cada botão tem um data-... que diz o que fazer (data-light, data-q, data-mode, ...)
  _onClick(e) {
    if (e.target.closest?.("[data-ppl]")) return this._openPpl();
    const b = e.target.closest?.("button");
    if (!b) {
      if (e.target.closest?.("[data-plan]")) {
        const rid = this._planHit(e);
        if (rid) this._select(rid);
      }
      return;
    }
    const d = b.dataset;
    if (d.alert) return this._doAlert(d.alert);
    if ("allalerts" in d) return this._openSheet({ kind: "alerts" });
    if ("gatepop" in d) return this._openSheet({ kind: "gate" });
    if ("alarmpop" in d) return this._openSheet({ kind: "alarm" });
    if ("wxpop" in d) return this._openWx();
    if ("histpop" in d) return this._openHist();
    if ("scenepop" in d) return this._openSheet({ kind: "scenes" });
    if ("calpop" in d) return this._openCal();
    if (d.scene != null) {
      const x = this._cfg.scenes[Number(d.scene)],
        [dom, svc] = (x.action || x.service).split(".");
      b.classList.add("run");
      setTimeout(() => b.classList.remove("run"), 900);
      return this._call(dom, svc, x.data || {});
    }
    if (d.roff) return this._call("light", "turn_off", { entity_id: (this._room(d.roff)?.lights || []).map((l) => l.entity) });
    if (d.acoff) {
      clearTimeout(this._acT);
      if (this._acAsk !== d.acoff) {
        // 1.º toque: pede confirmação durante 4 s
        this._acAsk = d.acoff;
        this._acT = setTimeout(() => {
          this._acAsk = null;
          this._render();
        }, 4000);
        return this._render();
      }
      this._acAsk = null;
      this._render();
      return this._call("climate", "set_hvac_mode", { entity_id: this._room(d.acoff).climate, hvac_mode: "off" });
    }
    if (d.pick) return this._select(d.pick);
    if (d.light) return this._call("light", "toggle", { entity_id: d.light });
    if (d.toggle) return this._call("homeassistant", "toggle", { entity_id: d.toggle });
    if (d.more) return this._more(d.more);
    if (d.led) {
      const [room, i] = d.led.split(":");
      return this._openSheet({ kind: "led", room, i: Number(i) });
    }
    if (d.acmore) return this._openSheet({ kind: "ac", room: d.acmore });
    if (d.q) {
      const [rid, i, q] = d.q.split(":");
      return this._call("cover", "set_cover_position", { entity_id: this._room(rid).covers[i].entity, position: Number(q) });
    }
    if (d.allq != null) {
      const q = Number(d.allq);
      if (q === 0) return this._call("cover", "close_cover", { entity_id: this._cfg.all_cover });
      if (q === 100) return this._call("cover", "open_cover", { entity_id: this._cfg.all_cover });
      return this._call("cover", "set_cover_position", { entity_id: this._cfg.all_cover, position: q });
    }
    if ("alloff" in d)
      return this._call("light", "turn_off", {
        entity_id: this._cfg.rooms.flatMap((r) => (r.lights || []).map((l) => l.entity)),
      });
    if (d.mode) {
      const [rid, m] = d.mode.split(":");
      return this._call("climate", "set_hvac_mode", { entity_id: this._room(rid).climate, hvac_mode: m });
    }
    if (d.ac) {
      const [rid, step] = d.ac.split(":"),
        ent = this._room(rid).climate,
        a = this._st(ent)?.attributes || {};
      const cur = this._pendTemp[ent] ?? num(a.temperature, 22);
      const v = Math.min(num(a.max_temp, 30), Math.max(num(a.min_temp, 16), cur + Number(step) * num(a.target_temp_step, 1)));
      this._pendTemp[ent] = v;
      this._render();
      clearTimeout(this._tTimer);
      this._tTimer = setTimeout(() => {
        const send = { ...this._pendTemp };
        this._pendTemp = {};
        Object.entries(send).forEach(([entity_id, temperature]) =>
          this._call("climate", "set_temperature", { entity_id, temperature }),
        );
      }, 700);
      return;
    }
    if (d.al) {
      if (d.al === "fan") return this._call("fan", "turn_on", { entity_id: this._room(d.r).fan });
      if (d.al === "water") return this._more(this._cfg.water_alert);
      if (d.al === "gate") return this._select(d.r);
    }
    if (d.num) {
      const i = d.num.lastIndexOf(":"),
        ent = d.num.slice(0, i),
        a = this._st(ent)?.attributes || {};
      const v = Math.min(
        num(a.max, 100),
        Math.max(num(a.min, 0), Math.round(num(this._st(ent)?.state, 0)) + Number(d.num.slice(i + 1))),
      );
      return this._call("input_number", "set_value", { entity_id: ent, value: v });
    }
    if (d.gate === "ask") {
      this._gateAsk = true;
      return this._render();
    }
    if (d.gate === "no") {
      this._gateAsk = false;
      return this._render();
    }
    if (d.gate === "yes") {
      this._gateAsk = false;
      const r = this._cfg.rooms.find((x) => x.gate);
      this._call("switch", "toggle", { entity_id: r.gate.switch });
      return this._render();
    }
  }
  _onInput(e) {
    const t = e.target,
      d = t.dataset;
    if (!d.cov) return;
    const [rid, i] = d.cov.split(":"),
      p = Number(t.value),
      sr = this.shadowRoot;
    t.style.setProperty("--p", p + "%");
    sr.getElementById(`w-${rid}-${i}`).style.height = 100 - p + "%";
    sr.getElementById(`t-${rid}-${i}`).textContent = p === 0 ? "Fechado" : p === 100 ? "Aberto" : p + "%";
  }
  _onChange(e) {
    const t = e.target,
      d = t.dataset;
    if (!d.cov) return;
    const [rid, i] = d.cov.split(":");
    this._call("cover", "set_cover_position", { entity_id: this._room(rid).covers[i].entity, position: Number(t.value) });
    this._busy = false;
    setTimeout(() => this._render(), 600);
  }
  _onSheetClick(e) {
    if (e.target.matches?.("[data-scrim]")) return this._closeSheet();
    const hx = e.target.closest?.("[data-hx]");
    if (hx && this._sheet?.kind === "hist") return this._histPick(e, hx);
    const b = e.target.closest?.("button");
    if (!b || !this._sheet) return;
    const d = b.dataset,
      s = this._sheet,
      r = this._room(s.room) || {};
    if ("close" in d) return this._closeSheet();
    if (d.more) {
      const id = d.more;
      this._closeSheet();
      return setTimeout(() => this._more(id), 50);
    }
    if (d.alert) return this._doAlert(d.alert);
    if (s.kind === "ppl" && d.pz) {
      this._pz = Math.max(-6, Math.min(4, (this._pz || 0) + Number(d.pz)));
      return this._renderSheet();
    }
    if (s.kind === "cal" && (d.cd || d.cm || "ct" in d)) {
      const C = this._cal;
      if (d.cd) {
        C.sel = d.cd;
        const [y, m] = d.cd.split("-").map(Number);
        C.y = y;
        C.m = m - 1;
      } else if (d.cm) {
        const n = new Date(C.y, C.m + Number(d.cm), 1);
        C.y = n.getFullYear();
        C.m = n.getMonth();
        C.sel = `${C.y}-${p2(C.m + 1)}-01`;
      } else {
        const t = new Date();
        C.y = t.getFullYear();
        C.m = t.getMonth();
        C.sel = `${C.y}-${p2(C.m + 1)}-${p2(t.getDate())}`;
      }
      this._calLoad();
      return this._renderSheet();
    }
    if (d.scn != null) {
      const i = Number(d.scn),
        x = this._cfg.scenes?.[i];
      if (!x) return;
      const [dom, svc] = (x.action || x.service).split(".");
      this._scDone = i;
      clearTimeout(this._scT);
      this._scT = setTimeout(() => {
        this._scDone = null;
        if (this._sheet?.kind === "scenes") this._renderSheet();
      }, 3000);
      this._call(dom, svc, x.data || {});
      return this._renderSheet();
    }
    if (s.kind === "hist" && (d.hc || d.hm || d.hp)) {
      const H = this._hist;
      if (d.hc) H.sel = d.hc;
      if (d.hm) H.mode = d.hm;
      if (d.hp) H.per = d.hp;
      H.hi = null;
      this._histLoad();
      return this._renderSheet();
    }
    if (d.arm) {
      const svc = { disarmed: "alarm_disarm", armed_home: "alarm_arm_home", armed_away: "alarm_arm_away" }[d.arm];
      return svc && this._call("alarm_control_panel", svc, { entity_id: this._cfg.alarm });
    }
    if ("gyes" in d) {
      const gr = this._cfg.rooms.find((x) => x.gate);
      this._closeSheet();
      return gr && this._call("switch", "toggle", { entity_id: gr.gate.switch });
    }
    if (s.kind === "led") {
      const ent = r.lights[s.i].entity;
      if ("pw" in d) return this._call("light", "toggle", { entity_id: ent });
      if (d.lvl) return this._call("light", "turn_on", { entity_id: ent, brightness_pct: Number(d.lvl) });
      if (d.tab) {
        s.tab = d.tab;
        return this._renderSheet();
      }
      if (d.pre) return this._applyPreset(ent, d.pre);
    }
    if (s.kind === "ac") {
      if (d.fan) return this._call("climate", "set_fan_mode", { entity_id: r.climate, fan_mode: d.fan });
      if (d.preset) return this._call("climate", "set_preset_mode", { entity_id: r.climate, preset_mode: d.preset });
      if (d.hv) return this._call("climate", "set_hvac_mode", { entity_id: r.climate, hvac_mode: d.hv });
    }
  }
  _onSheetInput(e) {
    const t = e.target;
    if ("bri" in t.dataset) {
      t.style.setProperty("--p", t.value + "%");
      const el = this._portal.shadowRoot.getElementById("briT");
      if (el) el.textContent = t.value + "%";
    }
    if ("wbri" in t.dataset) {
      t.style.setProperty("--p", t.value + "%");
      const el = this._portal.shadowRoot.getElementById("wbT");
      if (el) el.textContent = t.value + "%";
    }
  }
  _onSheetChange(e) {
    const t = e.target,
      s = this._sheet;
    this._sBusy = false;
    if (s?.kind === "hist" && "hd" in t.dataset) {
      if (t.value) {
        this._hist.date = t.value;
        this._hist.hi = null;
        this._histLoad();
        this._renderSheet();
      }
      return;
    }
    if (!s || s.kind !== "led") return;
    const ent = this._room(s.room).lights[s.i].entity;
    if ("bri" in t.dataset) this._call("light", "turn_on", { entity_id: ent, brightness_pct: Number(t.value) });
    if ("wbri" in t.dataset) {
      const wl = this._whiteLvl(this._room(s.room).lights[s.i]);
      if (wl) this._setWhite(ent, wl.i, Number(t.value));
    }
    if ("hue" in t.dataset) this._call("light", "turn_on", { entity_id: ent, hs_color: [Number(t.value), 100] });
  }
}
if (!customElements.get("casa-tlm-card")) {
  customElements.define("casa-tlm-card", CasaTlmCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "casa-tlm-card",
    name: "Casa (telemóvel)",
    description: "Página inicial do telemóvel: escolhe a divisão e controla-a, sem scroll.",
  });
  console.info(`%c casa-card ${VERSAO} `, "background:#65D8DE;color:#062028;border-radius:4px");
}
