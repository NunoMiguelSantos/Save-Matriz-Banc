# Robô de limpeza (Home Assistant)

- `aspirador-card.js`: cartão próprio registado como recurso (módulo) no HA, para o robô Dreame `vacuum.vaccuminator`.
  - `parte: controlo`: estado, botões que mudam com o estado, Casa toda/Divisões e modo (aspirar/esfregar, potência, humidade).
  - `parte: info`: manutenção com "Já troquei", depósitos da base, limpeza automática e estatísticas.
- O botão Iniciar mantém o comportamento original:
  - com `input_boolean.mod_total_or_area` desligado, chama `vacuum.start`;
  - ligado, corre `script.vaccuminator_segments` com as divisões `input_boolean.vacuum_area_*`.
- As definições avançadas (mopa, secagem, tapetes, rota, bloqueio) passaram para o pop-up `#definicoes-robo`.
- `vista-tablet-antiga-backup.json`: a vista `/dashboard-tablet/vacuum` como estava antes.

Alertas (automações): "Robô - Limpeza terminada", "Robô - Alerta erro ou pouca água" e "Robô - Peças a acabar" (abaixo de 10%).
- `vista-telemovel-antiga-backup.json`: a vista `/dashboard-smartphone/vacuum` como estava antes. A nova tem uma coluna: cabeçalho, controlo, mapa, informação, pop-up de definições, pop-up "Mais" e barra de navegação.

A automação "Limpeza Vaccuminator Automatic_V2" passou a notificar com `script.notificar_todos_os_telemoveis`, em vez de `notify.mobile_app_mary_tlm`, que já não existe.
Os três alertas do robô também notificam com `script.notificar_todos_os_telemoveis`.
