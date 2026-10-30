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

## Tablet

`/dashboard-tablet/configs` usa o mesmo cartão em 3 colunas:

| Esquerda | Centro | Direita |
|---|---|---|
| estado, servidor (só utilizadores autorizados), tablet, brilho e protetor de ecrã | automações | baterias e cenários |

A vista antiga está em `vista-tablet-antiga-backup.json`.

Os alertas "Sistema - Bateria fraca" e "Sistema - Backup falhou ou atrasado" passaram a usar `script.notificar_todos_os_telemoveis`.
No telemóvel, a legenda dos cenários passou para uma linha a toda a largura, porque não cabia ao lado do ícone.
