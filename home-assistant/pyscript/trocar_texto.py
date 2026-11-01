# Copiar para /config/pyscript/trocar_texto.py
# Precisa do pyscript configurado. Troca trechos de texto num ficheiro de /config/www, sem reenviar o ficheiro inteiro.
# Antes de gravar, guarda a versão anterior em <ficheiro>.bak. Se algum trecho não aparecer exatamente uma vez, não muda nada.


@pyscript_executor
def _ler(caminho):
    with open(caminho, encoding="utf-8") as f:
        return f.read()


@pyscript_executor
def _gravar(caminho, texto):
    with open(caminho, "w", encoding="utf-8") as f:
        f.write(texto)


@service
def trocar_texto_ficheiro(ficheiro=None, trocas=None):
    """yaml
name: Trocar texto num ficheiro
description: Troca trechos de texto num ficheiro de /config/www. Guarda antes uma cópia .bak. Cada trecho tem de aparecer exatamente uma vez.
fields:
  ficheiro:
    name: Ficheiro
    description: Caminho completo, dentro de /config/www
    required: true
    example: /config/www/casa-card/casa-card.js
    selector:
      text:
  trocas:
    name: Trocas
    description: Lista de {de, para}
    required: true
    selector:
      object:
"""
    if not ficheiro or not ficheiro.startswith("/config/www/") or ".." in ficheiro:
        log.error(f"trocar_texto_ficheiro: só ficheiros dentro de /config/www ({ficheiro})")
        return
    if not trocas:
        log.error("trocar_texto_ficheiro: faltam as trocas")
        return
    texto = _ler(ficheiro)
    original = texto
    for i, t in enumerate(trocas):
        n = texto.count(t["de"])
        if n != 1:
            log.error(f"trocar_texto_ficheiro: a troca {i + 1} aparece {n} vezes em {ficheiro}; nada foi mudado")
            return
        texto = texto.replace(t["de"], t["para"], 1)
    _gravar(ficheiro + ".bak", original)
    _gravar(ficheiro, texto)
    log.info(f"trocar_texto_ficheiro: {len(trocas)} trocas feitas em {ficheiro} (cópia em .bak)")
