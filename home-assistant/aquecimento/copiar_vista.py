# Copiar para /config/pyscript/copiar_vista.py
# Precisa do pyscript com "Access hass as a global variable" (hass_is_global) ligado.
# Copia uma vista de um dashboard para outro (por exemplo para o dashboard "Saves"), dentro do Home Assistant.
# Não apaga nada: a vista original fica onde está.
import json


@service
async def copiar_vista_dashboard(origem=None, vista=None, destino=None, novo_caminho=None, novo_titulo=None):
    """yaml
name: Copiar vista de dashboard
description: Copia uma vista (pelo caminho) de um dashboard para outro, com novo caminho e título.
fields:
  origem:
    name: Dashboard de origem
    description: url_path do dashboard de origem
    required: true
    example: dashboard-smartphone
    selector:
      text:
  vista:
    name: Vista
    description: Caminho (path) da vista a copiar
    required: true
    example: aquecimento
    selector:
      text:
  destino:
    name: Dashboard de destino
    description: url_path do dashboard de destino
    required: true
    example: dashboard-saves
    selector:
      text:
  novo_caminho:
    name: Novo caminho
    description: Caminho da cópia no destino (tem de ser novo)
    required: true
    example: tlm-aquecimento-antigo
    selector:
      text:
  novo_titulo:
    name: Novo título
    description: Título da cópia no destino
    required: false
    selector:
      text:
"""
    if not (origem and vista and destino and novo_caminho):
        log.warning("copiar_vista_dashboard: faltam campos")
        return
    ld = hass.data.get("lovelace")
    dashes = getattr(ld, "dashboards", None)
    if dashes is None:
        dashes = ld["dashboards"]
    if origem not in dashes or destino not in dashes:
        log.warning(f"copiar_vista_dashboard: dashboard não encontrado ({origem} / {destino})")
        return
    cfg_o = await dashes[origem].async_load(False)
    cfg_d = await dashes[destino].async_load(False)
    encontradas = [v for v in cfg_o.get("views", []) if v.get("path") == vista]
    if not encontradas:
        log.warning(f"copiar_vista_dashboard: vista '{vista}' não existe em {origem}")
        return
    if [v for v in cfg_d.get("views", []) if v.get("path") == novo_caminho]:
        log.warning(f"copiar_vista_dashboard: já existe '{novo_caminho}' em {destino}; nada foi copiado")
        return
    copia = json.loads(json.dumps(encontradas[0]))
    copia["path"] = novo_caminho
    if novo_titulo:
        copia["title"] = novo_titulo
    novo = json.loads(json.dumps(cfg_d))
    novo["views"] = list(novo.get("views", [])) + [copia]
    await dashes[destino].async_save(novo)
    log.info(f"copiar_vista_dashboard: {origem}/{vista} copiada para {destino}/{novo_caminho}")
