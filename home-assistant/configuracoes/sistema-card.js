// sistema-card v1.0 — estado do sistema, automações, baterias e servidor, em português
const SIS_VERSION = "1.0.0";
const SC = {
  blue: "#64A0FF", teal: "#3CC8B4", green: "#4ADE80", amber: "#FBBF24", red: "#F87171", purple: "#A78BFA", cyan: "#65D8DE",
  muted: "rgba(255,255,255,0.58)", faint: "rgba(255,255,255,0.10)",
};
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ago = (t) => {
  const min = (Date.now() - t) / 60000;
  if (min < 1) return "agora mesmo";
  if (min < 60) return `há ${Math.round(min)} min`;
  if (min < 1440) return `há ${Math.round(min / 60)} h`;
  const d = Math.round(min / 1440);
  return d === 1 ? "ontem" : `há ${d} dias`;
};
const quando = (t) => {
  const d = new Date(t), hoje = new Date(), am = new Date(Date.now() + 864e5);
  const h = d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === hoje.toDateString()) return `hoje às ${h}`;
  if (d.toDateString() === am.toDateString()) return `amanhã às ${h}`;
  return `${d.toLocaleDateString("pt-PT", { day: "numeric", month: "short" })} às ${h}`;
};
const nav = (p) => { history.pushState(null, "", p); window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } })); };

class SistemaCard extends HTMLElement {
  setConfig(config) {
    if (!config || !config.mode) throw new Error("Define 'mode': estado | automacoes | baterias | servidor | tablet");
    this._c = Object.assign({
      backup_ultimo: "sensor.backup_last_successful_automatic_backup",
      backup_proximo: "sensor.backup_next_scheduled_automatic_backup",
      backup_atrasado: "binary_sensor.backups_stale",
      bateria_limite: 30,
      grupos: [], baterias: [],
    }, config);
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._confirm = {};
    this._aberto = false;
  }

  set hass(h) {
    this._h = h;
    const c = this._c;
    let ids;
    if (c.mode === "automacoes" || c.mode === "estado") ids = Object.keys(h.states).filter((e) => e.startsWith("automation."));
    else ids = [];
    if (c.mode === "estado") ids = ids.concat(Object.keys(h.states).filter((e) => e.startsWith("update.")), [c.backup_ultimo, c.backup_proximo, c.backup_atrasado], c.baterias.map((b) => b.e));
    if (c.mode === "baterias") ids = c.baterias.map((b) => b.e);
    if (c.mode === "tablet") ids = [c.ecra, c.bateria_tablet].filter(Boolean);
    const sig = ids.map((e) => { const s = h.states[e]; return s ? s.state + (e.startsWith("automation.") ? s.attributes.last_triggered : "") : "-"; }).join("|");
    if (sig !== this._sig) { this._sig = sig; this._render(); }
  }

  getCardSize() { return 4; }
  getGridOptions() { return { columns: "full", rows: "auto" }; }
  st(e) { return this._h.states[e]; }
  val(e) { return this.st(e)?.state; }
  call(d, s, data) { return this._h.callService(d, s, data); }

  _bat(b) {
    const s = this.st(b.e), v = parseFloat(s?.state);
    return { ...b, v, sem: !s || !isFinite(v) };
  }

  // ---------- estado ----------
  _estado() {
    const c = this._c, h = this._h;
    const upd = Object.values(h.states).filter((s) => s.entity_id.startsWith("update.") && s.state === "on");
    const ult = this.val(c.backup_ultimo), prox = this.val(c.backup_proximo);
    const ultT = ult && !isNaN(Date.parse(ult)) ? Date.parse(ult) : null;
    const proxT = prox && !isNaN(Date.parse(prox)) ? Date.parse(prox) : null;
    const atrasado = this.val(c.backup_atrasado) === "on";
    const autoOff = Object.values(h.states).filter((s) => s.entity_id.startsWith("automation.") && s.state === "off").length;
    const bats = c.baterias.map((b) => this._bat(b));
    const fracas = bats.filter((b) => !b.sem && b.v < c.bateria_limite).length, sem = bats.filter((b) => b.sem).length;
    const core = this.st("update.home_assistant_core_update");
    const tile = (o) => `<button class="tile ${o.a ? "click" : ""}" ${o.a ? `data-nav="${o.a}"` : ""} style="--c:${o.c}">
      <div class="ti"><ha-icon icon="${o.i}"></ha-icon></div><div class="tt">${o.t}</div><div class="tv">${o.v}</div><div class="ts">${o.s}</div></button>`;
    return `<div class="tiles">
      ${tile({ i: "mdi:home-assistant", c: upd.length ? SC.amber : SC.green, t: "Home Assistant", v: h.config?.version || core?.attributes?.installed_version || "—",
        s: upd.length ? `${upd.length} ${upd.length === 1 ? "atualização disponível" : "atualizações disponíveis"}` : "Tudo atualizado", a: "/config/updates" })}
      ${tile({ i: atrasado ? "mdi:cloud-alert" : "mdi:cloud-check-outline", c: atrasado ? SC.red : SC.green, t: "Último backup", v: ultT ? ago(ultT) : "—",
        s: atrasado ? "Backups atrasados!" : proxT ? `Próximo ${quando(proxT)}` : "", a: "/config/backup" })}
      ${tile({ i: "mdi:robot-outline", c: autoOff ? SC.amber : SC.green, t: "Automações desligadas", v: String(autoOff), s: autoOff ? "Vê a lista em baixo" : "Todas ligadas" })}
      ${tile({ i: fracas ? "mdi:battery-alert-variant-outline" : "mdi:battery-check-outline", c: fracas ? SC.red : sem ? SC.amber : SC.green, t: "Baterias",
        v: fracas ? `${fracas} fraca${fracas > 1 ? "s" : ""}` : "Todas OK", s: sem ? `${sem} sem sinal` : `${bats.length} dispositivos` })}
    </div>
    ${upd.length ? `<div class="sec"><div class="st"><ha-icon icon="mdi:update"></ha-icon>Atualizações</div>
      ${upd.map((u) => `<div class="row"><span>${esc((u.attributes.title || u.attributes.friendly_name || "").replace(/ Update$/, ""))}</span>
        <small>${esc(u.attributes.installed_version || "")} → <b>${esc(u.attributes.latest_version || "")}</b></small></div>`).join("")}</div>` : ""}`;
  }

  // ---------- automações ----------
  _linha(e, nome, icon) {
    const s = this.st(e);
    if (!s) return `<div class="au miss"><ha-icon icon="mdi:help-circle-outline"></ha-icon><div class="at"><b>${esc(nome)}</b><small>Automação não encontrada</small></div></div>`;
    const on = s.state === "on", lt = s.attributes.last_triggered;
    return `<button class="au ${on ? "on" : "off"}" data-auto="${e}"><ha-icon icon="${icon || (on ? "mdi:robot-outline" : "mdi:robot-off-outline")}"></ha-icon>
      <div class="at"><b>${esc(nome || s.attributes.friendly_name)}</b><small>${on ? (lt ? `disparou ${ago(Date.parse(lt))}` : "ainda não disparou") : "Desligada"}</small></div><span class="sw"></span></button>`;
  }

  _automacoes() {
    const c = this._c, usados = new Set();
    let h = c.grupos.map((g) => {
      g.itens.forEach((i) => usados.add(i.e));
      return `<div class="grp"><div class="gt"><ha-icon icon="${g.icone}"></ha-icon>${esc(g.titulo)}</div>${g.itens.map((i) => this._linha(i.e, i.n, i.i)).join("")}</div>`;
    }).join("");
    const outras = Object.values(this._h.states).filter((s) => s.entity_id.startsWith("automation.") && s.state === "off" && !usados.has(s.entity_id))
      .sort((a, b) => (a.attributes.friendly_name || "").localeCompare(b.attributes.friendly_name || ""));
    if (outras.length) h += `<div class="grp"><div class="gt"><ha-icon icon="mdi:robot-off-outline"></ha-icon>Outras desligadas</div>${outras.map((s) => this._linha(s.entity_id)).join("")}</div>`;
    return h;
  }

  // ---------- baterias ----------
  _baterias() {
    const c = this._c, bats = c.baterias.map((b) => this._bat(b));
    const ord = bats.slice().sort((a, b) => (a.sem ? -1 : b.sem ? 1 : a.v - b.v));
    const atencao = ord.filter((b) => b.sem || b.v < c.bateria_limite);
    const mostra = this._aberto ? ord : atencao;
    const linha = (b) => {
      const col = b.sem ? SC.muted : b.v < 15 ? SC.red : b.v < c.bateria_limite ? SC.amber : SC.green;
      return `<div class="bt"><ha-icon icon="${b.sem ? "mdi:battery-unknown" : b.v < 15 ? "mdi:battery-alert-variant-outline" : "mdi:battery-high"}" style="color:${col}"></ha-icon>
        <div class="bm"><div class="bn"><span>${esc(b.n)}</span><span style="color:${col}">${b.sem ? "sem sinal" : Math.round(b.v) + "%"}</span></div>
        ${b.sem ? "" : `<div class="bar"><div style="width:${Math.max(2, b.v)}%;background:${col}"></div></div>`}</div></div>`;
    };
    return `${atencao.length ? "" : `<div class="ok"><ha-icon icon="mdi:check-circle-outline"></ha-icon>Todas as ${bats.length} baterias acima de ${c.bateria_limite}%</div>`}
      <div class="bts">${mostra.map(linha).join("")}</div>
      <button class="more" data-more>${this._aberto ? "Mostrar só as que precisam de atenção" : `Ver todas (${bats.length})`}</button>`;
  }

  // ---------- servidor / tablet ----------
  _btn(id, txt, sub, icon, col) {
    const conf = this._confirm[id] > Date.now();
    return `<button class="sb ${conf ? "conf" : ""}" data-b="${id}" style="--c:${col}"><ha-icon icon="${icon}"></ha-icon><b>${conf ? "Toca outra vez" : txt}</b><small>${conf ? "para confirmar" : sub}</small></button>`;
  }

  _servidor() {
    return `<div class="sbs">
      ${this._btn("perfil", "Perfil", "o teu utilizador", "mdi:account-cog-outline", SC.blue)}
      ${this._btn("restart", "Reiniciar HA", "≈ 30 s", "mdi:restart", SC.amber)}
      ${this._btn("reboot", "Reiniciar servidor", "≈ 2 min", "mdi:server-network", SC.amber)}
      ${this._btn("shutdown", "Desligar", "servidor fica desligado", "mdi:power", SC.red)}
    </div>`;
  }

  _tablet() {
    const c = this._c, on = this.val(c.ecra) === "on", bat = parseFloat(this.val(c.bateria_tablet));
    return `<div class="sbs">
      <button class="sb ${on ? "lit" : ""}" data-b="ecra" style="--c:${SC.amber}"><ha-icon icon="${on ? "mdi:tablet" : "mdi:tablet-off"}"></ha-icon><b>Ecrã ${on ? "ligado" : "desligado"}</b><small>${isFinite(bat) ? `bateria ${Math.round(bat)}%` : "tocar para alternar"}</small></button>
      ${this._btn("browser", "Reiniciar navegador", "recarrega o painel", "mdi:refresh", SC.blue)}
      ${this._btn("tablet_restart", "Reiniciar tablet", "≈ 1 min", "mdi:restart", SC.red)}
    </div>`;
  }

  _render() {
    if (!this._h || !this.shadowRoot) return;
    const c = this._c;
    const body = { estado: () => this._estado(), automacoes: () => this._automacoes(), baterias: () => this._baterias(), servidor: () => this._servidor(), tablet: () => this._tablet() }[c.mode]();
    this.shadowRoot.innerHTML = `<style>${SistemaCard.css}</style><ha-card>
      ${c.title ? `<div class="hd">${c.icon ? `<ha-icon icon="${c.icon}"></ha-icon>` : ""}<span>${esc(c.title)}</span></div>` : ""}
      ${c.subtitle ? `<div class="sub">${esc(c.subtitle)}</div>` : ""}${body}</ha-card>`;
    const R = this.shadowRoot;
    R.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => nav(b.dataset.nav)));
    R.querySelectorAll("[data-auto]").forEach((b) => b.addEventListener("click", () => this.call("automation", this.val(b.dataset.auto) === "on" ? "turn_off" : "turn_on", { entity_id: b.dataset.auto })));
    R.querySelectorAll("[data-more]").forEach((b) => b.addEventListener("click", () => { this._aberto = !this._aberto; this._render(); }));
    const confirmar = (id, fn) => {
      if (this._confirm[id] > Date.now()) { this._confirm[id] = 0; fn(); }
      else { this._confirm[id] = Date.now() + 4000; setTimeout(() => this._render(), 4100); }
      this._render();
    };
    R.querySelectorAll("[data-b]").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.b;
      if (id === "perfil") nav("/profile");
      if (id === "restart") confirmar(id, () => this.call("homeassistant", "restart", {}));
      if (id === "reboot") confirmar(id, () => this.call("hassio", "host_reboot", {}));
      if (id === "shutdown") confirmar(id, () => this.call("hassio", "host_shutdown", {}));
      if (id === "ecra") this.call("switch", "toggle", { entity_id: c.ecra });
      if (id === "browser") this.call("button", "press", { entity_id: c.reiniciar_navegador });
      if (id === "tablet_restart") confirmar(id, () => this.call("button", "press", { entity_id: c.reiniciar_tablet }));
    }));
  }

  static get css() {
    return `
      :host { display:block; container-type:inline-size; }
      ha-card { background: rgba(0,0,0,0.24); border:1px solid rgba(255,255,255,0.15); border-radius:20px; box-shadow:none; padding:14px; color:#fff; }
      ha-icon { --mdc-icon-size:18px; }
      .hd { display:flex; align-items:center; gap:8px; font-size:17px; font-weight:650; margin-bottom:2px; }
      .hd ha-icon { --mdc-icon-size:20px; color:${SC.cyan}; }
      .sub { font-size:12px; color:${SC.muted}; margin-bottom:10px; }
      .tiles { display:grid; grid-template-columns: 1fr 1fr; gap:8px; }
      .tile { text-align:left; font:inherit; color:#fff; background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:10px 12px; }
      .tile.click { cursor:pointer; }
      .ti { width:30px; height:30px; border-radius:10px; display:grid; place-items:center; background: color-mix(in srgb, var(--c) 18%, transparent); margin-bottom:6px; }
      .ti ha-icon { color:var(--c); }
      .tt { font-size:12px; color:${SC.muted}; } .tv { font-size:19px; font-weight:700; line-height:1.25; } .ts { font-size:11.5px; color:var(--c); }
      .sec { margin-top:10px; background: rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:10px 12px; }
      .st { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:${SC.muted}; margin-bottom:6px; text-transform:uppercase; letter-spacing:.04em; }
      .row { display:flex; justify-content:space-between; gap:8px; font-size:13px; padding:5px 0; border-bottom:1px solid rgba(255,255,255,0.06); }
      .row small { color:${SC.muted}; white-space:nowrap; } .row b { color:${SC.amber}; font-weight:600; }
      .grp + .grp { margin-top:12px; }
      .gt { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:${SC.muted}; text-transform:uppercase; letter-spacing:.04em; margin:0 2px 6px; }
      .au { width:100%; display:flex; align-items:center; gap:10px; font:inherit; color:#fff; text-align:left; padding:10px 12px; margin-bottom:6px; border-radius:14px; cursor:pointer;
        background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); }
      .au .at { flex:1; min-width:0; display:flex; flex-direction:column; }
      .au b { font-size:14px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; } .au small { font-size:11.5px; color:${SC.muted}; }
      .au ha-icon { color:${SC.muted}; flex:none; }
      .au.on ha-icon { color:${SC.teal}; }
      .au.off { border-color: rgba(251,191,36,0.30); background: rgba(251,191,36,0.06); } .au.off small { color:${SC.amber}; }
      .au.miss { cursor:default; opacity:.6; }
      .sw { width:38px; height:22px; border-radius:999px; background: rgba(255,255,255,0.18); position:relative; flex:none; }
      .sw::after { content:""; position:absolute; top:3px; left:3px; width:16px; height:16px; border-radius:50%; background:#fff; transition:left .2s; }
      .au.on .sw { background:${SC.teal}; } .au.on .sw::after { left:19px; }
      .ok { display:flex; align-items:center; gap:8px; font-size:13.5px; padding:10px 12px; border-radius:12px; background: rgba(74,222,128,0.08); border:1px solid rgba(74,222,128,0.25); }
      .ok ha-icon { color:${SC.green}; }
      .bts { display:flex; flex-direction:column; gap:10px; margin-top:8px; }
      .bt { display:flex; align-items:center; gap:10px; } .bm { flex:1; min-width:0; }
      .bn { display:flex; justify-content:space-between; font-size:13.5px; gap:6px; } .bn span:first-child { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .bar { height:5px; border-radius:3px; background:${SC.faint}; margin-top:4px; overflow:hidden; } .bar div { height:100%; border-radius:3px; }
      .more { margin-top:10px; width:100%; font:inherit; font-size:12.5px; color:#fff; padding:8px; border-radius:12px; cursor:pointer; background: rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.10); }
      .sbs { display:grid; grid-template-columns: 1fr 1fr; gap:8px; }
      .sb { display:flex; flex-direction:column; align-items:flex-start; gap:2px; font:inherit; color:#fff; text-align:left; padding:12px; border-radius:14px; cursor:pointer;
        background: rgba(255,255,255,0.04); border:1px solid color-mix(in srgb, var(--c) 35%, transparent); }
      .sb ha-icon { --mdc-icon-size:22px; color:var(--c); margin-bottom:4px; }
      .sb b { font-size:14px; } .sb small { font-size:11.5px; color:${SC.muted}; }
      .sb.conf { background: color-mix(in srgb, var(--c) 22%, transparent); }
      .sb.lit { background: color-mix(in srgb, var(--c) 16%, transparent); }
      @container (min-width: 600px) { .tiles { grid-template-columns: repeat(4, 1fr); } .sbs { grid-template-columns: repeat(4, 1fr); } }
    `;
  }
}

if (!customElements.get("sistema-card")) customElements.define("sistema-card", SistemaCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "sistema-card", name: "Sistema", description: "Estado do sistema, automações, baterias, servidor e tablet." });
console.info(`%c SISTEMA-CARD %c v${SIS_VERSION} `, "background:#65D8DE;color:#000", "");
