// energia-insights-card v1.0 — conclusões de energia a partir das estatísticas de longo prazo do HA
const EIC_VERSION = "1.0.0";
const C = {
  blue: "#64A0FF", green: "#4ADE80", red: "#F87171", amber: "#FBBF24",
  muted: "rgba(255,255,255,0.58)", faint: "rgba(255,255,255,0.10)",
};
const PALETTE = ["#64A0FF", "#65D8DE", "#A78BFA", "#FBBF24", "#F472B6", "#4ADE80", "#FB923C", "#C8F560", "#60A5FA", "#F87171", "#2DD4BF", "#E879F9", "#FCD34D", "#93C5FD", "#86EFAC", "#FDA4AF"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const eur = (v, d = 2) => (isFinite(v) ? v : 0).toLocaleString("pt-PT", { minimumFractionDigits: d, maximumFractionDigits: d }) + " €";
const num = (v, d = 1) => (isFinite(v) ? v : 0).toLocaleString("pt-PT", { minimumFractionDigits: d, maximumFractionDigits: d });
const kwh = (v) => num(v, v < 10 ? 2 : 1) + " kWh";
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfWeek = (d = new Date()) => { const s = startOfDay(d); const wd = (s.getDay() + 6) % 7; s.setDate(s.getDate() - wd); return s; };
const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const daysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

const PERIODOS = {
  hoje: { label: "Hoje", range: () => [startOfDay(), new Date()], period: "5minute" },
  semana: { label: "Semana", range: () => [startOfWeek(), new Date()], period: "day" },
  mes: { label: "Mês", range: () => [startOfMonth(), new Date()], period: "day" },
  mes_passado: { label: "Mês passado", range: () => [addMonths(startOfMonth(), -1), startOfMonth()], period: "day" },
  ano: { label: "Ano", range: () => [new Date(new Date().getFullYear(), 0, 1), new Date()], period: "month" },
};

// cache partilhada entre cartões (evita pedidos repetidos)
const CACHE = new Map();
const TTL = 5 * 60 * 1000;

class EnergiaInsightsCard extends HTMLElement {
  setConfig(config) {
    if (!config || !config.mode) throw new Error("Define 'mode': resumo | ranking | maquinas | perfil | tendencia");
    this._config = Object.assign({
      total: "sensor.geral_energy",
      power: "sensor.geral_power",
      price_entity: "input_number.preco_energia",
      periodo: "mes",
      show_unidentified: true,
    }, config);
    this._periodo = this._config.periodo;
    this._open = null;
    this._filtro = "todos";
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._loaded = 0;
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first || Date.now() - this._loaded > TTL) { this._load(); return; }
    if (this._config.mode === "maquinas") {
      // só volta a desenhar quando muda um helper/sensor das máquinas
      const sig = (this._config.machines || []).flatMap((m) => [m.ultimo, m.ciclos, m.kwh_ciclos, m.em_ciclo, m.power])
        .map((e) => hass.states[e]?.state).join("|");
      if (sig !== this._sig) { this._sig = sig; this._render(); }
    }
  }

  getCardSize() { return 4; }
  getGridOptions() { return { columns: 12, rows: "auto" }; }

  get price() {
    const s = this._hass?.states[this._config.price_entity];
    const v = parseFloat(s?.state);
    return isFinite(v) ? v : 0;
  }

  async _stats(ids, start, end, period, types = ["change"]) {
    const key = JSON.stringify([ids.slice().sort(), +start - (+start % 60000), Math.floor(+end / TTL), period, types]);
    const hit = CACHE.get(key);
    if (hit && Date.now() - hit.t < TTL) return hit.p;
    const p = this._hass.callWS({
      type: "recorder/statistics_during_period",
      start_time: start.toISOString(), end_time: end.toISOString(),
      statistic_ids: ids, period, types,
      units: { energy: "kWh" },
    }).catch((e) => { CACHE.delete(key); throw e; });
    CACHE.set(key, { t: Date.now(), p });
    return p;
  }

  static sum(map, id) { return (map[id] || []).reduce((a, r) => a + (r.change || 0), 0); }

  _devValue(dev, map) {
    let v = EnergiaInsightsCard.sum(map, dev.stat);
    (dev.subtract || []).forEach((s) => (v -= EnergiaInsightsCard.sum(map, s)));
    return Math.max(0, v);
  }

  _allIds() {
    const ids = new Set([this._config.total]);
    (this._config.devices || []).forEach((d) => { ids.add(d.stat); (d.subtract || []).forEach((s) => ids.add(s)); });
    return [...ids];
  }

  async _load() {
    this._loaded = Date.now();
    try {
      const m = this._config.mode;
      if (m === "resumo") await this._loadResumo();
      else if (m === "ranking") await this._loadRanking();
      else if (m === "maquinas") await this._loadMaquinas();
      else if (m === "perfil") await this._loadPerfil();
      else if (m === "tendencia") await this._loadTendencia();
      this._err = null;
    } catch (e) {
      this._err = e?.message || String(e);
    }
    this._render();
  }

  // ---------- RESUMO ----------
  async _loadResumo() {
    const T = this._config.total, now = new Date(), som = startOfMonth(now), pm = addMonths(som, -1);
    const elapsed = now - som;
    const pmSameEnd = new Date(Math.min(+pm + elapsed, +som));
    const d7 = new Date(+startOfDay(now) - 7 * 864e5);
    const [mes, mpSame, mpFull, ult7, hoje, base] = await Promise.all([
      this._stats([T], som, now, "day"),
      this._stats([T], pm, pmSameEnd, "hour"),
      this._stats([T], pm, som, "day"),
      this._stats([T], d7, startOfDay(now), "day"),
      this._stats([T], startOfDay(now), now, "5minute"),
      this._stats([this._config.power], d7, now, "hour", ["mean"]),
    ]);
    const S = EnergiaInsightsCard.sum;
    const mesK = S(mes, T), avg7 = S(ult7, T) / 7;
    const restDias = daysInMonth(now) - (elapsed / 864e5);
    const means = (base[this._config.power] || []).map((r) => r.mean).filter((v) => isFinite(v)).sort((a, b) => a - b);
    const baseW = means.length ? means[Math.floor(means.length * 0.1)] : NaN;
    this._data = { mesK, mpSameK: S(mpSame, T), mpFullK: S(mpFull, T), hojeK: S(hoje, T), prevK: mesK + avg7 * restDias, avg7, baseW };
  }

  _renderResumo() {
    const d = this._data, p = this.price;
    const delta = d.mpSameK > 0 ? (d.mesK / d.mpSameK - 1) * 100 : NaN;
    const up = delta > 0;
    const dCol = !isFinite(delta) ? C.muted : up ? C.red : C.green;
    const baseAno = d.baseW * 8.76 * p;
    const tiles = [
      { icon: "mdi:calendar-month", col: C.blue, t: "Este mês", v: eur(d.mesK * p), s: kwh(d.mesK) },
      { icon: "mdi:chart-timeline-variant-shimmer", col: "#A78BFA", t: "Previsão do mês", v: eur(d.prevK * p), s: `ao ritmo de ${eur(d.avg7 * p)}/dia` },
      { icon: up ? "mdi:trending-up" : "mdi:trending-down", col: dCol, t: "vs mês passado", v: isFinite(delta) ? `${up ? "+" : ""}${num(delta, 0)} %` : "—", s: `mesmo período: ${eur(d.mpSameK * p)}` },
      { icon: "mdi:cash-clock", col: C.green, t: "Hoje", v: eur(d.hojeK * p), s: kwh(d.hojeK) },
      { icon: "mdi:power-sleep", col: C.amber, t: "Consumo base", v: isFinite(d.baseW) ? `${num(d.baseW, 0)} W` : "—", s: isFinite(baseAno) ? `≈ ${eur(baseAno, 0)}/ano sempre ligado` : "" },
      { icon: "mdi:history", col: C.muted, t: "Mês passado", v: eur(d.mpFullK * p), s: kwh(d.mpFullK) },
    ];
    let frase = "";
    if (isFinite(delta)) frase = up
      ? `Estás a gastar <b style="color:${C.red}">${num(Math.abs(delta), 0)}% mais</b> do que no mesmo período do mês passado.`
      : `Estás a gastar <b style="color:${C.green}">${num(Math.abs(delta), 0)}% menos</b> do que no mesmo período do mês passado.`;
    return `
      <div class="tiles">${tiles.map((x) => `
        <div class="tile">
          <div class="ti" style="--c:${x.col}"><ha-icon icon="${x.icon}"></ha-icon></div>
          <div class="tt">${x.t}</div><div class="tv">${x.v}</div><div class="ts">${x.s}</div>
        </div>`).join("")}
      </div>
      ${frase ? `<div class="insight"><ha-icon icon="mdi:lightbulb-on-outline"></ha-icon><span>${frase}</span></div>` : ""}`;
  }

  // ---------- RANKING ----------
  async _loadRanking() {
    const P = PERIODOS[this._periodo];
    const [a, b] = P.range();
    const map = await this._stats(this._allIds(), a, b, P.period);
    const total = EnergiaInsightsCard.sum(map, this._config.total);
    const rows = (this._config.devices || []).map((d, i) => ({ ...d, i, color: d.color || PALETTE[i % PALETTE.length], v: this._devValue(d, map) }));
    const soma = rows.reduce((x, r) => x + r.v, 0);
    if (this._config.show_unidentified) rows.push({ name: "Não identificado", icon: "mdi:help-circle-outline", color: "rgba(255,255,255,0.35)", v: Math.max(0, total - soma), unid: true, i: -1 });
    rows.sort((x, y) => y.v - x.v);
    this._data = { rows, total, soma };
    if (this._open != null) this._loadDetalhe(this._open, false);
  }

  async _loadDetalhe(i, render = true) {
    const dev = this._config.devices[i];
    if (!dev) return;
    const ids = [dev.stat, ...(dev.subtract || [])];
    const now = new Date(), som = startOfMonth(now), pm = addMonths(som, -1);
    const d30 = new Date(+startOfDay(now) - 29 * 864e5);
    const [dia, mes, mp] = await Promise.all([
      this._stats(ids, d30, now, "day"),
      this._stats(ids, som, now, "day"),
      this._stats(ids, pm, new Date(Math.min(+pm + (now - som), +som)), "hour"),
    ]);
    const S = EnergiaInsightsCard.sum;
    const dias = [];
    for (let k = 0; k < 30; k++) {
      const t = +d30 + k * 864e5;
      let v = 0;
      ids.forEach((id, j) => {
        const r = (dia[id] || []).find((x) => Math.abs(x.start - t) < 3 * 3600e3);
        v += (j === 0 ? 1 : -1) * (r?.change || 0);
      });
      dias.push({ t, v: Math.max(0, v) });
    }
    this._det = { i, dias, mes: this._devValue(dev, mes), mp: this._devValue(dev, mp) };
    if (render) this._render();
  }

  _renderRanking() {
    const { rows, total } = this._data, p = this.price;
    const base = this._config.percent_of === "grupo" ? rows.reduce((x, r) => x + r.v, 0) : total;
    const max = Math.max(...rows.map((r) => r.v), 0.0001);
    const chips = Object.entries(PERIODOS).map(([k, v]) => `<button class="chip ${k === this._periodo ? "on" : ""}" data-p="${k}">${v.label}</button>`).join("");
    const lista = rows.map((r) => {
      const pct = base > 0 ? (r.v / base) * 100 : 0;
      const open = !r.unid && this._open === r.i;
      return `
        <div class="row ${open ? "open" : ""} ${r.unid ? "" : "click"}" data-i="${r.i}">
          <div class="ri" style="--c:${r.color}"><ha-icon icon="${r.icon || "mdi:flash"}"></ha-icon></div>
          <div class="rm">
            <div class="rn"><span>${esc(r.name)}</span><span class="re">${eur(r.v * p)}</span></div>
            <div class="bar"><div style="width:${(r.v / max) * 100}%;background:${r.color}"></div></div>
            <div class="rs"><span>${kwh(r.v)}</span><span>${num(pct, pct < 10 ? 1 : 0)} %</span></div>
          </div>
        </div>
        ${open ? this._renderDetalhe(r) : ""}`;
    }).join("");
    return `
      <div class="chips">${chips}</div>
      <div class="sum">Total da casa: <b>${eur(total * p)}</b> · ${kwh(total)}</div>
      <div class="list">${lista}</div>
      ${this._config.hint !== false ? `<div class="hint">Toca num equipamento para ver os últimos 30 dias.</div>` : ""}`;
  }

  _renderDetalhe(r) {
    const d = this._det;
    if (!d || d.i !== r.i) return `<div class="det"><div class="load">A carregar…</div></div>`;
    const p = this.price, max = Math.max(...d.dias.map((x) => x.v), 0.0001);
    const media = d.dias.reduce((a, x) => a + x.v, 0) / 30;
    const delta = d.mp > 0 ? (d.mes / d.mp - 1) * 100 : NaN;
    const bars = d.dias.map((x) => {
      const dt = new Date(x.t);
      return `<div class="b" title="${dt.getDate()} ${MESES[dt.getMonth()]}: ${kwh(x.v)} · ${eur(x.v * p)}"><div style="height:${(x.v / max) * 100}%;background:${r.color}"></div></div>`;
    }).join("");
    const f = new Date(d.dias[0].t), l = new Date(d.dias[29].t);
    return `
      <div class="det">
        <div class="bars">${bars}</div>
        <div class="axis"><span>${f.getDate()} ${MESES[f.getMonth()]}</span><span>hoje</span></div>
        <div class="kv">
          <div><span>Média/dia</span><b>${kwh(media)} · ${eur(media * p)}</b></div>
          <div><span>Este mês</span><b>${eur(d.mes * p)}</b></div>
          <div><span>vs mês passado</span><b style="color:${!isFinite(delta) ? C.muted : delta > 0 ? C.red : C.green}">${isFinite(delta) ? (delta > 0 ? "+" : "") + num(delta, 0) + " %" : "—"}</b></div>
          <div><span>Ao ano (ritmo atual)</span><b>${eur(media * 365 * p, 0)}</b></div>
        </div>
      </div>`;
  }

  // ---------- MÁQUINAS ----------
  async _loadMaquinas() {
    const ms = this._config.machines || [];
    const map = await this._stats(ms.map((m) => m.stat), startOfMonth(), new Date(), "day");
    this._data = { mes: Object.fromEntries(ms.map((m) => [m.stat, EnergiaInsightsCard.sum(map, m.stat)])) };
  }

  _renderMaquinas() {
    const h = this._hass, p = this.price;
    const f = (e) => parseFloat(h.states[e]?.state);
    const ago = (e) => {
      const s = h.states[e]; if (!s) return "";
      const min = (Date.now() - new Date(s.last_changed)) / 60000;
      if (min < 60) return `há ${Math.round(min)} min`;
      if (min < 1440) return `há ${Math.round(min / 60)} h`;
      return `há ${Math.round(min / 1440)} dias`;
    };
    return `<div class="maq">${(this._config.machines || []).map((m, i) => {
      const ult = f(m.ultimo), ciclos = f(m.ciclos), kMes = f(m.kwh_ciclos), on = h.states[m.em_ciclo]?.state === "on";
      const w = f(m.power), media = ciclos > 0 ? kMes / ciclos : NaN, col = m.color || PALETTE[i + 2];
      return `
        <div class="mc">
          <div class="mh">
            <div class="ri" style="--c:${col}"><ha-icon icon="${m.icon}"></ha-icon></div>
            <div class="mn">${esc(m.name)}</div>
            ${on ? `<div class="live" style="--c:${col}">a trabalhar · ${num(w, 0)} W</div>` : ""}
          </div>
          <div class="kv">
            <div><span>Último ciclo ${ult > 0 ? ago(m.ultimo) : ""}</span><b>${ult > 0 ? eur(ult * p) + " · " + kwh(ult) : "sem registo"}</b></div>
            <div><span>Média por ciclo</span><b>${isFinite(media) ? eur(media * p) : "—"}</b></div>
            <div><span>Ciclos este mês</span><b>${isFinite(ciclos) ? ciclos : 0}</b></div>
            <div><span>Total este mês</span><b>${eur((this._data?.mes?.[m.stat] || 0) * p)}</b></div>
          </div>
        </div>`;
    }).join("")}</div>`;
  }

  // ---------- PERFIL HORÁRIO ----------
  async _loadPerfil() {
    const T = this._config.total, now = new Date(), d30 = new Date(+startOfDay(now) - 30 * 864e5);
    const map = await this._stats([T], d30, startOfDay(now), "hour");
    this._raw = map[T] || [];
    this._calcPerfil();
  }

  _calcPerfil() {
    const acc = Array.from({ length: 24 }, () => ({ s: 0, n: 0 }));
    this._raw.forEach((r) => {
      const d = new Date(r.start), wd = d.getDay(), fds = wd === 0 || wd === 6;
      if (this._filtro === "uteis" && fds) return;
      if (this._filtro === "fds" && !fds) return;
      acc[d.getHours()].s += r.change || 0; acc[d.getHours()].n++;
    });
    this._data = { horas: acc.map((a) => (a.n ? a.s / a.n : 0)) };
  }

  _renderPerfil() {
    const hs = this._data.horas, p = this.price, max = Math.max(...hs, 0.0001);
    const top = hs.indexOf(Math.max(...hs));
    const dia = hs.reduce((a, b) => a + b, 0);
    const noite = hs.slice(0, 7).reduce((a, b) => a + b, 0);
    const chips = [["todos", "Todos os dias"], ["uteis", "Dias úteis"], ["fds", "Fim de semana"]]
      .map(([k, l]) => `<button class="chip ${k === this._filtro ? "on" : ""}" data-f="${k}">${l}</button>`).join("");
    const bars = hs.map((v, h) => `<div class="b" title="${h}h–${h + 1}h: ${kwh(v)} · ${eur(v * p)}"><div style="height:${(v / max) * 100}%;background:${h === top ? C.amber : C.blue}"></div></div>`).join("");
    return `
      <div class="chips">${chips}</div>
      <div class="bars tall">${bars}</div>
      <div class="axis"><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span></div>
      <div class="insight"><ha-icon icon="mdi:clock-alert-outline"></ha-icon><span>
        A hora mais cara é entre as <b style="color:${C.amber}">${top}h e as ${top + 1}h</b> (${kwh(hs[top])} em média).
        Um dia típico custa <b>${eur(dia * p)}</b>; ${num(dia > 0 ? (noite / dia) * 100 : 0, 0)} % disso é gasto entre a 0h e as 7h.
      </span></div>`;
  }

  // ---------- TENDÊNCIA 12 MESES ----------
  async _loadTendencia() {
    const T = this._config.total, now = new Date(), a = addMonths(startOfMonth(now), -11);
    const map = await this._stats([T], a, now, "month");
    const meses = [];
    for (let k = 0; k < 12; k++) {
      const m = addMonths(a, k);
      const r = (map[T] || []).find((x) => { const d = new Date(x.start); return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear(); });
      meses.push({ m, v: r?.change || 0 });
    }
    this._data = { meses };
  }

  _renderTendencia() {
    const ms = this._data.meses, p = this.price, max = Math.max(...ms.map((x) => x.v), 0.0001);
    const comp = ms.slice(0, 11).filter((x) => x.v > 0);
    const media = comp.length ? comp.reduce((a, x) => a + x.v, 0) / comp.length : 0;
    const caro = comp.reduce((a, x) => (x.v > (a?.v || 0) ? x : a), null);
    const bars = ms.map((x, k) => `
      <div class="mb">
        <div class="mv">${x.v > 0 ? num(x.v * p, 0) + "€" : ""}</div>
        <div class="b"><div style="height:${(x.v / max) * 100}%;background:${k === 11 ? C.blue : "rgba(100,160,255,0.45)"}"></div></div>
        <div class="ml">${MESES[x.m.getMonth()]}</div>
      </div>`).join("");
    return `
      <div class="months">${bars}</div>
      <div class="insight"><ha-icon icon="mdi:chart-line"></ha-icon><span>
        Média mensal: <b>${eur(media * p, 0)}</b> (${kwh(media)}).
        ${caro ? `Mês mais caro: <b>${MESES[caro.m.getMonth()]} ${caro.m.getFullYear()}</b> com ${eur(caro.v * p, 0)}.` : ""}
        O mês atual ainda está a decorrer.
      </span></div>`;
  }

  // ---------- RENDER ----------
  _render() {
    if (!this.shadowRoot || !this._hass) return;
    const c = this._config;
    let body = `<div class="load">A carregar…</div>`;
    if (this._err) body = `<div class="err">Erro: ${esc(this._err)}</div>`;
    else if (c.mode === "maquinas") body = this._renderMaquinas();
    else if (this._data) {
      body = { resumo: () => this._renderResumo(), ranking: () => this._renderRanking(), perfil: () => this._renderPerfil(), tendencia: () => this._renderTendencia() }[c.mode]();
    }
    this.shadowRoot.innerHTML = `
      <style>${EnergiaInsightsCard.css}</style>
      <ha-card>
        ${c.title ? `<div class="hd">${c.icon ? `<ha-icon icon="${c.icon}"></ha-icon>` : ""}<span>${esc(c.title)}</span></div>` : ""}
        ${c.subtitle ? `<div class="sub">${esc(c.subtitle)}</div>` : ""}
        ${body}
      </ha-card>`;
    this.shadowRoot.querySelectorAll("[data-p]").forEach((b) => b.addEventListener("click", () => {
      this._periodo = b.dataset.p; this._data = null; this._render(); this._load();
    }));
    this.shadowRoot.querySelectorAll("[data-f]").forEach((b) => b.addEventListener("click", () => {
      this._filtro = b.dataset.f; this._calcPerfil(); this._render();
    }));
    this.shadowRoot.querySelectorAll(".row.click").forEach((el) => el.addEventListener("click", () => {
      const i = +el.dataset.i;
      if (this._open === i) { this._open = null; this._render(); return; }
      this._open = i; this._det = null; this._render(); this._loadDetalhe(i);
    }));
  }

  static get css() {
    return `
      :host { display:block; }
      ha-card { background: rgba(0,0,0,0.24); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; box-shadow: none; padding: 14px; color: #fff; overflow: hidden; }
      .hd { display:flex; align-items:center; gap:8px; font-size:17px; font-weight:650; margin-bottom:2px; }
      .hd ha-icon { --mdc-icon-size:20px; color:${C.blue}; }
      .sub { font-size:12px; color:${C.muted}; margin-bottom:8px; }
      .load, .err { padding:18px 4px; color:${C.muted}; font-size:13px; }
      .err { color:${C.red}; }
      .tiles { display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:8px; margin-top:6px; }
      .tile { background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:10px 12px; }
      .ti { width:30px; height:30px; border-radius:10px; display:grid; place-items:center; background: color-mix(in srgb, var(--c) 18%, transparent); margin-bottom:6px; }
      .ti ha-icon, .ri ha-icon { --mdc-icon-size:18px; color: var(--c); }
      .tt { font-size:12px; color:${C.muted}; }
      .tv { font-size:21px; font-weight:700; line-height:1.25; }
      .ts { font-size:11.5px; color:${C.muted}; }
      .insight { display:flex; gap:10px; align-items:flex-start; margin-top:10px; padding:10px 12px; border-radius:14px; background: rgba(100,160,255,0.08); border:1px solid rgba(100,160,255,0.18); font-size:13px; line-height:1.45; }
      .insight ha-icon { --mdc-icon-size:18px; color:${C.blue}; flex:none; margin-top:1px; }
      .chips { display:flex; gap:6px; overflow-x:auto; padding:4px 0 8px; scrollbar-width:none; }
      .chips::-webkit-scrollbar { display:none; }
      .chip { flex:none; font: inherit; font-size:12.5px; color:#fff; background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.10); border-radius:999px; padding:6px 12px; cursor:pointer; }
      .chip.on { background: rgba(100,160,255,0.22); border-color: rgba(100,160,255,0.55); }
      .sum { font-size:12.5px; color:${C.muted}; margin-bottom:6px; }
      .sum b { color:#fff; }
      .list { display:flex; flex-direction:column; gap:2px; }
      .row { display:flex; gap:10px; align-items:center; padding:7px 6px; border-radius:12px; }
      .row.click { cursor:pointer; }
      .row.click:hover, .row.open { background: rgba(255,255,255,0.05); }
      .ri { width:34px; height:34px; border-radius:11px; display:grid; place-items:center; flex:none; background: color-mix(in srgb, var(--c) 18%, transparent); }
      .rm { flex:1; min-width:0; }
      .rn { display:flex; justify-content:space-between; gap:8px; font-size:14px; font-weight:550; }
      .rn span:first-child { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .re { flex:none; }
      .bar { height:5px; background:${C.faint}; border-radius:3px; margin:5px 0 3px; overflow:hidden; }
      .bar div { height:100%; border-radius:3px; }
      .rs { display:flex; justify-content:space-between; font-size:11.5px; color:${C.muted}; }
      .hint { font-size:11.5px; color:${C.muted}; text-align:center; margin-top:8px; }
      .det { margin:2px 4px 8px 50px; padding:10px; border-radius:12px; background: rgba(255,255,255,0.03); }
      .bars { display:flex; align-items:flex-end; gap:2px; height:70px; }
      .bars.tall { height:120px; }
      .b { flex:1; height:100%; display:flex; align-items:flex-end; }
      .b div { width:100%; min-height:1px; border-radius:2px 2px 0 0; }
      .axis { display:flex; justify-content:space-between; font-size:10.5px; color:${C.muted}; margin-top:3px; }
      .kv { display:grid; grid-template-columns:1fr 1fr; gap:8px 12px; margin-top:10px; }
      .kv div { display:flex; flex-direction:column; }
      .kv span { font-size:11.5px; color:${C.muted}; }
      .kv b { font-size:14px; font-weight:600; }
      .maq { display:flex; flex-direction:column; gap:8px; }
      .mc { background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:10px 12px; }
      .mh { display:flex; align-items:center; gap:10px; }
      .mn { font-size:15px; font-weight:600; flex:1; }
      .live { font-size:11.5px; padding:3px 8px; border-radius:999px; color: var(--c); border:1px solid var(--c); animation: pulse 2s infinite; }
      @keyframes pulse { 50% { opacity:.55; } }
      .months { display:flex; align-items:flex-end; gap:4px; height:150px; margin-top:6px; }
      .mb { flex:1; height:100%; display:flex; flex-direction:column; align-items:center; min-width:0; }
      .mb .b { width:100%; }
      .mv { font-size:9.5px; color:${C.muted}; height:14px; white-space:nowrap; }
      .ml { font-size:10.5px; color:${C.muted}; margin-top:3px; }
    `;
  }
}

if (!customElements.get("energia-insights-card")) customElements.define("energia-insights-card", EnergiaInsightsCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "energia-insights-card", name: "Energia Insights", description: "Ranking, custos, ciclos, perfil horário e tendência a partir das estatísticas de energia." });
console.info(`%c ENERGIA-INSIGHTS-CARD %c v${EIC_VERSION} `, "background:#64A0FF;color:#000", "");
