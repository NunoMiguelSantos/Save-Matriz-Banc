# Ecrã principal (casa-card) – histórico de temperatura e humidade (recurso `?v=19`)

`casa-card.js` e `estilos.js` nesta pasta são as cópias completas de `/config/www/casa-card/` (versão 2.5.2).
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

## Tempo no topo quando o met.no falha (?v=11)

O tempo do topo e a janela da meteorologia usam `weather` (met.no, `weather.home`). Se estiver `unavailable`/`unknown`, o cartão passa sozinho para `weather_days` (IPMA, `weather.leiria`) e volta ao met.no quando este recuperar. Trocas: `meteo-ipma-trocas.json`.

## Só IPMA (?v=12)

No YAML do cartão (telemóvel e tablet) `weather` passou de `weather.home` (met.no) para `weather.leiria` (IPMA); `weather_days` já era `weather.leiria`. O IPMA manda `precipitation_probability: -99` nas horas sem valor: o cartão mostra essas horas sem percentagem. Trocas: `meteo-ipma-99-trocas.json`.

## "Ligado agora" com botões (?v=13)

Em cada divisão: o nome (com ›) abre a divisão; o botão amarelo "N luzes ✕" apaga todas as luzes dessa divisão; o botão do AC desliga o AC ao 2.º toque (o 1.º mostra "Desligar?" durante 4 s). Aquecimento e ventilação são só informação. Telemóvel e tablet. Trocas: `ligado-agora-trocas.json` (casa-card.js) e `ligado-agora-estilos-trocas.json` (estilos.js); o `estilos.js.bak` no HA é a versão anterior.

## Cenários no telemóvel (?v=14)

O sino do topo do telemóvel deu lugar a um botão com uma paleta (`mdi:palette-outline`) que abre a janela "Cenários": os mesmos `scenes` do YAML do cartão (Sair de casa, Rotina dos estores, Dormir). Um toque ativa; mostra "Ativado ✓" 3 s e, nos scripts, "A correr…" enquanto correm. Cada cenário aceita `desc` (texto pequeno por baixo do nome). Trocas: `cenarios-trocas.json`.

## Calendário (?v=15)

No telemóvel e no tablet, a data do topo passou a botão (ícone de calendário) que abre a janela "Calendário": mês com ‹ › e "Hoje", pontinhos nos dias com eventos, e por baixo os eventos do dia escolhido (hora ou "Dia todo", título, local). Usa `calendar.get_events` só com a janela aberta (guardado 5 min). Mostra todos os `calendar.*` do HA; para escolher, pôr no YAML `calendars: [{entity, name, color}]`. A 6 nov 2026 só havia o `calendar.calendariolocal`, vazio: falta ligar o Google Calendar com a integração "Calendário remoto" (endereço secreto iCal). Trocas: `calendario-trocas.json`.

## Topo do telemóvel numa linha (?v=16)

Tempo e data ficam sempre na mesma linha (`estilos.js`: `.top .g small` sem quebra). O escudo do alarme saiu do topo do telemóvel com a opção nova `top_alarm: false` no YAML do cartão do telemóvel (pôr `true` ou apagar a linha para voltar). Trocas: `topo-trocas.json` e `topo-estilos-trocas.json`.

## Pessoas (?v=17)

Tocar nas fotos do topo (telemóvel e tablet) abre a janela "Pessoas": cartão de mapa do próprio HA (criado com `loadCardHelpers`, modo escuro, pessoas + `zone.home`) e uma linha por pessoa com "Em casa"/"Fora"/nome da zona, desde quando e, para quem está fora, a distância em linha reta a casa (m ou km). Trocas: `pessoas-trocas.json`.

### Correção do mapa (?v=18)

O mapa aparecia vazio (só os botões de zoom): o cartão passa a pedir ao mapa para recalcular o tamanho e centrar-se nas pessoas depois de a janela abrir (`default_zoom: 15`). Trocas: `pessoas-mapa-trocas.json`.

### Mapa próprio (?v=19)

O cartão de mapa do HA continuava vazio dentro da janela. Passou a ser um mapa desenhado pelo cartão, sem bibliotecas: mosaicos escuros da CARTO (os mesmos do mapa do HA; se falharem, OpenStreetMap escurecido), zona de casa e fotos por cima, zoom automático para caberem todos e botões +/−. Trocas: `pessoas-mapa2-trocas.json`.
