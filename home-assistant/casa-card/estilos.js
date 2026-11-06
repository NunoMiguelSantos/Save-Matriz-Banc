// =====================================================================
//  casa-card · ESTILOS (aspeto visual)
// ---------------------------------------------------------------------
//  Aqui está todo o CSS do cartão. Para mudar cores, mexe só no bloco
//  CORES logo abaixo: o resto do ficheiro usa estes nomes (var(--...)).
//
//  Depois de gravar, sobe o número ?v= do recurso (ver LEIA-ME.md),
//  senão o browser continua a usar a versão antiga.
//
//  Nota: as cores dos CENÁRIOS e das FITAS não estão aqui; estão no
//  YAML do cartão no dashboard (scenes / led_whites / led_colors).
// =====================================================================

// ---------- CORES E MEDIDAS PRINCIPAIS ----------
export const CORES = `
:host {
  /* fundos dos cartões */
  --card: #122b35;              /* fundo de cada caixa */
  --card2: #1a3842;             /* fundo dos botões dentro das caixas */
  --line: rgba(101, 216, 222, 0.16);   /* contorno das caixas */
  --line2: rgba(255, 255, 255, 0.07);  /* linhas separadoras */

  /* texto */
  --fg: #eefaff;                       /* texto principal */
  --dim: rgba(238, 250, 255, 0.64);    /* texto secundário */
  --mute: rgba(238, 250, 255, 0.4);    /* texto apagado (rótulos) */

  /* cores de destaque */
  --cyan: #65d8de;   /* cor principal: selecionado, botões, estores */
  --warm: #ffc46b;   /* luzes acesas */
  --cool: #7cc4ff;   /* AC a arrefecer */
  --heat: #ff8a5c;   /* aquecimento / AC a aquecer */
  --ok: #5fd39a;     /* "tudo em ordem", pessoa em casa */
  --warn: #f5b84a;   /* alertas de atenção */
  --bad: #f87171;    /* alertas urgentes, alarme armado */

  /* tablet: largura das colunas da direita (a planta fica com o resto) */
  --largura-info: 565px;       /* painel de informações */
  --largura-cenarios: 128px;   /* coluna dos cenários */
}
`;

// ---------- Base comum (botões, sliders, botões rápidos) ----------
export const BASE = `
:host {
  display: block;
  color: var(--fg);
  font-family: inherit;
}
* {
  box-sizing: border-box;
}
button {
  font-family: inherit;
  color: inherit;
  border: 0;
  background: none;
  cursor: pointer;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}
button:focus-visible,
input:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
}
button:active {
  transform: scale(0.97);
}
ha-icon {
  display: inline-flex;
  --mdc-icon-size: 20px;
}
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 30px;
  background: transparent;
  margin: 0;
  touch-action: pan-y;
}
input[type="range"]::-webkit-slider-runnable-track {
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(
    90deg,
    var(--fill, var(--cyan)) var(--p, 0%),
    rgba(255, 255, 255, 0.1) var(--p, 0%)
  );
}
input[type="range"]::-moz-range-track {
  height: 10px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);
}
input[type="range"]::-moz-range-progress {
  height: 10px;
  border-radius: 5px;
  background: var(--fill, var(--cyan));
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #fff;
  margin-top: -8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
input[type="range"]::-moz-range-thumb {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #fff;
  border: 0;
}
input.hue::-webkit-slider-runnable-track {
  background: linear-gradient(
    90deg,
    #f33,
    #fa3,
    #ff3,
    #3f6,
    #3ff,
    #36f,
    #c3f,
    #f3a,
    #f33
  );
}
input.hue::-moz-range-track {
  background: linear-gradient(
    90deg,
    #f33,
    #fa3,
    #ff3,
    #3f6,
    #3ff,
    #36f,
    #c3f,
    #f3a,
    #f33
  );
}
input.hue::-moz-range-progress {
  background: transparent;
}
.quick {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
}
.quick button {
  height: 30px;
  border-radius: 9px;
  background: var(--card2);
  font-size: 12px;
  font-weight: 600;
  color: var(--dim);
}
.quick button.on {
  background: rgba(101, 216, 222, 0.2);
  color: var(--cyan);
}
.seg {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 5px;
}
.seg button {
  height: 40px;
  border-radius: 11px;
  background: var(--card2);
  font-size: 13px;
  font-weight: 600;
  color: var(--dim);
}
.seg button.on {
  background: var(--cyan);
  color: #06262b;
}
`;

// ---------- Ecrã do telemóvel e painel de informações (também usado no tablet) ----------
export const TELEMOVEL = `
.root {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 2px 0 4px;
}
.top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.top .g {
  flex: 1;
  min-width: 0;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.2;
}
.top .g small {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--dim);
  white-space: nowrap;
  overflow: hidden;
}
.top .g small ha-icon {
  --mdc-icon-size: 15px;
}
.av {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 12px;
  position: relative;
  margin-left: -6px;
  border: 2px solid #10242b;
  background-size: cover;
  background-position: center;
}
.av::after {
  content: "";
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--mute);
  border: 2px solid #10242b;
}
.av.home::after {
  background: var(--ok);
}
.av:not(.home) {
  opacity: 0.55;
}
.bell {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--card);
  border: 1px solid var(--line);
  color: var(--dim);
}
.bell ha-icon {
  --mdc-icon-size: 19px;
}
.bell b {
  position: absolute;
  top: -3px;
  right: -3px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: var(--bad);
  color: #fff;
  font-size: 11px;
  display: grid;
  place-items: center;
  padding: 0 4px;
}
/* alarme e portão ao lado das pessoas: só o ícone */
.ico2 {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  padding: 0;
  flex: none;
  background: var(--card);
  border: 1px solid var(--line);
  color: var(--dim);
  cursor: pointer;
}
.ico2 ha-icon {
  --mdc-icon-size: 18px;
}
.ico2.dang {
  color: var(--bad);
  background: color-mix(in srgb, var(--bad) 14%, transparent);
  border-color: color-mix(in srgb, var(--bad) 45%, transparent);
}
/* cabeçalho do telemóvel maior: mais fácil de ler e de carregar */
.top {
  gap: 8px;
  padding: 2px 0 4px;
}
.top .g {
  font-size: 23px;
}
.top .g small {
  font-size: 14.5px;
  gap: 6px;
  margin-top: 3px;
  flex-wrap: nowrap;
  white-space: nowrap;
}
.top .g small ha-icon {
  --mdc-icon-size: 18px;
}
.top .g small button {
  padding: 4px 9px 4px 6px !important;
  flex: none;
}
.top .av {
  width: 38px;
  height: 38px;
  font-size: 14px;
  flex: none;
}
.top .av::after {
  width: 11px;
  height: 11px;
}
.top .av + .av {
  margin-left: -14px;
}
.top .ico2,
.top .bell {
  width: 42px;
  height: 42px;
  flex: none;
}
.top .ico2 ha-icon,
.top .bell ha-icon {
  --mdc-icon-size: 22px;
}
.pick {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
}
.rb {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 68px;
  border-radius: 14px;
  background: var(--card);
  border: 1px solid var(--line);
  color: var(--dim);
  font-size: 12px;
  font-weight: 600;
  padding: 0 2px;
  min-width: 0;
}
.rb > ha-icon {
  --mdc-icon-size: 20px;
}
.rb .nm {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.rb.lit {
  color: var(--warm);
}
.rb.sel {
  background: var(--cyan);
  color: #06262b;
  border-color: transparent;
}
.stt {
  display: flex;
  gap: 2px;
  height: 14px;
  align-items: center;
  max-width: 100%;
  overflow: hidden;
}
.stt ha-icon {
  --mdc-icon-size: 13px;
}
.stt .l {
  color: var(--warm);
}
.stt .c {
  color: var(--cool);
}
.stt .h {
  color: var(--heat);
}
.stt .b {
  color: var(--cyan);
}
.stt .f {
  color: var(--cyan);
}
.stt .z {
  color: var(--mute);
  font-size: 10px;
  font-weight: 500;
}
.rb.sel .stt ha-icon,
.rb.sel .stt .z {
  color: #06262b;
}
.room {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.rh {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 0 2px;
}
.rh b {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.rh span {
  color: var(--dim);
  font-size: 13.5px;
  font-variant-numeric: tabular-nums;
  display: flex;
  gap: 10px;
}
.rh .hi {
  color: var(--warn);
}
.card {
  border-radius: 18px;
  background: var(--card);
  border: 1px solid var(--line);
  padding: 11px;
}
.lab {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--mute);
  font-weight: 700;
  margin-bottom: 8px;
}
.lab em {
  font-style: normal;
  text-transform: none;
  letter-spacing: 0;
  font-size: 12.5px;
  color: var(--fg);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.lab button {
  text-transform: none;
  letter-spacing: 0;
  font-size: 13px;
  color: var(--cyan);
  font-weight: 600;
  padding: 4px 0;
}
.lights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
  gap: 6px;
}
.lt {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  padding: 10px;
  border-radius: 14px;
  background: var(--card2);
  font-size: 13px;
  font-weight: 600;
  color: var(--dim);
  text-align: left;
  min-width: 0;
}
.lt small {
  font-size: 11px;
  font-weight: 500;
  opacity: 0.85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.lt.on {
  background: linear-gradient(
    150deg,
    rgba(255, 196, 107, 0.32),
    rgba(255, 196, 107, 0.12)
  );
  color: var(--warm);
}
.lt.na {
  opacity: 0.4;
}
.lt.led.on {
  background: linear-gradient(
    150deg,
    color-mix(in srgb, var(--c) 45%, transparent),
    color-mix(in srgb, var(--c) 14%, transparent)
  );
  color: var(--fg);
}
.lt.led::after {
  content: "›";
  position: absolute;
  right: 10px;
  top: 7px;
  font-size: 17px;
  color: var(--dim);
}
.lt .sw {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3a5059;
}
.lt.led.on .sw {
  background: var(--c);
  box-shadow: 0 0 10px var(--c);
}
.clima.cool {
  background: linear-gradient(
      150deg,
      rgba(124, 196, 255, 0.2),
      rgba(124, 196, 255, 0.05)
    ),
    var(--card);
  border-color: rgba(124, 196, 255, 0.4);
}
.clima.heat {
  background: linear-gradient(
      150deg,
      rgba(255, 138, 92, 0.2),
      rgba(255, 138, 92, 0.05)
    ),
    var(--card);
  border-color: rgba(255, 138, 92, 0.4);
}
.clima.dry,
.clima.other {
  background: linear-gradient(
      150deg,
      rgba(101, 216, 222, 0.18),
      rgba(101, 216, 222, 0.04)
    ),
    var(--card);
  border-color: rgba(101, 216, 222, 0.35);
}
.dial {
  display: grid;
  grid-template-columns: 58px 1fr 58px;
  gap: 8px;
  align-items: center;
}
.pm {
  height: 52px;
  border-radius: 16px;
  background: var(--card2);
  font-size: 28px;
  font-weight: 400;
  display: grid;
  place-items: center;
}
.tgt {
  text-align: center;
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.tgt small {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--dim);
  letter-spacing: 0;
  margin-top: 4px;
}
.clima.off .tgt {
  color: var(--mute);
}
.modes {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-top: 10px;
}
.modes button {
  height: 42px;
  border-radius: 12px;
  background: var(--card2);
  font-size: 13px;
  font-weight: 600;
  color: var(--dim);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}
.modes button ha-icon {
  --mdc-icon-size: 17px;
}
.modes button.on.m-off {
  background: #3a4c52;
  color: var(--fg);
}
.modes button.on.m-cool {
  background: var(--cool);
  color: #06223a;
}
.modes button.on.m-heat {
  background: var(--heat);
  color: #3a1405;
}
.modes button.on.m-dry {
  background: var(--cyan);
  color: #06262b;
}
.blind {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}
.blind + .blind {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--line2);
}
.win {
  width: 40px;
  height: 50px;
  border-radius: 7px;
  border: 2px solid #3e6672;
  background: linear-gradient(180deg, #24485a, #16323c);
  position: relative;
  overflow: hidden;
}
.win::before {
  content: "";
  position: absolute;
  inset: 0 50% 0 auto;
  border-right: 2px solid #3e6672;
}
.win i {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  background: repeating-linear-gradient(180deg, #9cc5cd 0 4px, #7aa6b0 4px 6px);
  transition: height 0.3s;
}
.bctl {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.rng {
  touch-action: pan-y;
  cursor: ew-resize;
  padding: 4px 0;
}
.rng input {
  pointer-events: none;
}
.bname {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
}
.bname em {
  font-style: normal;
  color: var(--cyan);
  font-variant-numeric: tabular-nums;
}
.extras {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 6px;
}
.tg {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 11px;
  border-radius: 14px;
  background: var(--card);
  border: 1px solid var(--line);
  font-weight: 600;
  font-size: 13px;
  color: var(--dim);
  text-align: left;
  min-width: 0;
}
.tg.on {
  background: rgba(101, 216, 222, 0.16);
  border-color: rgba(101, 216, 222, 0.35);
  color: var(--cyan);
}
.tg.hot {
  background: rgba(255, 138, 92, 0.14);
  border-color: rgba(255, 138, 92, 0.4);
  color: var(--heat);
}
.tg.dang {
  background: rgba(248, 113, 113, 0.14);
  border-color: rgba(248, 113, 113, 0.35);
  color: #ffb4b4;
}
.tg.ro {
  cursor: default;
}
.tg.ro:active {
  transform: none;
}
.tg em {
  margin-left: auto;
  font-style: normal;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}
.stp {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 44px 72px 44px;
  align-items: center;
  gap: 6px;
}
.stp + .stp {
  margin-top: 6px;
}
.stp span {
  font-size: 13px;
  color: var(--dim);
}
.stp button {
  height: 40px;
  border-radius: 12px;
  background: var(--card2);
  font-size: 22px;
  display: grid;
  place-items: center;
}
.stp b {
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.arow {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 0;
  border-bottom: 1px solid var(--line2);
  font-size: 13px;
}
.arow:last-of-type {
  border-bottom: 0;
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex: none;
}
.d-bad {
  background: var(--bad);
  box-shadow: 0 0 8px var(--bad);
}
.d-warn {
  background: var(--warn);
}
.d-off {
  background: #7c8b90;
}
.d-info {
  background: var(--cyan);
}
.arow .at {
  flex: 1;
  min-width: 0;
}
.arow .at b {
  display: block;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.arow .at small {
  display: block;
  font-size: 11.5px;
  color: var(--mute);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.arow > small {
  color: var(--mute);
  font-size: 11.5px;
  white-space: nowrap;
}
.abtn {
  padding: 6px 10px;
  border-radius: 9px;
  background: var(--cyan);
  color: #06262b;
  font-weight: 700;
  font-size: 12px;
  white-space: nowrap;
}
.abtn.cf {
  background: var(--warn);
}
.more {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 9px;
  border-radius: 10px;
  background: var(--card2);
  font-weight: 600;
  font-size: 12.5px;
  color: var(--cyan);
}
.tg.dis {
  opacity: 0.5;
}
.ochips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin: -2px 0 8px;
}
.ochips button {
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(101, 216, 222, 0.14);
  border: 1px solid rgba(101, 216, 222, 0.4);
  font-size: 12px;
  font-weight: 600;
}
.ochips span {
  font-size: 12.5px;
  color: var(--mute);
}
.al {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(248, 113, 113, 0.1);
  color: #ffb4b4;
  text-align: left;
}
.al.w {
  background: rgba(245, 184, 74, 0.1);
  color: #ffd88f;
}
.al small {
  margin-left: auto;
  font-weight: 500;
  opacity: 0.8;
  white-space: nowrap;
}
.allok {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ok);
  font-weight: 600;
  font-size: 13px;
}
.onrow {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 2px;
  border-bottom: 1px solid var(--line2);
  font-size: 13px;
  text-align: left;
}
.onrow:last-of-type {
  border-bottom: 0;
}
.onrow b {
  min-width: 70px;
  font-weight: 600;
}
.onrow span {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  flex: 1;
  min-width: 0;
}
.onrow i {
  font-style: normal;
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 12.5px;
}
.onrow i ha-icon {
  --mdc-icon-size: 15px;
}
.onrow .l {
  color: var(--warm);
}
.onrow .c {
  color: var(--cool);
}
.onrow .h {
  color: var(--heat);
}
.onrow .f {
  color: var(--cyan);
}
/* "Ligado agora": nome abre a divisão; botões apagam luzes / desligam AC */
.onm {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 78px;
  padding: 6px 0;
  font-weight: 600;
  font-size: 13px;
  text-align: left;
}
.onm small {
  color: var(--mute);
  font-size: 15px;
}
.onrow span {
  align-items: center;
  gap: 6px;
}
.onb {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 8px 0 10px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 600;
  background: color-mix(in srgb, currentColor 12%, transparent);
  border: 1px solid color-mix(in srgb, currentColor 35%, transparent);
  cursor: pointer;
}
.onb ha-icon {
  --mdc-icon-size: 16px;
}
.onb .x {
  --mdc-icon-size: 14px;
  opacity: 0.7;
}
.onb.l {
  color: var(--warm);
}
.onb.c {
  color: var(--cool);
}
.onb.h {
  color: var(--heat);
}
.onb.ask {
  color: var(--warn);
}
.bl8 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 5px;
  margin-bottom: 8px;
}
.bw {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 7px 2px 6px;
  border-radius: 12px;
  background: var(--card2);
  border: 1px solid transparent;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--dim);
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
}
.bw .mw {
  width: 22px;
  height: 26px;
  border-radius: 4px;
  border: 1.5px solid #3e6672;
  background: #1d3d4a;
  position: relative;
  overflow: hidden;
}
.bw .mw i {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  background: repeating-linear-gradient(180deg, #9cc5cd 0 3px, #7aa6b0 3px 4px);
}
.bw .bp {
  font-size: 10.5px;
  font-weight: 500;
  color: var(--mute);
}
.bw.op {
  background: rgba(101, 216, 222, 0.14);
  border-color: rgba(101, 216, 222, 0.45);
  color: var(--fg);
}
.bw.op .bp {
  color: var(--cyan);
  font-weight: 700;
}
`;

// ---------- Só do tablet: topo, planta, botões Casa toda / Garagem e cenários ----------
export const TABLET = `
.tab {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 12px;
  height: var(--h);
  min-height: 560px;
}
.ttop {
  display: flex;
  align-items: center;
  gap: 16px;
}
.clock {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.tdate {
  color: var(--dim);
  font-size: 13.5px;
  line-height: 1.3;
}
.tdate b {
  color: var(--fg);
  font-size: 15px;
}
.tdate ha-icon {
  --mdc-icon-size: 15px;
  vertical-align: -2px;
}
.tmid {
  flex: 1;
  display: flex;
  justify-content: center;
}
.achip {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 15px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.3);
  color: #ffb4b4;
}
.achip.w {
  background: rgba(245, 184, 74, 0.1);
  border-color: rgba(245, 184, 74, 0.3);
  color: #ffd88f;
}
.achip.ok {
  background: rgba(95, 211, 154, 0.08);
  border-color: rgba(95, 211, 154, 0.25);
  color: var(--ok);
}
.pill {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(95, 211, 154, 0.1);
  border: 1px solid rgba(95, 211, 154, 0.25);
  color: var(--ok);
}
.pill.arm {
  background: rgba(248, 113, 113, 0.12);
  border-color: rgba(248, 113, 113, 0.35);
  color: var(--bad);
}
.pill ha-icon {
  --mdc-icon-size: 17px;
}
.tbody {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--largura-info) var(
      --largura-cenarios
    );
  gap: 14px;
  min-height: 0;
}
.pcol {
  position: relative;
  border-radius: 22px;
  background: linear-gradient(145deg, #16343f 0%, #0b202b 100%);
  border: 1px solid rgba(101, 216, 222, 0.24);
  overflow: hidden;
  display: flex;
  align-items: stretch;
  min-height: 0;
  min-width: 0;
}
.pwrap {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: grid;
  place-items: center;
}
.pl {
  position: relative;
  touch-action: manipulation;
  cursor: pointer;
}
.pl img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}
.pl img.ov {
  opacity: 0;
  transition: opacity 0.45s;
}
.pl img.ov.on {
  opacity: 1;
}
.bx {
  position: absolute;
  border-radius: 14px;
  pointer-events: none;
  transition:
    background 0.3s,
    box-shadow 0.3s;
}
.bx.heat {
  background: radial-gradient(
    closest-side,
    rgba(255, 138, 92, 0.22),
    transparent
  );
}
.bx.cool {
  background: radial-gradient(
    closest-side,
    rgba(124, 196, 255, 0.22),
    transparent
  );
}
.bx.sel {
  box-shadow:
    inset 0 0 0 3px rgba(101, 216, 222, 0.9),
    0 0 24px rgba(101, 216, 222, 0.35);
}
.bdg {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 10px;
  background: rgba(6, 15, 19, 0.72);
  border: 1px solid rgba(140, 210, 230, 0.22);
  font-size: 12.5px;
  font-weight: 700;
  white-space: nowrap;
  backdrop-filter: blur(4px);
}
.bdg ha-icon {
  --mdc-icon-size: 14px;
}
.bdg.sel {
  border-color: var(--cyan);
  color: var(--cyan);
}
.bdg .l {
  color: var(--warm);
}
.bdg .c {
  color: var(--cool);
}
.bdg .h {
  color: var(--heat);
}
.bdg .b,
.bdg .f {
  color: var(--cyan);
}
.pbtns {
  flex: none;
  width: 136px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 12px 12px 0;
}
.pbtns button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 15px 14px;
  border-radius: 14px;
  background: rgba(6, 15, 19, 0.72);
  border: 1px solid var(--line);
  font-weight: 600;
  font-size: 14.5px;
}
.pbtns button.on {
  background: var(--cyan);
  color: #06262b;
  border-color: transparent;
}
.pbtns ha-icon {
  --mdc-icon-size: 20px;
}
.tside {
  border-radius: 22px;
  background: rgba(10, 24, 30, 0.55);
  border: 1px solid var(--line);
  padding: 14px;
  overflow: auto;
  scrollbar-width: none;
  min-height: 0;
}
.tside::-webkit-scrollbar {
  display: none;
}
.scol {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}
.scol .lab {
  margin: 2px 4px 0;
}
.sc2 {
  flex: 1;
  max-height: 190px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border-radius: 18px;
  font-weight: 700;
  font-size: 13.5px;
  text-align: center;
  padding: 8px;
  color: var(--fg);
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--sc) 34%, transparent),
    color-mix(in srgb, var(--sc) 10%, transparent)
  );
  border: 1px solid color-mix(in srgb, var(--sc) 55%, transparent);
  transition: filter 0.2s;
}
.sc2 .ci {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: var(--sc);
  color: #0b1a20;
  box-shadow: 0 6px 18px color-mix(in srgb, var(--sc) 40%, transparent);
}
.sc2 .ci ha-icon {
  --mdc-icon-size: 24px;
}
.sc2.run {
  filter: brightness(1.4);
}
`;

// ---------- Popups (fitas LED, ar condicionado e alertas) ----------
export const PAINEIS = `
.scrim {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(2, 8, 11, 0.6);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.sheet {
  width: min(560px, 100%);
  max-height: 88%;
  overflow: auto;
  border-radius: 26px 26px 0 0;
  background: linear-gradient(
    315deg,
    rgba(38, 72, 85, 0.98),
    rgba(15, 32, 45, 0.99)
  );
  border: 1px solid var(--line);
  border-bottom: 0;
  padding: 10px 16px calc(22px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.5);
  animation: up 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
}
@keyframes up {
  from {
    transform: translateY(40px);
    opacity: 0.4;
  }
  to {
    transform: none;
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .sheet {
    animation: none;
  }
}
.grab {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: var(--mute);
  margin: 0 auto 12px;
}
.sh {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.sh b {
  display: block;
  font-size: 19px;
  font-weight: 700;
}
.sh small {
  display: block;
  font-size: 12.5px;
  color: var(--dim);
}
.sh .x {
  margin-left: auto;
  color: var(--dim);
  font-size: 14px;
  padding: 6px 2px;
}
.pw {
  margin-left: auto;
  width: 54px;
  height: 32px;
  border-radius: 16px;
  background: #2d454c;
  position: relative;
  flex: none;
}
.pw::after {
  content: "";
  position: absolute;
  top: 4px;
  left: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
}
.pw.on {
  background: var(--cyan);
}
.pw.on::after {
  transform: translateX(22px);
}
.glow {
  height: 16px;
  border-radius: 8px;
  margin: 2px 0 14px;
  background: var(--c);
  box-shadow: 0 0 24px 4px color-mix(in srgb, var(--c) 55%, transparent);
}
.glow.off {
  background: #2a3d43;
  box-shadow: none;
}
.sg {
  margin-bottom: 14px;
}
.sg > label {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--mute);
  font-weight: 700;
  margin-bottom: 7px;
}
.sg > label em {
  font-style: normal;
  color: var(--fg);
  letter-spacing: 0;
  text-transform: none;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.tabs2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 3px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.25);
  margin-bottom: 12px;
}
.tabs2 button {
  height: 36px;
  border-radius: 9px;
  font-weight: 600;
  font-size: 13.5px;
  color: var(--dim);
}
.tabs2 button.on {
  background: var(--card2);
  color: var(--fg);
}
.pal {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 9px;
}
.pal.w5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
.pc {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--dim);
  min-width: 0;
}
.pc i {
  width: 100%;
  height: 40px;
  border-radius: 13px;
  background: var(--c);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}
.pc.on {
  color: var(--fg);
}
.pc.on i {
  box-shadow:
    0 0 0 2px #10242b,
    0 0 0 4px #fff,
    0 0 16px color-mix(in srgb, var(--c) 60%, transparent);
}
.note {
  font-size: 12px;
  color: var(--mute);
  margin: 8px 0 0;
}
.ctr {
  align-items: center;
  padding: 16px;
}
.ctr .sheet {
  border-radius: 24px;
  border-bottom: 1px solid var(--line);
  max-height: 86%;
  width: min(640px, 100%);
}
.ai {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 11px;
  border-radius: 16px;
  background: rgba(18, 43, 53, 0.9);
  border: 1px solid var(--line);
  margin-bottom: 8px;
}
.ai .ico {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex: none;
}
.ai .tx {
  flex: 1;
  min-width: 0;
}
.ai .tx b {
  display: block;
  font-size: 14.5px;
}
.ai .tx small {
  display: block;
  color: var(--dim);
  font-size: 12.5px;
}
.ai .abtn {
  padding: 9px 13px;
  font-size: 13px;
}
.ai .phys {
  font-size: 12px;
  color: var(--mute);
  text-align: right;
  max-width: 160px;
}
.ai.bad {
  border-color: rgba(248, 113, 113, 0.45);
}
.ai.bad .ico {
  background: rgba(248, 113, 113, 0.18);
  color: var(--bad);
}
.ai.warn {
  border-color: rgba(245, 184, 74, 0.4);
}
.ai.warn .ico {
  background: rgba(245, 184, 74, 0.16);
  color: var(--warn);
}
.ai.off .ico {
  background: rgba(255, 255, 255, 0.06);
  color: var(--dim);
}
.ai.info .ico {
  background: rgba(101, 216, 222, 0.12);
  color: var(--cyan);
}
.abtn {
  padding: 6px 10px;
  border-radius: 9px;
  background: var(--cyan);
  color: #06262b;
  font-weight: 700;
  font-size: 12px;
  white-space: nowrap;
}
.abtn.cf {
  background: var(--warn);
}
.allok {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ok);
  font-weight: 600;
  font-size: 14px;
  padding: 10px 0;
}
.sub {
  color: var(--dim);
  font-size: 13px;
  margin: -4px 0 12px;
}
`;
