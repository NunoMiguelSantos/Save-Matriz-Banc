# Máquina da louça (Home Assistant)

- `maquina-louca-card.js`: cartão próprio registado como recurso (módulo) no HA. Usa as entidades da integração Home Connect Alt (prefixo `405010538233010720`) e os helpers de custo por ciclo (`input_number.lavar_louca_*` e `counter.lavar_louca_ciclos_mes`). Mostra:
  - o estado, com anel de progresso, quanto falta e a hora de fim;
  - o botão principal, que muda com o estado;
  - os programas, as opções e o início diferido;
  - a previsão de energia e água, e os custos.
- Para usar: `type: custom:maquina-louca-card`. Para outra máquina, indica `prefix: <id>`.
- `vista-tablet-antiga-backup.json`: a vista `/dashboard-tablet/maquina-louca` como estava antes.
- `vista-telemovel-antiga-backup.json`: a vista `/dashboard-smartphone/maquina-louca` como estava antes. A nova tem o título, o `custom:maquina-louca-card`, o pop-up "Mais" e a barra de navegação.

## Início diferido (v1.2)

Com a máquina em standby, a máquina ignora o select de atraso da integração (`select.*_startinrelative`).

Por isso o atraso escolhido fica em `input_number.lavar_louca_atraso` (minutos). O botão "Agendar" chama `home_connect_alt.start_program` com o programa escolhido e a opção `BSH.Common.Option.StartInRelative`, em segundos. Sem atraso, "Iniciar" usa o botão Start da integração.

"Cancelar" usa `home_connect_alt.stop_program`.
