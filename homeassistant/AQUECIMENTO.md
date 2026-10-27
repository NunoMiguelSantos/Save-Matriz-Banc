# Aquecimento por divisões

Sistema novo, ao lado do antigo (`ControloCaldeira_v2` + `ControloSetpoint`, que ficam como estão).

## Como funciona

```
Cenário (6x)  ──► Aq CenN A Decorrer ─┐
Vistos (Aq CenN <Divisão>) ───────────┼─► Zona (7x) ──► Aq <Divisão> Pede Calor ─► Caldeira Simples ─► switch.caldeira_caldeira
Setpoint da divisão / mínima conforto ┘
```

| Blueprint | Automações | O que faz |
|---|---|---|
| `CenarioAquecimento.yaml` | Aquecimento - Cenário 1…6 | Liga `aq_cenN_a_decorrer` quando o cenário está ativo, no dia e entre início/fim (aceita passar a meia-noite). |
| `ZonaAquecimento.yaml` | Aquecimento - Zona <divisão> (7) | Alvo = setpoint da divisão se estiver marcada num cenário a decorrer; senão a mínima de conforto (nunca abaixo dela). Histerese com `cald_offset_inferior/superior`. Liga/desliga `aq_<divisão>_pede_calor`. |
| `CaldeiraSimples.yaml` | Aquecimento - Caldeira Simples (**criada desligada**) | Segurança máx. → desliga; Forçar → liga; Automático off → desliga; alguma divisão pede calor → liga; senão desliga. |

## Para passar para o sistema novo

1. Desligar `automation.controlo_caldeira` e `automation.so_setpoint_caldeira`.
2. Ligar `automation.aquecimento_caldeira_simples`.

Para voltar atrás é fazer o inverso.

## Acrescentar divisões / cenários

- **Divisão nova:** criar `input_number.aq_<x>_setpoint`, `input_boolean.aq_<x>_pede_calor` e um visto por cenário `input_boolean.aq_cenN_<x>`; criar mais uma automação a partir de `ZonaAquecimento`; acrescentar o "Pede Calor" à lista da Caldeira Simples.
- **Cenário novo:** criar os helpers `aq_cen7_*`, uma automação a partir de `CenarioAquecimento` e acrescentar `aq_cen7_a_decorrer` + o visto de cada divisão às listas das Zonas (mesma ordem).

## Dashboard

Vista `dashboard-smartphone/aquecimento` (cópia em `dashboards/smartphone_view_aquecimento.yaml`).

## Painel principal

- `binary_sensor.aq_sistema_ativo` (Template helper): ligado só quando `input_boolean.cald_auto_mode` está on **e** `automation.aquecimento_caldeira_simples` está ligada.
- Nos cartões das divisões da vista `smartphone-v3`, o primeiro sub-botão é uma chama (`mdi:fire`) que fica laranja e a pulsar quando `aq_<divisão>_pede_calor` está on **e** o sistema está ativo; caso contrário fica transparente (não mexe no layout).
