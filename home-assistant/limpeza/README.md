# Limpeza de integrações sem uso (5 nov 2026)

## Met.no (`weather.home`)
- Integração "Meteorologisk institutt (Met.no)", criada automaticamente na instalação do HA (origem "onboarding", nome "Home").
- Já nada a usava (o casa-card passou para o IPMA, `weather.leiria`). Removida em Definições → Dispositivos e serviços.
- Para voltar a ter: adicionar a integração Met.no outra vez.

## Sensor REST "Sun Costume" (Open-Meteo)
- Estava em `/config/Automacoes/Entidades/Sensores.yaml` (incluído como `sensor:` no `configuration.yaml`), com coordenadas de Lisboa.
- Não era usado por automações, scripts, cenas, blueprints, templates nem dashboards.
- Os estores (blueprint `CoverAutomatic_v4`) usam `sensor.estores_nascer_sol_do_dia` e `sensor.estores_por_sol_do_dia`, que vêm do `sun.sun` (integração Sol), não do REST.
- `Sensores.yaml` ficou só com `[]` e um comentário; a versão anterior está no HA em `Sensores.yaml.bak` e aqui em `Sensores.yaml.antes`.
- `rest.reload` feito e removidas do registo as entidades `sensor.sun_costume` e `sensor.sun_costumep` (esta já estava indisponível, resto de uma versão antiga).
