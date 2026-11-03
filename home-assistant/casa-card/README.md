# Ecrã principal (casa-card) – histórico de temperatura e humidade (recurso `?v=9`)

`casa-card.js` nesta pasta é a cópia completa de `/config/www/casa-card/casa-card.js` (versão 2.1.0).
O `casa-card.js.bak` no HA é a versão anterior (2.0.0, `?v=8`).

## O que faz

- No painel "Casa", o texto "21,4° média" (sublinhado) abre uma janela que sobe de baixo.
- Fecha ao tocar fora, ao arrastar a pega para baixo ou com Esc.
- Chips: Casa + Sala, Cozinha, Suite, Quarto 2, Gaming room, WC geral, WC suite. Abre sempre em Casa / temperatura / Dia / hoje; ao trocar de chip mantém o período, o modo e a data.
- Temperatura / humidade nos dois ícones. Na Casa, a temperatura vem de `sensor.temperatura_media_da_casa` e a humidade é a média das divisões.
- Valor atual + tendência da última hora (estatísticas de 5 min).
- Dia (barras de 3 h), Semana e Mês (barras por dia), Ano (barras por mês). Campo de data para escolher o período.
- Gráfico em SVG: barra mín–máx + linha branca da média. Tocar numa barra mostra os valores.
- Caixas: Média do período, Mínima e Máxima com dia/hora.
- Dados: `recorder/statistics_during_period` (hora para Dia/Semana/Mês, dia para Ano), pedidos só quando a janela abre ou muda.

## Opções novas no YAML do cartão (opcionais)

- `history_avg`: sensor da média da casa (por omissão `sensor.temperatura_media_da_casa`). O "21,4° média" passa a mostrar este sensor.
- `history_rooms`: lista `{id, name, t, h}` para mudar as divisões (por omissão `HIST_ROOMS` no ficheiro).

## Sensores

Todos têm `state_class: measurement`. O `sensor.esp_th_suite_temperatura` não tinha: acrescentei `device_class: temperature` e `state_class: measurement` no `esphome/esp-th-suite.yaml` e fiz o update por OTA a 3 nov 2026. O histórico da temperatura da Suite só existe a partir dessa data.

Trocas aplicadas com `pyscript.trocar_texto_ficheiro`: `historico-trocas.json`.
