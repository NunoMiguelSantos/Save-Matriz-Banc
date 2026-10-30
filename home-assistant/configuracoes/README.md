# Ecrã de Configurações (telemóvel)

- `sistema-card.js`: cartão próprio registado como recurso (módulo) no HA. Tem cinco modos:
  - `estado`: versão e atualizações, backup, automações desligadas e baterias;
  - `automacoes`: grupos configuráveis e uma lista automática "Outras desligadas";
  - `baterias`: mostra só as que estão abaixo de 30% ou sem sinal, com opção "Ver todas";
  - `servidor`: reiniciar o HA ou o servidor e desligar, com confirmação por segundo toque. Só aparece para os utilizadores autorizados;
  - `tablet`: ecrã, reiniciar navegador e reiniciar tablet.
- `vista-telemovel-antiga-backup.json`: a vista `/dashboard-smartphone/configs` como estava antes.

Correção: o botão "Sensor de Movimento" da WC Suite apontava para a automação da Cozinha e foi retirado, porque não existe automação de movimento para a WC Suite.

Alertas novos: "Sistema - Bateria fraca" (abaixo de 15%) e "Sistema - Backup falhou ou atrasado", enviados para o OnePlus 12.
