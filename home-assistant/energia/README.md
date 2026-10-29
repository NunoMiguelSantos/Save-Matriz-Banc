# Dashboard de energia (Home Assistant)

Cópia de segurança do que está instalado no Home Assistant.

- `energia-insights-card.js`: cartão próprio registado como recurso (módulo) no HA. Lê as estatísticas de longo prazo (`recorder/statistics_during_period`). Tem 5 modos: `resumo`, `ranking`, `maquinas`, `perfil` e `tendencia`.
- `vista-energia-sections.json`: secções da vista **Energia** (`/dashboard-smartphone/energypainel`).
- `vista-energia-antiga-backup.json`: a vista Energia como estava antes.

Helpers usados: `input_number.preco_energia`, `input_number.limite_consumo_base`, `sensor.geral_consumo_base_noite` e, por máquina, `input_boolean.*_em_ciclo`, `input_number.*_inicio_ciclo`, `input_number.*_ultimo_ciclo`, `input_number.*_kwh_ciclos_mes` e `counter.*_ciclos_mes`.

## Fatura (v1.1)

O modo `resumo` calcula o valor a pagar por ciclo de faturação (dia 22 a 22), com a tarifa da Iberdrola (Plano Exclusivo B):

- energia a 0,1462 €/kWh e potência a 0,7526 €/dia, sem IVA;
- desconto de 2%, mais 5% até 22/12/2026;
- IEC, contribuição audiovisual e IVA a 6% nos primeiros 200 kWh por 30 dias, 23% no resto.

Com a fatura de 22/09 a 22/10 (263 kWh), a fórmula dá exatamente os 68,53 € faturados.

A tarifa altera-se com a chave `tarifa:` no cartão. `input_number.ajuste_medicao_geral` (kWh/dia) corrige a medição a menos do Shelly do contador geral. Calibrei-o com a fatura: 263 − 218,5 kWh em 30 dias dá 1,48 kWh/dia.

## Tablet

- `vista-energia-tablet-cards.json`: cartões da vista **Energia** do tablet (`/dashboard-tablet/energypainel`). São 3 colunas com `layout-card`: Fatura, perfil e 12 meses; ranking; máquinas e clima. Passam a 2 colunas abaixo de 1100 px e a 1 coluna abaixo de 700 px.
- `vista-energia-tablet-antiga-backup.json`: a vista do tablet como estava antes.
