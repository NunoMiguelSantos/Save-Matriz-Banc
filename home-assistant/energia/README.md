# Dashboard de energia (Home Assistant)

Cópia de segurança do que está instalado no Home Assistant.

- `energia-insights-card.js`: cartão próprio registado como recurso (módulo) no HA. Lê as estatísticas de longo prazo (`recorder/statistics_during_period`). Tem 5 modos: `resumo`, `ranking`, `maquinas`, `perfil` e `tendencia`.
- `vista-energia-sections.json`: secções da vista **Energia** (`/dashboard-smartphone/energypainel`).
- `vista-energia-antiga-backup.json`: a vista Energia como estava antes.

Helpers usados: `input_number.preco_energia`, `input_number.limite_consumo_base`, `sensor.geral_consumo_base_noite` e, por máquina, `input_boolean.*_em_ciclo`, `input_number.*_inicio_ciclo`, `input_number.*_ultimo_ciclo`, `input_number.*_kwh_ciclos_mes` e `counter.*_ciclos_mes`.
