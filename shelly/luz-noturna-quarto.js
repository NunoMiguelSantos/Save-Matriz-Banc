// Luz noturna do quarto - Shelly 2PM Gen3 + Shelly BLU Motion
//
// O que faz:
//  - De noite, quando o sensor deteta movimento e a luz está APAGADA,
//    acende a luz (para acordar o marido).
//  - Quando o sensor volta a "sem movimento" (fim do cooldown do sensor),
//    apaga a luz, MAS só se foi o script que a acendeu.
//  - Se a luz foi acesa pelo interruptor (ou app), o sensor é ignorado:
//    o script nunca a apaga.
//  - De dia o script não faz nada.
//
// Exemplos:
//  - Alguém acende no interruptor e passa à frente do sensor -> luz fica acesa.
//  - Luz acesa pelo sensor e alguém carrega no interruptor -> apaga.
//    Se voltar a carregar, fica acesa "à mão" e o sensor já não a apaga.

// ===================== CONFIGURAÇÃO =====================
let CONFIG = {
  SWITCH_ID: 0,              // canal da luz do quarto: 0 = O1, 1 = O2
  NIGHT_START: "22:00",      // início do período noturno
  NIGHT_END: "08:00",        // fim do período noturno
  SENSOR_MAC: "94:b2:16:07:d6:6e", // MAC do BLU Motion
  MOTION_ID: null,           // null = detetar sozinho; ou ex. 202 (bthomesensor:202)
  LUX_MAX: null,             // ex. 20 = só acende se houver menos de 20 lux; null = ignora
  DEBUG: true
};
// =========================================================

let autoOn = false;   // true = a luz acesa agora foi acesa por este script
let luxId = null;

function log(m) { if (CONFIG.DEBUG) print("[luz-noturna] " + m); }

function toMin(hhmm) {
  return JSON.parse(hhmm.slice(0, 2)) * 60 + JSON.parse(hhmm.slice(3, 5));
}

function isNight() {
  let t = Shelly.getComponentStatus("sys").time; // "HH:MM" ou null
  if (t === null || t === undefined) return true; // sem hora: por segurança, atua
  let now = toMin(t), s = toMin(CONFIG.NIGHT_START), e = toMin(CONFIG.NIGHT_END);
  if (s <= e) return now >= s && now < e;
  return now >= s || now < e; // período que atravessa a meia-noite
}

function isDarkEnough() {
  if (CONFIG.LUX_MAX === null || luxId === null) return true;
  let st = Shelly.getComponentStatus("bthomesensor:" + luxId);
  if (!st || typeof st.value !== "number") return true;
  return st.value < CONFIG.LUX_MAX;
}

function lightIsOn() {
  return Shelly.getComponentStatus("switch:" + CONFIG.SWITCH_ID).output === true;
}

function setLight(on) {
  Shelly.call("Switch.Set", { id: CONFIG.SWITCH_ID, on: on });
}

function onMotion(motion) {
  if (motion) {
    if (lightIsOn()) { log("movimento, mas luz já acesa -> ignorar"); return; }
    if (!isNight()) { log("movimento de dia -> ignorar"); return; }
    if (!isDarkEnough()) { log("movimento, mas há luz suficiente -> ignorar"); return; }
    log("movimento de noite -> ACENDER");
    autoOn = true;
    setLight(true);
  } else {
    if (autoOn && lightIsOn()) {
      log("fim do movimento -> APAGAR");
      autoOn = false;
      setLight(false);
    } else {
      log("fim do movimento, luz não foi acesa pelo sensor -> não mexer");
    }
  }
}

Shelly.addStatusHandler(function (ev) {
  if (!ev || !ev.delta) return;

  // Luz mudou: se apagou (por quem for), deixa de ser "do sensor".
  if (ev.component === "switch:" + CONFIG.SWITCH_ID && ev.delta.output !== undefined) {
    if (ev.delta.output === false) autoOn = false;
    return;
  }

  // Sensor de movimento
  if (CONFIG.MOTION_ID !== null &&
      ev.component === "bthomesensor:" + CONFIG.MOTION_ID &&
      typeof ev.delta.value === "boolean") {
    onMotion(ev.delta.value);
  }
});

// Deteta automaticamente os IDs dos sensores do BLU Motion
// (BTHome: obj_id 33 = movimento, obj_id 5 = luminosidade)
function findSensors(offset) {
  Shelly.call("Shelly.GetComponents",
    { dynamic_only: true, include: ["config"], offset: offset },
    function (res, err) {
      if (err || !res) { log("erro a ler componentes: " + JSON.stringify(err)); return; }
      for (let i = 0; i < res.components.length; i++) {
        let c = res.components[i];
        if (c.key.indexOf("bthomesensor:") !== 0 || !c.config) continue;
        if (c.config.addr.toLowerCase() !== CONFIG.SENSOR_MAC.toLowerCase()) continue;
        if (c.config.obj_id === 33 && CONFIG.MOTION_ID === null) CONFIG.MOTION_ID = c.config.id;
        if (c.config.obj_id === 5 && luxId === null) luxId = c.config.id;
      }
      let next = res.offset + res.components.length;
      if (next < res.total) { findSensors(next); return; }
      if (CONFIG.MOTION_ID === null) {
        print("[luz-noturna] ERRO: sensor de movimento não encontrado. Põe MOTION_ID à mão.");
      } else {
        log("pronto. movimento=bthomesensor:" + CONFIG.MOTION_ID +
            " lux=" + (luxId === null ? "-" : "bthomesensor:" + luxId));
      }
    });
}

findSensors(0);
