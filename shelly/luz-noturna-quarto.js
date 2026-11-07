// Luz noturna do quarto - Shelly 2PM Gen3 + Shelly BLU Motion
//
// O que faz:
//  - Quando o sensor deteta movimento, a luz está APAGADA e o quarto está
//    ESCURO (menos de LUX_MAX lux), acende a luz (para acordar o marido).
//  - Quando o sensor volta a "sem movimento" (fim do cooldown do sensor),
//    apaga a luz, MAS só se foi o script que a acendeu.
//  - Se a luz foi acesa pelo interruptor (ou app), o sensor é ignorado:
//    o script nunca a apaga.
//  - Se o quarto tem luz suficiente (dia), o script não faz nada.
//  - Não precisa de internet nem de hora certa.
//
// Exemplos:
//  - Alguém acende no interruptor e passa à frente do sensor -> luz fica acesa.
//  - Luz acesa pelo sensor e alguém carrega no interruptor -> apaga.
//    Se voltar a carregar, fica acesa "à mão" e o sensor já não a apaga.

// ===================== CONFIGURAÇÃO =====================
let CONFIG = {
  SWITCH_ID: 0,              // canal da luz do quarto: 0 = O1, 1 = O2
  LUX_MAX: 15,               // só acende se houver MENOS que isto (lux)
  NIGHT_START: null,         // opcional, ex. "22:00" (só se o Shelly tiver hora certa)
  NIGHT_END: null,           // opcional, ex. "08:00"
  SENSOR_MAC: "94:b2:16:07:d6:6e", // MAC do BLU Motion
  MOTION_ID: null,           // null = detetar sozinho; ou ex. 202 (bthomesensor:202)
  DEBUG: true
};
// =========================================================

let autoOn = false;   // true = a luz acesa agora foi acesa por este script
let luxId = null;

function log(m) { if (CONFIG.DEBUG) print("[luz-noturna] " + m); }

function d(s, i) { return s.charCodeAt(i) - 48; }
function toMin(hhmm) { // "HH:MM" -> minutos desde a meia-noite
  return (d(hhmm, 0) * 10 + d(hhmm, 1)) * 60 + d(hhmm, 3) * 10 + d(hhmm, 4);
}

function isNight() {
  if (CONFIG.NIGHT_START === null || CONFIG.NIGHT_END === null) return true;
  let t = Shelly.getComponentStatus("sys").time; // "HH:MM" ou null
  if (t === null || t === undefined) return true; // sem hora: por segurança, atua
  let now = toMin(t), s = toMin(CONFIG.NIGHT_START), e = toMin(CONFIG.NIGHT_END);
  if (s <= e) return now >= s && now < e;
  return now >= s || now < e; // período que atravessa a meia-noite
}

function isDarkEnough() {
  if (CONFIG.LUX_MAX === null || luxId === null) return true;
  let st = Shelly.getComponentStatus("bthomesensor:" + luxId);
  if (!st || typeof st.value !== "number") return true; // sem leitura: por segurança, atua
  log("luminosidade: " + st.value + " lux");
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
    if (!isNight()) { log("movimento fora do horário -> ignorar"); return; }
    // Espera 1 s para a leitura de lux que vem no mesmo aviso do sensor
    // ficar atualizada antes de decidir.
    Timer.set(1000, false, function () {
      if (lightIsOn()) return;
      if (!isDarkEnough()) { log("movimento, mas há luz suficiente -> ignorar"); return; }
      log("movimento no escuro -> ACENDER");
      autoOn = true;
      setLight(true);
    });
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
