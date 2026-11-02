# Caldeira e aquecimento por divisões (Home Assistant)

- `aquecimento-card.js`: cartão próprio, instalado em `/config/www/cartoes/aquecimento-card.js` e registado como recurso `/local/cartoes/aquecimento-card.js?v=2` (módulo).
  - `layout: telemovel`: uma coluna com barra de estado, Auto / Manual / Forçar, Semana e Divisões.
  - `layout: tablet`: faixa em cima (estado com os botões de modo + cartão "Como funciona") e duas colunas (Semana | Divisões).
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

## Ajustes seguintes (barras e Energia)

- Tablet: a barra de navegação deixou de ter "Mais" (reticências). Mostra tudo: Casa, Energia, Estores, Caldeira, Máquina da Louça, Aspirador, Música, Configurações e Programador. Na vista Exterior faltava a Máquina da Louça e foi acrescentada.
- Telemóvel: na barra, Estores passou para o lugar da Energia, e a Energia passou para o menu "Mais" (no lugar dos Estores).
- Energia (telemóvel e tablet): cartão "Potência agora (casa toda)" com `sensor.geral_power` e a curva das últimas 6 horas, logo a seguir ao título.
- Ecrã principal (telemóvel e tablet): o aviso "Consumo base alto" foi retirado. Tirei `base_power` e `base_limit` de `alerts` no `custom:casa-tlm-card`; o cartão não foi alterado. Para voltar a ter o aviso, repor `base_power: sensor.geral_consumo_base_noite` e `base_limit: input_number.limite_consumo_base`. A notificação das 05h00 (automação "Energia - Alerta Consumo Base Elevado") continua igual.

## Regras do aquecimento (v1.1)

- O cartão "Mínima de conforto" e o cartão "Histerese das zonas" foram juntos num só, "Como funciona" (tablet: em cima à direita; telemóvel: dentro de Divisões). Mostra duas frases que mudam com os valores:
  - "Fora dos cenários, nenhuma divisão desce abaixo de X°." (`input_number.cald_temp_setpoint_conforto`)
  - "Cada divisão pede calor Y° abaixo do alvo e deixa de pedir Z° acima." (`input_number.cald_offset_inferior` / `cald_offset_superior`)
- O botão **Ajustar** abre a janela "Regras do aquecimento" com −/+ para os três valores e um exemplo (régua) que mostra a que temperatura a divisão começa a pedir calor e quando pára. O alvo do exemplo muda com −/+ e não mexe em nada no HA.
- O cartão antigo "Histerese das zonas" (stack-in-card) foi retirado das vistas Caldeira do telemóvel e do tablet.
