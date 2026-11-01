# Ecrã principal (casa-card) – fitas LED RGBW

As fitas Shelly RGBW (Sala `light.fita_sala` e Suite `light.rgbw_suite`) têm o branco num canal próprio (4.º número de `rgbw_color`, 0–255). A "Intensidade" (brilho geral do HA) só mexe nas cores.

Estado atual de `/config/www/casa-card/casa-card.js` (recurso `?v=3`):

- **Intensidade:** igual ao original (brilho geral).
- **Branco:** barra nova que só aparece numa fita RGBW com um branco escolhido. Mostra o valor lido do canal branco (0–100 %) e muda só esse canal, mantendo as cores do branco escolhido.
- O cartão passou a redesenhar-se também quando muda só o `rgbw_color`, que era o motivo de a barra não acompanhar o valor real.
- O branco escolhido é reconhecido comparando só as três cores, porque o canal branco pode estar mais baixo do que na predefinição.

Trocas aplicadas com `pyscript.trocar_texto_ficheiro`, por ordem: `fitas-rgbw-trocas.json` e depois `fitas-rgbw-trocas-2.json`. O `casa-card.js.bak` no HA é a versão entre as duas.

## Brancos e cores (no dashboard, não no ficheiro)

Ecrã principal → Editar painel → cartão da Casa → editor YAML → `led_whites` e `led_colors`. O telemóvel e o tablet têm cada um a sua cópia.

Em cada branco, o 4.º número de `rgbw` é o brilho com que esse branco liga (0–255). Exemplo do mais fraco ao mais forte:

```yaml
led_whites:
  - { name: Vela,    color: "#ff9a3c", kelvin: 2000, rgbw: [255, 60, 0, 10] }
  - { name: Quente,  color: "#ffbf73", kelvin: 2700, rgbw: [255, 100, 0, 60] }
  - { name: Natural, color: "#ffe1bd", kelvin: 4000, rgbw: [0, 0, 0, 120] }
  - { name: Dia,     color: "#fff1e3", kelvin: 5000, rgbw: [0, 15, 40, 190] }
  - { name: Frio,    color: "#e9f0ff", kelvin: 6500, rgbw: [0, 60, 140, 255] }
```
