# Ecrã de Configurações

- `sistema-card.js` v1.1 (instalado em `/config/www/cartoes/sistema-card.js`, recurso `?v=2`):
  - `mode: automacoes` aceita `recolhido: true`: o cartão fica fechado e abre ao tocar no título, que mostra quantas automações estão na lista e quantas estão desligadas;
  - `mode: tablet` aceita `brilho` e `protetor` (entidades `number.*`): o brilho tem uma barra deslizante e o protetor de ecrã tem −/+, dentro da mesma bolha dos botões do tablet.

## Ordem nova

- Telemóvel: Estado do sistema → Servidor → Tablet (com brilho e protetor) → Baterias → Automações (fechadas).
- Tablet: coluna 1 com Estado, Servidor e Tablet; coluna 2 com Baterias; coluna 3 com Automações (fechadas).
- Os cartões "Brilho do ecrã" e "Protetor de ecrã" à parte foram retirados, porque passaram para dentro do cartão do tablet.
- O cenário dos estores ("Rotina dos estores" e o pop-up `#ConfigEstoresCenario1`) passou das Configurações para a página Estores, no telemóvel e no tablet.

## v1.2: acesso remoto do convidado

- `mode: servidor` aceita `acesso_remoto` (input_boolean usado pela automação "Acesso remoto (Convidado)") e `acesso_horas` (para mostrar a hora a que desliga sozinho). Aparece um botão "Acesso remoto do convidado" por cima dos botões do servidor.
- Esta função tinha sido acrescentada no HA por cima de uma cópia antiga (v1.0), sem mudar o `?v=` do recurso. Por isso só aparecia nos aparelhos sem a cópia guardada em cache (o telemóvel); o PC e o tablet continuavam com a versão antiga. Além disso, essa cópia tinha perdido o brilho/protetor do tablet e as automações recolhíveis. Juntei as duas versões e o recurso passou a `?v=3`.
