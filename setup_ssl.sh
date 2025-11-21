#!/bin/bash

DOMAIN="garcomagil.com"
EMAIL="luiz@garcomagil.com"

echo "🔥 Derrubando tudo e limpando volumes..."
docker-compose down
# Remove volumes forçadamente para não ter resto de config
docker volume rm gar-om_certbot-etc gar-om_certbot-var 2>/dev/null || true

echo "🚀 Subindo Nginx (vai gerar certificado falso temporário)..."
docker-compose up -d nginx
echo "⏳ Aguardando 10s para o Nginx estabilizar..."
sleep 10

echo "🔒 Solicitando certificado OFICIAL para $DOMAIN e www.$DOMAIN..."
# O segredo aqui é o --expand para incluir o www
docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    -d $DOMAIN -d www.$DOMAIN \
    --email $EMAIL \
    --rsa-key-size 4096 \
    --agree-tos \
    --force-renewal \
    --non-interactive" certbot

echo "🔄 Reiniciando Nginx para carregar o certificado novo..."
docker-compose restart nginx

echo "✅ Subindo o resto do sistema..."
docker-compose up -d

echo "🎉 PRONTO! Acesse https://garcomagil.com ou https://www.garcomagil.com"