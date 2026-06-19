# Deploy na VPS

Este deploy usa a stack Docker Swarm `garcom_agil` atrás do Traefik já existente na VPS. Ele não publica portas diretamente no host.

## Pré-requisitos

- DNS de `garcomagil.com` e `www.garcomagil.com` apontando para `85.31.231.141`.
- Rede Docker externa `traefik_public` existente.
- Arquivo `.env.producao` criado a partir de `.env.producao.example`, com segredos reais.
- Se `POSTGRES_PASSWORD` tiver caracteres especiais, preencha `POSTGRES_PASSWORD_URL` com a mesma senha em formato URL encoded.

## Build das imagens

```bash
set -a
. ./.env.producao
set +a

docker build -t garcom_agil_backend:latest ./backend
docker build \
  --build-arg VITE_API_URL="$VITE_API_URL" \
  --build-arg VITE_MERCADO_PAGO_PUBLIC_KEY="$VITE_MERCADO_PAGO_PUBLIC_KEY" \
  -t garcom_agil_frontend:latest ./frontend
```

## Subir a stack

```bash
set -a
. ./.env.producao
set +a

docker stack deploy -c docker-stack.prod.yml garcom_agil
```

## Validar

```bash
docker stack ps garcom_agil
docker service logs garcom_agil_backend --tail 100
docker service logs garcom_agil_frontend --tail 100
```

Depois valide:

- `https://garcomagil.com`
- Login admin
- Cadastro/listagem de produtos
- Criação de mesas e QR Code
- Fluxo de pedido
- Painel da cozinha
- Atualização em tempo real via WebSocket
- Webhook em `https://garcomagil.com/api/webhooks/mercadopago`
