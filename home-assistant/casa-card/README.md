# Ecrã principal (casa-card) – fitas LED RGBW

As fitas Shelly RGBW (Sala `light.fita_sala` e Suite `light.rgbw_suite`) têm o branco num canal próprio. O brilho geral do HA (`brightness`) só mexe nas cores, por isso no branco a "Intensidade" não fazia nada.

Mudanças em `/config/www/casa-card/casa-card.js` (recurso `?v=2`; a versão anterior ficou em `casa-card.js.bak`):

- Quando uma fita RGBW está num dos brancos, a barra do painel chama-se **Brilho do branco**. Ela e os botões Noite/Suave/Médio/… mudam o canal branco (4.º valor de `rgbw_color`) e o brilho geral na mesma proporção, para os brancos com um pouco de cor (Vela, Quente) baixarem por igual.
- O reconhecimento do branco escolhido passou a comparar só as três cores, porque o canal branco fica mais baixo quando se diminui o brilho.
- A fita do escritório (Livarno) tem branco real (`color_temp`) e continua como estava.

As trocas exatas estão em `fitas-rgbw-trocas.json` e foram aplicadas com o serviço `pyscript.trocar_texto_ficheiro` (`home-assistant/pyscript/trocar_texto.py`).

## Mudar os brancos e as cores

Estão na configuração do cartão `custom:casa-tlm-card` no dashboard (`led_whites` e `led_colors`), no telemóvel e no tablet. Não é preciso mexer no ficheiro.
