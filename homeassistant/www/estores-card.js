// estores-card v1.1 — estores e automatismos dos estores (tablet), em português
// Lê e escreve os helpers da blueprint CoverAutomatic_v4 (est_esq1..4).
const EST_VERSION = "1.1.0";

const EST_DEFAULT = {
  back: "/dashboard-tablet/novo-tablet",
  all_cover: "cover.allcovers",
  temp_sensor: "sensor.temperatura_exterior",
  esquemas: 4,
  // inc = número do include_estN que corresponde a este estore na blueprint
  covers: [
    { entity: "cover.estore_sala", name: "Sala", inc: 2 },
    { entity: "cover.est_cozinhagra", name: "Cozinha grande", inc: 6 },
    { entity: "cover.est_cozinhapeq", name: "Cozinha pequeno", inc: 5 },
    { entity: "cover.est_suite", name: "Suite", inc: 7 },
    { entity: "cover.est_room2", name: "Diana", inc: 4 },
    { entity: "cover.est_gamingroom", name: "Escritório", inc: 1 },
    { entity: "cover.est_wcsuite", name: "WC Suite", inc: 3 },
    { entity: "cover.est_wcgeral", name: "WC Geral", inc: 8 },
  ],
};

const DIAS = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
const DIA_C = ["S", "T", "Q", "Q", "S", "S", "D"];
const DIA_L = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MODOS = [
  ["Horário", "Horário", "mdi:clock-outline"],
  ["Nascer do Sol", "Nascer do sol", "mdi:weather-sunset-up"],
  ["Pôr do Sol", "Pôr do sol", "mdi:weather-sunset-down"],
  ["Temperatura", "Temperatura", "mdi:thermometer"],
];

const EST_CSS = `
  :host{--bg:#0b1a20;--card:#122b35;--line:rgba(101,216,222,.16);--line2:rgba(255,255,255,.07);
    --fg:#eefaff;--dim:rgba(238,250,255,.64);--mute:rgba(238,250,255,.40);
    --cyan:#65D8DE;--fill:rgba(101,216,222,.30);--sun:#FFB66E;--hot:#FF8A50;--cold:#64B5F6;
    display:block;color:var(--fg);font-family:inherit}
  *{box-sizing:border-box}
  button{font-family:inherit;color:inherit}
  button:focus-visible,[tabindex]:focus-visible,input:focus-visible{outline:2px solid var(--cyan);outline-offset:2px}
  ha-icon{--mdc-icon-size:22px;display:inline-flex}
`;

const MAIN_CSS = `
  .root{container-type:inline-size;padding:4px 2px 8px}
  .top{display:flex;align-items:center;gap:14px;margin-bottom:18px}
  .back{height:46px;padding:0 16px 0 10px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid var(--line);color:var(--dim);font-size:14px;font-weight:500;display:flex;align-items:center;gap:4px;cursor:pointer}
  .back ha-icon{color:CadetBlue}
  .top h2{font-size:22px;font-weight:700;margin:0}
  .top .sub{color:var(--cyan);font-size:13px;margin-top:2px}
  .cols{display:grid;grid-template-columns:1.05fr 1fr;gap:22px;align-items:start}
  @container (max-width:820px){.cols{grid-template-columns:1fr}}
  .sec{display:flex;flex-direction:column;gap:10px;min-width:0}
  .sech{display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding:0 2px}
  .sech b{font-size:16px;font-weight:600}
  .sech span{color:var(--mute);font-size:12px;text-align:right}
  .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .cv{position:relative;height:68px;border-radius:16px;background:var(--card);border:1px solid var(--line);overflow:hidden;cursor:pointer;display:flex;align-items:center;gap:10px;padding:0 14px;user-select:none;-webkit-user-select:none;touch-action:pan-y;-webkit-tap-highlight-color:transparent}
  .cv .fill{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,rgba(101,216,222,.14),var(--fill));border-right:2px solid var(--cyan);transition:width .45s ease;pointer-events:none}
  .cv.drag .fill{transition:none}
  .cv.zero .fill{border-right-color:transparent}
  .cv ha-icon,.cv .nm,.cv .pc{position:relative;pointer-events:none}
  .cv ha-icon{color:var(--cyan)}
  .cv .nm{flex:1;font-weight:600;font-size:15px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cv .pc{font-weight:700;font-size:14px;font-variant-numeric:tabular-nums;padding:5px 10px;border-radius:10px;background:rgba(5,22,31,.7);border:1px solid rgba(101,216,222,.35);white-space:nowrap}
  .cv.mov .pc{color:var(--sun);border-color:rgba(255,182,110,.5)}
  .cv.na{opacity:.45}
  .all{display:grid;grid-template-columns:auto repeat(3,minmax(0,1fr));gap:8px;align-items:center;padding:10px;border-radius:18px;background:rgba(255,255,255,.03);border:1px solid var(--line2)}
  .all .lbl{font-weight:600;font-size:14px;padding:0 6px 0 4px;white-space:nowrap}
  .btn{height:48px;border-radius:13px;border:1px solid var(--line2);background:rgba(255,255,255,.045);font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;-webkit-tap-highlight-color:transparent}
  .btn ha-icon{--mdc-icon-size:19px;color:var(--cyan)}
  .btn:active,.opt:active,.cv:active{transform:scale(.98)}
  .autos{display:flex;flex-direction:column;gap:10px}
  .auto{border-radius:18px;background:var(--card);border:1px solid var(--line);padding:14px 16px;display:flex;flex-direction:column;gap:10px;cursor:pointer;transition:opacity .3s;-webkit-tap-highlight-color:transparent}
  .auto.off{opacity:.55}
  .ah{display:flex;align-items:center;gap:12px}
  .ico{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:rgba(101,216,222,.10);border:1.5px solid var(--line);flex:none}
  .ah .t{flex:1;min-width:0}
  .ah .t b{display:block;font-size:16px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ah .t small{display:block;color:var(--dim);font-size:13.5px;line-height:1.35;margin-top:2px}
  .ah .t small b{display:inline;font-size:inherit;color:var(--fg);font-weight:600}
  .sw{width:56px;height:34px;border-radius:17px;background:rgba(255,255,255,.08);border:1px solid var(--line2);position:relative;flex:none;cursor:pointer;padding:0}
  .sw::after{content:"";position:absolute;top:4px;left:4px;width:24px;height:24px;border-radius:50%;background:#7c8b90;transition:.25s}
  .sw.on{background:rgba(101,216,222,.35);border-color:var(--cyan)}
  .sw.on::after{left:26px;background:var(--fg)}
  .meta{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center}
  .days{display:flex;gap:4px}
  .days i{font-style:normal;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700;color:var(--mute);border:1px solid var(--line2)}
  .days i.on{background:rgba(101,216,222,.18);color:var(--cyan);border-color:rgba(101,216,222,.45)}
  .chips{display:flex;flex-wrap:wrap;gap:4px;min-width:0}
  .chip{font-size:12px;padding:3px 9px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid var(--line2);color:var(--dim)}
  .next{margin-left:auto;font-size:12.5px;color:var(--sun);font-weight:600;white-space:nowrap}
  .auto.off .next{color:var(--mute)}
  @container (max-width:520px){
    .top{margin-bottom:12px}.top h2{font-size:20px}.back{height:42px;padding:0 12px 0 6px}
    .cols{gap:18px}.grid{gap:8px}
    .cv{height:60px;padding:0 10px;gap:8px;border-radius:14px}
    .cv ha-icon{display:none}
    .cv .nm{font-size:14px;white-space:normal;line-height:1.15;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
    .cv .pc{font-size:12.5px;padding:3px 7px}
    .all{grid-template-columns:repeat(3,minmax(0,1fr));padding:8px}.all .lbl{display:none}
    .btn{height:46px;font-size:13.5px}
    .auto{padding:12px 14px}.ico{width:40px;height:40px}
    .sech span{display:none}
  }
`;

const ED_CSS = `
  .scrim{position:fixed;inset:0;z-index:9999;background:rgba(2,8,11,.62);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px}
  .ed{width:min(640px,100%);max-height:calc(100% - 8px);overflow:auto;border-radius:22px;background:linear-gradient(315deg,rgba(38,72,85,.97),rgba(15,32,45,.99));border:1px solid var(--line);padding:18px;display:flex;flex-direction:column;gap:16px;box-shadow:0 20px 50px rgba(0,0,0,.55);color:var(--fg)}
  .edh{display:flex;align-items:center;gap:10px}
  .edh input{flex:1;min-width:0;background:transparent;border:none;border-bottom:1px dashed var(--line);color:var(--fg);font-family:inherit;font-size:20px;font-weight:600;padding:4px 0}
  .x{width:44px;height:44px;border-radius:12px;border:1px solid var(--line2);background:rgba(255,255,255,.05);cursor:pointer;display:grid;place-items:center}
  .sum{padding:12px 14px;border-radius:14px;background:rgba(5,22,31,.55);border:1px solid rgba(101,216,222,.3);font-size:15px;line-height:1.45}
  .sum b{color:var(--cyan);font-weight:600}
  .step{display:flex;flex-direction:column;gap:8px}
  .step>label{font-size:11.5px;text-transform:uppercase;letter-spacing:.09em;color:var(--mute);font-weight:700}
  .seg{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
  @media (max-width:540px){.seg{grid-template-columns:repeat(2,minmax(0,1fr))}}
  .opt{min-height:48px;border-radius:13px;border:1px solid var(--line2);background:rgba(255,255,255,.04);color:var(--dim);font-size:13.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;padding:4px 8px;-webkit-tap-highlight-color:transparent}
  .opt ha-icon{--mdc-icon-size:18px}
  .opt.on{background:rgba(101,216,222,.2);border-color:var(--cyan);color:var(--fg)}
  .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
  .stepper{display:flex;align-items:center;gap:6px}
  .stepper button{min-width:46px;height:46px;border-radius:12px;border:1px solid var(--line2);background:rgba(255,255,255,.05);font-size:15px;font-weight:600;cursor:pointer;padding:0 10px}
  .stepper output{min-width:130px;text-align:center;font-size:17px;font-weight:700;font-variant-numeric:tabular-nums}
  .tnow{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:14px;background:rgba(5,22,31,.45);border:1px solid var(--line2)}
  .tnow .v{font-size:26px;font-weight:700;font-variant-numeric:tabular-nums}
  .tnow small{color:var(--dim);font-size:13px;line-height:1.35}
  .tnow .st{margin-left:auto;font-size:12.5px;font-weight:600;padding:5px 10px;border-radius:999px;white-space:nowrap}
  .st.yes{color:#062028;background:var(--sun)}
  .st.no{color:var(--dim);border:1px solid var(--line2)}
  .fired{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--dim)}
  .quick{font-size:13px;padding:8px 12px;border-radius:999px;border:1px solid var(--line2);background:transparent;color:var(--cyan);cursor:pointer;font-weight:600}
  .daypick{display:flex;gap:6px;flex-wrap:wrap}
  .daypick button{width:46px;height:46px;border-radius:50%;border:1px solid var(--line2);background:rgba(255,255,255,.04);color:var(--mute);font-size:13px;font-weight:700;cursor:pointer}
  .daypick button.on{background:rgba(101,216,222,.2);border-color:var(--cyan);color:var(--fg)}
  .covers{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
  @media (max-width:540px){.covers{grid-template-columns:repeat(2,minmax(0,1fr))}}
  .covers button{min-height:44px;border-radius:12px;border:1px solid var(--line2);background:rgba(255,255,255,.04);color:var(--dim);font-size:13px;font-weight:600;cursor:pointer;padding:4px 6px}
  .covers button.on{background:rgba(101,216,222,.2);border-color:var(--cyan);color:var(--fg)}
  .posv{display:flex;align-items:center;gap:10px}
  .posv output{font-size:22px;font-weight:700;min-width:96px;font-variant-numeric:tabular-nums}
  .posv small{color:var(--dim);font-size:13px}
  input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:44px;background:transparent;margin:0}
  input[type=range]::-webkit-slider-runnable-track{height:12px;border-radius:6px;background:linear-gradient(90deg,var(--cyan) var(--p),rgba(255,255,255,.08) var(--p))}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:30px;height:30px;border-radius:50%;background:var(--fg);border:3px solid var(--cyan);margin-top:-9px;box-shadow:0 2px 8px rgba(0,0,0,.4)}
  input[type=range]::-moz-range-track{height:12px;border-radius:6px;background:rgba(255,255,255,.08)}
  input[type=range]::-moz-range-progress{height:12px;border-radius:6px;background:var(--cyan)}
  input[type=range]::-moz-range-thumb{width:26px;height:26px;border-radius:50%;background:var(--fg);border:3px solid var(--cyan)}
  .ends{display:flex;justify-content:space-between;color:var(--mute);font-size:12px;margin-top:-6px}
  .body{display:flex;flex-direction:column;gap:16px}
  .col{display:flex;flex-direction:column;gap:16px;min-width:0}
  @media (min-width:900px){.ed{width:min(980px,100%)}.body{display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:start}}
  .edf{display:flex;justify-content:space-between;align-items:center;gap:8px}
  .edf small{color:var(--mute);font-size:12px}
  .ok{height:48px;padding:0 24px;border-radius:13px;border:none;background:var(--cyan);color:#062028;font-size:15px;font-weight:700;cursor:pointer}
  @media (max-width:540px){
    .scrim{padding:8px}.ed{padding:14px;gap:14px;border-radius:18px}
    .stepper{width:100%}.stepper output{min-width:0;flex:1;font-size:16px}.stepper button{min-width:40px;padding:0 6px}
    .daypick{gap:4px;flex-wrap:nowrap}.daypick button{width:auto;flex:1;height:42px;font-size:12px;border-radius:12px}
    .tnow{flex-wrap:wrap;gap:8px 12px}.tnow .v{font-size:22px}.tnow .st{margin-left:0;white-space:normal}
    .edf small{display:none}.ok{flex:1}
  }
`;

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function hhmm(d) {
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}
function num(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
function fmtNum(n, dec = 1) {
  return Number(n).toLocaleString("pt-PT", { minimumFractionDigits: 0, maximumFractionDigits: dec });
}

class EstoresCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._sig = "";
    this._drag = null;
    this._busy = false;
    this._edit = null; // índice do esquema em edição
    this._portal = null;
    this.shadowRoot.addEventListener("click", (e) => this._onClick(e));
    this.shadowRoot.addEventListener("pointerdown", (e) => this._onDown(e));
    this.shadowRoot.addEventListener("pointermove", (e) => this._onMove(e));
    this.shadowRoot.addEventListener("pointerup", (e) => this._onUp(e));
    this.shadowRoot.addEventListener("pointercancel", () => this._cancelDrag());
    this.shadowRoot.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.matches?.("[data-kb]")) {
        e.preventDefault();
        e.target.click();
      }
    });
  }

  setConfig(config) {
    this._cfg = { ...EST_DEFAULT, ...(config || {}) };
    this._ids = null;
  }

  static getStubConfig() {
    return {};
  }
  getCardSize() {
    return 10;
  }
  getGridOptions() {
    return { columns: "full", rows: "auto" };
  }

  connectedCallback() {
    this._timer = setInterval(() => this._render(), 60000);
  }
  disconnectedCallback() {
    clearInterval(this._timer);
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
  _p(i) {
    return `est_esq${i}`;
  }
  _watch() {
    if (this._ids) return this._ids;
    const c = this._cfg;
    const ids = [c.all_cover, c.temp_sensor, "sun.sun", ...c.covers.map((x) => x.entity)];
    for (let i = 1; i <= c.esquemas; i++) {
      const p = this._p(i);
      ids.push(`input_boolean.${p}_enable`, `input_text.${p}_nome`, `input_select.${p}_trigger`, `input_number.${p}_posicao`,
        `input_number.${p}_offset`, `input_datetime.${p}_activation_time`, `input_number.${p}_temp_threshold`,
        `input_select.${p}_temp_condition`, `input_boolean.${p}_temp_fired`);
      DIAS.forEach((d) => ids.push(`input_boolean.${p}_ativa_${d}`));
      for (let k = 1; k <= 8; k++) ids.push(`input_boolean.${p}_include_est${k}`);
    }
    this._ids = ids;
    return ids;
  }
  _signature() {
    const s = this._hass?.states || {};
    return this._watch().map((id) => {
      const o = s[id];
      return o ? o.state + "|" + (o.attributes.current_position ?? "") : "-";
    }).join(";");
  }
  _st(id) {
    return this._hass?.states?.[id];
  }
  _esq(i) {
    const p = this._p(i), S = (id) => this._st(id)?.state;
    const t = (S(`input_datetime.${p}_activation_time`) || "00:00:00").slice(0, 5);
    return {
      i,
      on: S(`input_boolean.${p}_enable`) === "on",
      nome: S(`input_text.${p}_nome`) || `Cenário ${i}`,
      modo: S(`input_select.${p}_trigger`) || "Horário",
      pos: num(S(`input_number.${p}_posicao`)),
      off: num(S(`input_number.${p}_offset`)),
      hora: t,
      temp: num(S(`input_number.${p}_temp_threshold`)),
      cond: S(`input_select.${p}_temp_condition`) || "acima",
      fired: S(`input_boolean.${p}_temp_fired`) === "on",
      dias: DIAS.map((d) => S(`input_boolean.${p}_ativa_${d}`) === "on"),
      inc: this._cfg.covers.map((c) => S(`input_boolean.${p}_include_est${c.inc}`) === "on"),
    };
  }
  _tempNow() {
    const o = this._st(this._cfg.temp_sensor);
    const v = Number(o?.state);
    return Number.isFinite(v) ? v : null;
  }

  // ---------- textos ----------
  _acao(p) {
    return p <= 0 ? "Fecha" : p >= 100 ? "Abre" : `Põe a ${p}%`;
  }
  _quando(a) {
    if (a.modo === "Horário") return `às <b>${a.hora}</b>`;
    if (a.modo === "Temperatura") return `quando a temperatura exterior ficar <b>${a.cond} de ${fmtNum(a.temp)} °C</b>`;
    const sol = a.modo === "Pôr do Sol" ? "pôr do sol" : "nascer do sol";
    if (!a.off) return `<b>ao ${sol}</b>`;
    return `<b>${Math.abs(a.off)} min ${a.off > 0 ? "depois" : "antes"} do ${sol}</b>`;
  }
  _frase(a) {
    return `${this._acao(a.pos)} ${this._quando(a)}`;
  }
  _diasTxt(d) {
    const n = d.filter(Boolean).length;
    if (n === 7) return "todos os dias";
    if (n === 0) return "nenhum dia";
    if (d.slice(0, 5).every(Boolean) && !d[5] && !d[6]) return "dias úteis";
    if (n === 2 && d[5] && d[6]) return "fim de semana";
    return d.map((v, k) => (v ? DIA_L[k] : null)).filter(Boolean).join(", ");
  }
  _estList(inc) {
    const n = inc.filter(Boolean).length;
    if (n === inc.length) return ["Todos"];
    if (n === 0) return ["Nenhum estore"];
    return this._cfg.covers.filter((c, k) => inc[k]).map((c) => c.name);
  }
  _proxima(a) {
    if (!a.on) return "Desligado";
    if (!a.dias.some(Boolean)) return "Sem dias escolhidos";
    if (a.modo === "Temperatura") return a.fired ? "Já atuou hoje" : "Quando a temperatura chegar";
    const now = new Date();
    let t;
    if (a.modo === "Horário") {
      const [h, m] = a.hora.split(":").map(Number);
      t = new Date(now);
      t.setHours(h, m, 0, 0);
      if (t <= now) t.setDate(t.getDate() + 1);
    } else {
      const sun = this._st("sun.sun")?.attributes || {};
      const base = a.modo === "Pôr do Sol" ? sun.next_setting : sun.next_rising;
      if (!base) return "—";
      t = new Date(new Date(base).getTime() + a.off * 60000);
      if (t <= now) t.setDate(t.getDate() + 1);
    }
    for (let k = 0; k < 8; k++) {
      const idx = (t.getDay() + 6) % 7;
      if (a.dias[idx]) break;
      t.setDate(t.getDate() + 1);
    }
    const d0 = new Date(now); d0.setHours(0, 0, 0, 0);
    const d1 = new Date(t); d1.setHours(0, 0, 0, 0);
    const diff = Math.round((d1 - d0) / 86400000);
    const dia = diff === 0 ? "hoje" : diff === 1 ? "amanhã" : DIA_L[(t.getDay() + 6) % 7];
    return `Próxima: ${dia} · ${hhmm(t)}`;
  }
  _modoIcon(m) {
    const r = MODOS.find((x) => x[0] === m);
    const col = m === "Temperatura" ? "var(--hot)" : m === "Horário" ? "var(--cyan)" : "var(--sun)";
    return `<ha-icon icon="${r ? r[2] : "mdi:window-shutter-auto"}" style="color:${col}"></ha-icon>`;
  }

  // ---------- desenho ----------
  _render(force) {
    if (!this._hass || !this._cfg) return;
    if (this._drag || this._busy) return;
    const c = this._cfg;
    const esqs = [];
    for (let i = 1; i <= c.esquemas; i++) esqs.push(this._esq(i));
    const ligados = esqs.filter((a) => a.on).length;
    const covers = c.covers.map((cv, k) => {
      const o = this._st(cv.entity);
      const na = !o || o.state === "unavailable";
      const p = Math.round(num(o?.attributes?.current_position, o?.state === "open" ? 100 : 0));
      const mov = o && (o.state === "opening" || o.state === "closing");
      const txt = na ? "Indisponível" : mov ? (o.state === "opening" ? "A abrir" : "A fechar") : p === 0 ? "Fechado" : p === 100 ? "Aberto" : p + "%";
      return `<div class="cv${p === 0 ? " zero" : ""}${mov ? " mov" : ""}${na ? " na" : ""}" data-cv="${k}" tabindex="0" role="button" data-kb aria-label="${esc(cv.name)}, ${txt}">
        <div class="fill" style="width:${p}%"></div><ha-icon icon="${p > 0 ? "mdi:window-shutter-open" : "mdi:window-shutter"}"></ha-icon>
        <span class="nm">${esc(cv.name)}</span><span class="pc">${txt}</span></div>`;
    }).join("");
    const autos = esqs.map((a) => `
      <div class="auto${a.on ? "" : " off"}" data-edit="${a.i}" tabindex="0" role="button" data-kb>
        <div class="ah"><div class="ico">${this._modoIcon(a.modo)}</div>
          <div class="t"><b>${esc(a.nome)}</b><small>${this._frase(a)}</small></div>
          <button class="sw${a.on ? " on" : ""}" data-sw="${a.i}" role="switch" aria-checked="${a.on}" aria-label="Ligar ${esc(a.nome)}"></button></div>
        <div class="meta"><div class="days">${a.dias.map((v, k) => `<i class="${v ? "on" : ""}" title="${DIA_L[k]}">${DIA_C[k]}</i>`).join("")}</div>
          <div class="chips">${this._estList(a.inc).map((n) => `<span class="chip">${esc(n)}</span>`).join("")}</div>
          <span class="next">${this._proxima(a)}</span></div>
      </div>`).join("");
    this.shadowRoot.innerHTML = `<style>${EST_CSS}${MAIN_CSS}</style>
      <div class="root">
        <div class="top"><button class="back" data-back><ha-icon icon="mdi:chevron-left"></ha-icon>Casa</button>
          <div><h2>Estores</h2><div class="sub">${ligados} de ${esqs.length} automatismos ligados</div></div></div>
        <div class="cols">
          <div class="sec">
            <div class="sech"><b>Agora</b><span>toque abre/fecha · arrastar ajusta</span></div>
            <div class="grid">${covers}</div>
            <div class="all"><span class="lbl">Todos</span>
              <button class="btn" data-all="open_cover"><ha-icon icon="mdi:arrow-up"></ha-icon>Abrir</button>
              <button class="btn" data-all="stop_cover"><ha-icon icon="mdi:pause"></ha-icon>Parar</button>
              <button class="btn" data-all="close_cover"><ha-icon icon="mdi:arrow-down"></ha-icon>Fechar</button></div>
          </div>
          <div class="sec">
            <div class="sech"><b>Automatismos</b><span>toca no cartão para editar</span></div>
            <div class="autos">${autos}</div>
          </div>
        </div>
      </div>`;
    if (this._edit) this._renderEd();
  }

  _renderEd() {
    if (!this._portal) {
      this._portal = document.createElement("div");
      this._portal.attachShadow({ mode: "open" });
      const sr = this._portal.shadowRoot;
      sr.addEventListener("click", (e) => this._onEdClick(e));
      sr.addEventListener("input", (e) => this._onEdInput(e));
      sr.addEventListener("change", (e) => this._onEdChange(e));
      sr.addEventListener("pointerdown", (e) => { if (e.target.matches?.("input[type=range]")) this._busy = true; });
      sr.addEventListener("pointerup", () => this._endRange());
      sr.addEventListener("pointercancel", () => this._endRange());
      sr.addEventListener("focusin", (e) => { if (e.target.matches?.("input[type=text]")) this._busy = true; });
      sr.addEventListener("focusout", (e) => { if (e.target.matches?.("input[type=text]")) { this._busy = false; this._saveName(e.target); } });
      sr.addEventListener("keydown", (e) => {
        if (e.key === "Escape") this._closeEd();
        if (e.key === "Enter" && e.target.matches?.("input[type=text]")) e.target.blur();
      });
      document.body.appendChild(this._portal);
    }
    const prev = this._portal.shadowRoot.querySelector(".ed");
    const scroll = prev ? prev.scrollTop : 0;
    const a = this._esq(this._edit);
    const tnow = this._tempNow();
    const est = this._estList(a.inc);
    const estTxt = est[0] === "Todos" ? "em <b>todos os estores</b>" : est[0] === "Nenhum estore" ? "<b>sem estores escolhidos</b>" : `em <b>${est.map(esc).join(", ")}</b>`;
    let campo = "";
    if (a.modo === "Horário") {
      campo = `<div class="stepper"><button data-h="-60">−1 h</button><button data-h="-5">−5</button><output>${a.hora}</output><button data-h="5">+5</button><button data-h="60">+1 h</button></div>`;
    } else if (a.modo === "Temperatura") {
      const cumpre = tnow != null && (a.cond === "acima" ? tnow > a.temp : tnow < a.temp);
      campo = `<div class="row"><button class="opt${a.cond === "acima" ? " on" : ""}" data-cond="acima">Acima de</button><button class="opt${a.cond === "abaixo" ? " on" : ""}" data-cond="abaixo">Abaixo de</button>
          <div class="stepper"><button data-t="-1">−1</button><button data-t="-0.5">−½</button><output>${fmtNum(a.temp)} °C</output><button data-t="0.5">+½</button><button data-t="1">+1</button></div></div>
        <div class="tnow"><ha-icon icon="mdi:thermometer" style="color:var(--hot)"></ha-icon>
          <div><div class="v">${tnow == null ? "—" : fmtNum(tnow) + " °C"}</div><small>Temperatura exterior agora</small></div>
          <span class="st ${cumpre ? "yes" : "no"}">${tnow == null ? "Sem leitura" : cumpre ? "Condição cumprida" : `Ainda não está ${a.cond} de ${fmtNum(a.temp)} °C`}</span></div>
        <div class="fired">${a.fired ? "Já atuou hoje (só atua uma vez por dia)." : "Ainda não atuou hoje."}${a.fired ? ` <button class="quick" data-rearm>Rearmar</button>` : ""}</div>`;
    } else {
      const txt = a.off === 0 ? "na hora" : `${Math.abs(a.off)} min ${a.off > 0 ? "depois" : "antes"}`;
      campo = `<div class="stepper"><button data-o="-15">−15</button><button data-o="-5">−5</button><output>${txt}</output><button data-o="5">+5</button><button data-o="15">+15</button></div>`;
    }
    const p = Math.round(a.pos);
    const pl = p === 0 ? "fechado" : p === 100 ? "aberto" : "aberto a " + p + "%";
    this._portal.shadowRoot.innerHTML = `<style>${EST_CSS}${ED_CSS}</style>
      <div class="scrim" data-scrim><div class="ed" role="dialog" aria-label="Editar automatismo">
        <div class="edh"><ha-icon icon="mdi:pencil" style="color:var(--mute);--mdc-icon-size:18px"></ha-icon>
          <input type="text" id="est-nome-${a.i}" value="${esc(a.nome)}" maxlength="40" aria-label="Nome do automatismo">
          <button class="x" data-close aria-label="Fechar"><ha-icon icon="mdi:close"></ha-icon></button></div>
        <div class="sum">${this._frase(a)}, <b>${this._diasTxt(a.dias)}</b>, ${estTxt}.</div>
        <div class="body"><div class="col">
        <div class="step"><label>1 · Quando</label>
          <div class="seg">${MODOS.map(([v, l, ic]) => `<button class="opt${a.modo === v ? " on" : ""}" data-modo="${esc(v)}"><ha-icon icon="${ic}"></ha-icon>${l}</button>`).join("")}</div>
          ${campo}</div>
        <div class="step"><label>2 · Dias</label>
          <div class="daypick">${a.dias.map((v, k) => `<button class="${v ? "on" : ""}" data-dia="${k}" aria-pressed="${v}">${DIA_L[k]}</button>`).join("")}</div>
          <div class="row"><button class="quick" data-qd="uteis">Dias úteis</button><button class="quick" data-qd="fds">Fim de semana</button><button class="quick" data-qd="todos">Todos</button></div></div>
        </div><div class="col">
        <div class="step"><label>3 · Estores</label>
          <div class="covers">${this._cfg.covers.map((c, k) => `<button class="${a.inc[k] ? "on" : ""}" data-inc="${k}" aria-pressed="${a.inc[k]}">${esc(c.name)}</button>`).join("")}</div>
          <div class="row"><button class="quick" data-qi="1">Todos</button><button class="quick" data-qi="0">Nenhum</button></div></div>
        <div class="step"><label>4 · Posição</label>
          <div class="posv"><output id="est-posv">${p}%</output><small id="est-posl">${pl}</small></div>
          <input type="range" id="est-pos-${a.i}" min="0" max="100" step="5" value="${p}" style="--p:${p}%" aria-label="Posição">
          <div class="ends"><span>Fechado</span><span>Aberto</span></div>
          <div class="row"><button class="quick" data-pq="0">0%</button><button class="quick" data-pq="25">25%</button><button class="quick" data-pq="50">50%</button><button class="quick" data-pq="75">75%</button><button class="quick" data-pq="100">100%</button></div></div>
        </div></div>
        <div class="edf"><small>As alterações ficam guardadas logo.</small><button class="ok" data-close>Concluído</button></div>
      </div></div>`;
    const ed = this._portal.shadowRoot.querySelector(".ed");
    if (ed) ed.scrollTop = scroll;
  }

  _closeEd() {
    this._edit = null;
    this._busy = false;
    if (this._portal) {
      this._portal.remove();
      this._portal = null;
    }
  }
  _endRange() {
    if (this._busy && !this._portal?.shadowRoot?.activeElement?.matches?.("input[type=text]")) {
      this._busy = false;
      setTimeout(() => this._render(), 300);
    }
  }

  // ---------- ações ----------
  _call(domain, service, data) {
    return this._hass.callService(domain, service, data);
  }
  _bool(id, on) {
    return this._call("input_boolean", on ? "turn_on" : "turn_off", { entity_id: id });
  }
  _setNum(id, v) {
    const o = this._st(id);
    const min = num(o?.attributes?.min, -1e9), max = num(o?.attributes?.max, 1e9);
    return this._call("input_number", "set_value", { entity_id: id, value: Math.min(max, Math.max(min, v)) });
  }

  _onClick(e) {
    const t = e.target.closest?.("[data-back],[data-all],[data-sw],[data-edit],[data-cv]");
    if (!t) return;
    if (t.hasAttribute("data-back")) {
      history.pushState(null, "", this._cfg.back);
      window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
    } else if (t.dataset.all) {
      this._call("cover", t.dataset.all, { entity_id: this._cfg.all_cover });
    } else if (t.dataset.sw) {
      e.stopPropagation();
      const i = Number(t.dataset.sw);
      this._bool(`input_boolean.${this._p(i)}_enable`, !this._esq(i).on);
    } else if (t.dataset.edit) {
      this._edit = Number(t.dataset.edit);
      this._renderEd();
    } else if (t.dataset.cv && e.detail === 0) {
      // teclado (Enter/Espaço): abre ou fecha
      this._toggleCover(Number(t.dataset.cv));
    }
  }
  _toggleCover(k) {
    const ent = this._cfg.covers[k].entity, o = this._st(ent);
    if (!o) return;
    if (o.state === "opening" || o.state === "closing") return this._call("cover", "stop_cover", { entity_id: ent });
    const p = num(o.attributes.current_position, o.state === "open" ? 100 : 0);
    this._call("cover", p > 0 ? "close_cover" : "open_cover", { entity_id: ent });
  }
  _onDown(e) {
    const el = e.target.closest?.(".cv");
    if (!el || e.button > 0) return;
    this._drag = { el, k: Number(el.dataset.cv), x0: e.clientX, y0: e.clientY, moved: false, p: null, id: e.pointerId };
  }
  _onMove(e) {
    const d = this._drag;
    if (!d) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (!d.moved) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) return this._cancelDrag(); // está a fazer scroll
      if (Math.abs(dx) < 10) return;
      d.moved = true;
      d.el.classList.add("drag");
      try { d.el.setPointerCapture(d.id); } catch (_) {}
    }
    const r = d.el.getBoundingClientRect();
    d.p = Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)) / 5) * 5;
    d.el.querySelector(".fill").style.width = d.p + "%";
    d.el.querySelector(".pc").textContent = d.p === 0 ? "Fechado" : d.p === 100 ? "Aberto" : d.p + "%";
    d.el.classList.toggle("zero", d.p === 0);
  }
  _onUp(e) {
    const d = this._drag;
    if (!d) return;
    this._drag = null;
    const ent = this._cfg.covers[d.k].entity;
    if (d.moved && d.p != null) this._call("cover", "set_cover_position", { entity_id: ent, position: d.p });
    else this._toggleCover(d.k);
    setTimeout(() => this._render(), 400);
  }
  _cancelDrag() {
    if (this._drag) {
      this._drag = null;
      this._render();
    }
  }

  _saveName(inp) {
    const i = this._edit;
    if (!i) return;
    const v = inp.value.trim();
    if (v && v !== this._esq(i).nome) this._call("input_text", "set_value", { entity_id: `input_text.${this._p(i)}_nome`, value: v });
  }
  _onEdInput(e) {
    if (e.target.type === "range") {
      const v = Number(e.target.value);
      e.target.style.setProperty("--p", v + "%");
      const sr = this._portal.shadowRoot;
      sr.getElementById("est-posv").textContent = v + "%";
      sr.getElementById("est-posl").textContent = v === 0 ? "fechado" : v === 100 ? "aberto" : "aberto a " + v + "%";
    }
  }
  _onEdChange(e) {
    if (e.target.type === "range" && this._edit) {
      this._setNum(`input_number.${this._p(this._edit)}_posicao`, Number(e.target.value));
      this._busy = false;
    }
  }
  _onEdClick(e) {
    const i = this._edit;
    if (!i) return;
    if (e.target.matches?.("[data-scrim]")) return this._closeEd();
    const t = e.target.closest?.("button");
    if (!t) return;
    const p = this._p(i), a = this._esq(i), ds = t.dataset;
    if ("close" in ds) {
      const inp = this._portal.shadowRoot.querySelector("input[type=text]");
      if (inp) this._saveName(inp);
      return this._closeEd();
    }
    if (ds.modo) this._call("input_select", "select_option", { entity_id: `input_select.${p}_trigger`, option: ds.modo });
    else if (ds.h) {
      const [h, m] = a.hora.split(":").map(Number);
      const x = (((h * 60 + m + Number(ds.h)) % 1440) + 1440) % 1440;
      this._call("input_datetime", "set_datetime", { entity_id: `input_datetime.${p}_activation_time`, time: `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}:00` });
    } else if (ds.o) this._setNum(`input_number.${p}_offset`, a.off + Number(ds.o));
    else if (ds.t) this._setNum(`input_number.${p}_temp_threshold`, a.temp + Number(ds.t));
    else if (ds.cond) this._call("input_select", "select_option", { entity_id: `input_select.${p}_temp_condition`, option: ds.cond });
    else if ("rearm" in ds) this._call("input_button", "press", { entity_id: `input_button.estores_cenario_${i}_rearmar_temperatura` });
    else if (ds.dia != null) {
      const k = Number(ds.dia);
      this._bool(`input_boolean.${p}_ativa_${DIAS[k]}`, !a.dias[k]);
    } else if (ds.qd) {
      const want = ds.qd === "uteis" ? [1, 1, 1, 1, 1, 0, 0] : ds.qd === "fds" ? [0, 0, 0, 0, 0, 1, 1] : [1, 1, 1, 1, 1, 1, 1];
      const on = DIAS.filter((d, k) => want[k]).map((d) => `input_boolean.${p}_ativa_${d}`);
      const off = DIAS.filter((d, k) => !want[k]).map((d) => `input_boolean.${p}_ativa_${d}`);
      if (on.length) this._call("input_boolean", "turn_on", { entity_id: on });
      if (off.length) this._call("input_boolean", "turn_off", { entity_id: off });
    } else if (ds.inc != null) {
      const k = Number(ds.inc);
      this._bool(`input_boolean.${p}_include_est${this._cfg.covers[k].inc}`, !a.inc[k]);
    } else if (ds.qi != null) {
      this._call("input_boolean", ds.qi === "1" ? "turn_on" : "turn_off", { entity_id: this._cfg.covers.map((c) => `input_boolean.${p}_include_est${c.inc}`) });
    } else if (ds.pq != null) this._setNum(`input_number.${p}_posicao`, Number(ds.pq));
  }
}

if (!customElements.get("estores-card")) {
  customElements.define("estores-card", EstoresCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "estores-card", name: "Estores (tablet)", description: "Estores e automatismos dos estores, em português." });
  console.info(`%c estores-card ${EST_VERSION} `, "background:#65D8DE;color:#062028;border-radius:4px");
}
