# Instalar "Acesso Remoto do Técnico" noutro Home Assistant

Um interruptor que o cliente controla:
- **Desligado** → o teu utilizador fica "Local access only" (só entra a partir da rede local da casa).
- **Ligado** → podes entrar de fora.
- Opcional: desliga sozinho passado X horas e/ou avisa o cliente quando é ligado.

Ficheiros neste repositório:
- `pyscript/acesso_utilizadores.py`
- `blueprints/automation/myprojects/AcessoRemotoTecnico.yaml`

## 1. Instalar o pyscript
1. HACS → procurar **Pyscript** → Download.
2. Reiniciar o Home Assistant.
3. Definições → Dispositivos e serviços → Adicionar integração → **Pyscript**.
   - Ligar **"Access hass as a global variable"** (obrigatório).
   - "Allow all imports" pode ficar desligado.

## 2. Copiar o script
1. Com o File editor (ou Samba), criar a pasta **`/config/pyscript`** (ao lado do `configuration.yaml`, não dentro de outra pasta).
2. Criar lá o ficheiro **`acesso_utilizadores.py`** com o conteúdo de `pyscript/acesso_utilizadores.py`.
3. Ferramentas → Ações → correr **`pyscript.reload`** (ou reiniciar).
4. Confirmar que existe a ação **`pyscript.acesso_local_utilizador`**.

## 3. Importar a blueprint
- Copiar `AcessoRemotoTecnico.yaml` para `/config/blueprints/automation/myprojects/`
  e recarregar as automações (Ferramentas → YAML → Automações),
  **ou** Definições → Automações → Blueprints → Importar, colando o link do ficheiro (se o repositório for público).

## 4. Criar o interruptor
Definições → Dispositivos e serviços → Ajudantes → Criar → **Interruptor** (toggle), ex. "Acesso Remoto Técnico".

## 5. Criar a automação
Definições → Automações → Blueprints → **Acesso Remoto do Técnico** → Criar automação:
- Interruptor: o que criaste no passo 4.
- Username do técnico: o teu username de login (Definições → Pessoas → Utilizadores → Username).
- Opções (opcional): horas para desligar sozinho; ações ao ligar (ex. notificação ao cliente).

## 6. Testar
1. Desligar o interruptor → **refresh no browser (F5)** → Definições → Pessoas → Utilizadores → o teu utilizador deve ter "Local access only" **ligado**.
2. Ligar o interruptor → F5 → deve estar **desligado**.
3. Teste real: telemóvel só com dados móveis, janela anónima, endereço remoto. Com o interruptor desligado o login deve ser recusado.

## Notas
- O ecrã de utilizadores só atualiza com refresh (F5).
- Por VPN (Tailscale/WireGuard) o HA pode tratar-te como "local" — o bloqueio só é garantido pelo endereço remoto normal (Nabu Casa, domínio próprio).
- Põe o interruptor num painel que o cliente use. Enquanto estiver desligado, só entras estando na rede da casa.
