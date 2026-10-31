# Caldeira e aquecimento por divisões (Home Assistant)

- `aquecimento-card.js`: cartão próprio, instalado em `/config/www/cartoes/aquecimento-card.js` e registado como recurso `/local/cartoes/aquecimento-card.js?v=1` (módulo).
  - `layout: telemovel`: uma coluna com barra de estado, Auto / Manual / Forçar, Semana e Divisões.
  - `layout: tablet`: faixa em cima (estado com os botões de modo + mínima de conforto) e duas colunas (Semana | Divisões).
  - Usa os helpers do sistema "Aquecimento por divisões": `switch.caldeira_caldeira`, `input_boolean.cald_auto_mode`, `input_boolean.cald_force_override`, `input_number.cald_temp_setpoint_conforto`, `sensor.temperatura_media_da_casa`, `aq_<divisão>_setpoint` / `_pede_calor` e `aq_cen1…6_*` (ativo, a_decorrer, nome, início, fim, dias e divisões).
  - O "alvo" de cada divisão segue a regra da `ZonaAquecimento`: setpoint da divisão se estiver num cenário a decorrer, senão a mínima de conforto (nunca abaixo dela).
  - Tocar num bloco da semana ou num cenário abre o editor (nome, ligado, horário, dias, divisões). O gesto de voltar fecha-o (`#aquecimento-cenario`).
- `copiar_vista.py`: serviço pyscript `pyscript.copiar_vista_dashboard`, instalado em `/config/pyscript/`. Copia uma vista de um dashboard para outro dentro do HA, sem apagar a original.
- `vista-telemovel-antiga-backup.json` e `vista-tablet-antiga-backup.json`: as vistas `aquecimento` como estavam antes.

## O que mudou no HA

- Telemóvel: a vista `/dashboard-smartphone/aquecimento` foi substituída por `/dashboard-smartphone/caldeira` (cartão + barra de navegação). As 8 barras de navegação apontam para a nova.
- Tablet: a vista `/dashboard-tablet/aquecimento` foi substituída por `/dashboard-tablet/caldeira`. As 9 barras de navegação apontam para a nova.
- As vistas antigas foram copiadas para o dashboard **Saves**: `tlm-aquecimento-antigo` e `tablet-aquecimento-antigo` (iguais às cópias deste repositório).

## Mudar o cartão

Depois de gravar `aquecimento-card.js`, sobe a versão do recurso (`?v=2`, …) em Definições → Painéis → ⋮ → Recursos. As cores estão no topo do ficheiro (`AQ` e `AQ_CORES`). As divisões e os nomes podem ir no YAML do cartão (`divisoes:`), que ganha ao ficheiro.
