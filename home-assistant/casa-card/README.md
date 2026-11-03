# Ecrã principal (casa-card) – histórico de temperatura e humidade (recurso `?v=10`)

`casa-card.js` nesta pasta é a cópia completa de `/config/www/casa-card/casa-card.js` (versão 2.1.1).
O `casa-card.js.bak` no HA é a versão anterior (2.0.0, `?v=8`).

## O que faz

- No painel "Casa", o texto "21,4° média" (sublinhado) abre uma janela que sobe de baixo.
- Fecha ao tocar fora, ao arrastar a pega para baixo ou com Esc.
- Chips: Casa + Sala, Cozinha, Suite, Quarto 2, Gaming room, WC geral, WC suite. Abre sempre em Casa / temperatura / Dia / hoje; ao trocar de chip mantém o período, o modo e a data.
- Temperatura / humidade nos dois ícones. Na Casa, a temperatura vem de `sensor.temperatura_media_da_casa` e a humidade é a média das divisões.
- Valor atual + tendência da última hora (estatísticas de 5 min).
- Dia (barras de 3 h), Semana e Mês (barras por dia), Ano (barras por mês). Campo de data para escolher o período.
- Gráfico de linha simples (SVG), um ponto por valor guardado: Dia de 5 em 5 min (últimos 9 dias; antes disso de hora a hora), Semana e Mês de hora a hora, Ano um por dia. Tocar no gráfico mostra o valor e a hora do ponto mais perto.
- Caixas: Média do período, Mínima e Máxima (dos pontos do gráfico) com dia/hora.
- Dados: `recorder/statistics_during_period` (média de cada intervalo), pedidos só quando a janela abre ou muda.

## Opções novas no YAML do cartão (opcionais)

- `history_avg`: sensor da média da casa (por omissão `sensor.temperatura_media_da_casa`). O "21,4° média" passa a mostrar este sensor.
- `history_rooms`: lista `{id, name, t, h}` para mudar as divisões (por omissão `HIST_ROOMS` no ficheiro).

## Sensores

Todos têm `state_class: measurement`. O `sensor.esp_th_suite_temperatura` não tinha: acrescentei `device_class: temperature` e `state_class: measurement` no `esphome/esp-th-suite.yaml` e fiz o update por OTA a 3 nov 2026. O histórico da temperatura da Suite só existe a partir dessa data.

Trocas aplicadas com `pyscript.trocar_texto_ficheiro`, por ordem: `historico-trocas.json` (?v=9) e `grafico-linha-trocas.json` (?v=10, gráfico de linha). O `casa-card.js.bak` no HA passou a ser a versão ?v=9.
