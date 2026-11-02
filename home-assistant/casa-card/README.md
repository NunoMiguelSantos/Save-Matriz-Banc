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

## Alarme e portão (recurso `?v=5`)

- Telemóvel: ao lado das bolinhas das pessoas há dois ícones redondos, só com o símbolo.
  - Escudo do alarme: vermelho quando armado; toca para abrir o alarme.
  - Portão: vermelho e aberto quando está aberto; toca e abre uma janela a perguntar "Queres abrir/fechar o portão?" com "Sim" e "Cancelar". O "Sim" carrega no mesmo interruptor da Garagem.
  - No painel "Casa toda" do telemóvel já não aparecem os botões do alarme e do portão.
- Tablet: tudo onde estava (botão "Armado/Desarmado" no topo e os botões do alarme e do portão no painel "Casa toda"). Só o botão do portão mudou: abre a mesma janela de confirmação, em vez de ir para a Garagem.
- Código: `_topIcons()` e o painel `kind: "gate"` no `casa-card.js`; classe `.ico2` no `estilos.js`.

## Menu do alarme (recurso `?v=6`)

Janela própria para o Alarmo (`alarm_control_panel.alarmo`), em vez do ecrã nativo do HA:

- Em cima, o estado com a cor certa: desarmado (verde), em casa (azul), ausente (vermelho), a armar / entrada detetada (amarelo, a pulsar) e disparado (vermelho, a pulsar). Enquanto arma, mostra os segundos que faltam.
- Três botões: **Desarmar**, **Em casa** e **Ausente** (`alarm_disarm`, `alarm_arm_home`, `alarm_arm_away`). O modo atual tem um ✓. O Alarmo não pede código.
- Se o Alarmo não armar por haver sensores abertos, aparece um aviso com os nomes.
- "Mais detalhes ›" abre o ecrã nativo.
- Abre a partir do escudo no topo do telemóvel e dos dois botões do alarme no tablet (o do topo e o do painel "Casa toda").
- Trocas aplicadas: `alarme-trocas.json`.

## Meteorologia (casa-card ?v=7)

- No topo do ecrã Casa (telemóvel: ao lado da data; tablet: em cima à esquerda, a seguir à data) o tempo passou a ser um botão. Tocar abre a janela "Meteorologia": agora (temperatura, céu, máx./mín., humidade, vento, chuva hoje, pressão), próximas 24 horas (curva da temperatura, ícone e chuva em mm, a deslizar para o lado) e próximos 10 dias (máx./mín. e probabilidade de chuva).
- Novas opções do cartão: `weather_days` (entidade para a previsão por dias; usa `weather` se faltar) e `weather_name` (nome no topo da janela). Nos dois painéis: `weather: weather.home` (met.no, horas), `weather_days: weather.leiria` (IPMA, dias), `weather_name: Leiria`.
- As previsões são pedidas ao HA (`weather.get_forecasts`) quando a janela abre e ficam guardadas 10 minutos.
- As trocas aplicadas ao `casa-card.js` estão em `meteorologia-trocas.json` (serviço `pyscript.trocar_texto_ficheiro`).
