# Checklist - Comanda com troca de mesa e aprovacao de dispositivos

## Pendencias de definicao
- [x] Formato do codigo da comanda (6 caracteres alfanumericos em maiusculo)
- [x] Local da UI do admin para as 3 acoes (tela de Mesas)
- [x] Onde exibir o codigo/QR no fluxo do cliente (Revisar Pedido)

## Backend
- [x] Atualizar schema Prisma com Comanda e ComandaDispositivo
- [x] Criar migracao do banco
- [x] Criar servico e controller de Comanda
- [x] Ajustar criacao de pedido para criar comanda no primeiro pedido
- [x] Exigir token de comanda para acoes de cliente apos a comanda existir
- [x] Implementar solicitacao/aprovacao/recusa de dispositivos
- [x] Implementar revogacao de dispositivos
- [x] Implementar troca de mesa (bloqueios e sincronizacao de pedidos/mesa)
- [x] Implementar acoes do admin: virar master, escolher master e encerrar comanda
- [x] Emitir evento WS de troca de mesa para admin/cozinha e clientes da comanda
- [x] Ajustar endpoints atuais de mesa/comanda conforme novo fluxo
- [x] Ajustar status recusado vs revogado nas respostas de dispositivos

## Frontend cliente
- [x] Guardar token e id da comanda na sessao do cliente
- [x] Criar servico de comanda no frontend
- [x] Mostrar mesa atual e codigo/QR da comanda
- [x] Modal de trocar mesa seguindo padrao visual
- [x] Tela de solicitacao de acesso por codigo da comanda
- [x] Tela de aguardando aprovacao
- [x] Modal do master para aprovar/recusar solicitacoes
- [x] Atualizar WS para usar sala da comanda
- [x] Ajustar fluxo de Revisar Pedido e Comanda para usar endpoints de comanda

## Frontend admin
- [x] Exibir comanda ativa por mesa
- [x] Acoes do admin: virar master, escolher master, encerrar comanda
- [x] Listar dispositivos e pendencias da comanda

## Testes e validacao
- [x] Atualizar testes do backend para comanda e troca de mesa
- [ ] Validar fluxo manual: criar comanda, aprovar dispositivo, trocar mesa, encerrar
