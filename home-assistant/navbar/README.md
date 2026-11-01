# Barra de navegação (navbar-card)

Continua a ser o `custom:navbar-card` do HACS. Os templates JavaScript dos pontos de estado estão em `templates-pontos.json`.

## Pontos de estado (`badge` de cada botão)

- **Casa:** número de avisos do ecrã principal, com as mesmas regras do `casa-tlm-card` (água na caldeira, robô, portão, humidade nos WC, peças do robô, consumo não identificado, frigorífico, pilhas, backup, sensores sem sinal, porta da louça). Vermelho se houver algum urgente, amarelo se houver de atenção, azul se só houver informação.
- **Estores:** quantos dos 8 estores estão abertos.
- **Aspirador:** ponto verde a piscar enquanto limpa, vermelho com erro, amarelo com pouca água ou peça abaixo de 10%.
- **Louça:** ponto com os minutos que faltam (`..._remainingprogramtime`) enquanto `..._operationstate` termina em `Run`, `DelayedStart` ou `Pause`.
- **Energia (só tablet):** ponto amarelo quando `sensor.potencia_nao_identificada` passa de 800 W.

Se mudares as regras dos avisos no `casa-card.js`, muda também o template da Casa aqui.

## Telemóvel

- Ordem: Casa, Estores, Caldeira, Aspirador, Louça (escondida com `hidden` quando não está a lavar), Mais.
- O menu "Mais" só mostra a Máquina da Louça quando ela não está na barra.
- Cores dos botões: as quatro primeiras por posição; a Louça é `nth-child(5 of .route)` quando não é o último; o "Mais" é sempre o último (`nth-last-child(1 of .route)`).

## Tablet

- Ordem: Casa, Energia, Estores, Caldeira, Louça, Aspirador | Música, Configurações.
- Nomes por baixo dos ícones (`desktop.show_labels: true` e CSS).
- Música e Configurações mais pequenas, com uma linha a separar.
- O botão Programador saiu da barra. Carregar sem largar em Configurações (`hold_action`) liga ou desliga `input_boolean.kisk_mode`.
