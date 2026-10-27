# Copiar para /config/pyscript/acesso_utilizadores.py
# Precisa do pyscript configurado com "Access hass as a global variable" (hass_is_global) ligado.


@service
async def acesso_local_utilizador(username=None, local_only=True):
    """yaml
name: Acesso só local (utilizador)
description: Liga/desliga a opção "Local access only" de um utilizador do Home Assistant.
fields:
  username:
    name: Username
    description: Username de login (ex. mqtt)
    required: true
    example: mqtt
    selector:
      text:
  local_only:
    name: Só rede local
    description: Ligado = só pode entrar a partir da rede local. Desligado = também de fora.
    required: true
    selector:
      boolean:
"""
    if not username:
        log.warning("acesso_local_utilizador: falta o username")
        return
    users = await hass.auth.async_get_users()
    for user in users:
        logins = [c.data.get("username") for c in user.credentials if c.auth_provider_type == "homeassistant"]
        if username in logins:
            await hass.auth.async_update_user(user, local_only=bool(local_only))
            log.info(f"acesso_local_utilizador: '{username}' local_only={bool(local_only)}")
            return
    log.warning(f"acesso_local_utilizador: utilizador '{username}' não encontrado")
