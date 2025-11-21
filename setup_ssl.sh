#!/bin/bash

# 1. Configurações
DOMAIN="garcomagil.com"
EMAIL="luiz@garcomagil.com"

echo "🚀 Iniciando configuração automática de SSL..."

# 2. Derruba containers e limpa volumes sujos (para evitar o erro -0001)
echo "🧹 Limpando ambiente antigo..."
docker-compose down
docker volume rm gar-om_certbot-etc gar-om_certbot-var 2> /dev/null

# 3. Sobe o Nginx (que vai gerar o certificado falso temporário)
echo "🐳 Subindo Nginx (gerando certificado temporário)..."
docker-compose up -d nginx
echo "⏳ Aguardando Nginx iniciar..."
sleep 10

# 4. Força o Certbot a sobrescrever o falso pelo original
echo "🔒 Solicitando certificado Let's Encrypt..."
docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    -d $DOMAIN \
    --email $EMAIL \
    --rsa-key-size 4096 \
    --agree-tos \
    --force-renewal \
    --non-interactive" certbot

# 5. Reinicia o Nginx para pegar o certificado novo
echo "Bdsc Recarregando Nginx..."
docker-compose restart nginx

# 6. Sobe o resto do sistema (Backend, Frontend, DB)
echo "✅ Subindo todo o sistema..."
docker-compose up -d

echo "🎉 Sucesso! Acesse https://$DOMAIN"