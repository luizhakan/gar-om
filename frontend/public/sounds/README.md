# Sons

Esta pasta contém arquivos de áudio para alertas do sistema.

## 🔊 Como Adicionar um Som Personalizado

1. **Baixe ou crie um arquivo de som** (formato MP3)
   - Recomendação: Som curto (1-2 segundos), volume médio
   - Sugestões: sino, campainha, notificação, beep

2. **Renomeie o arquivo para:** `alerta.mp3`

3. **Coloque o arquivo nesta pasta:** `public/sounds/alerta.mp3`

4. **Pronto!** O sistema usará automaticamente seu som

## 🎵 Sugestões de Sons Gratuitos

- **Freesound.org**: https://freesound.org/search/?q=notification
- **Zapsplat**: https://www.zapsplat.com/sound-effect-category/notifications/
- **Mixkit**: https://mixkit.co/free-sound-effects/notification/

## 🔄 Fallback Automático

Se o arquivo `alerta.mp3` não existir, o sistema usará automaticamente um **beep sintético** gerado via Web Audio API (800Hz, tom médio-agudo).

**Última atualização:** 19/11/2025
