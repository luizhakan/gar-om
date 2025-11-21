# Derruba tudo
docker-compose down

# Remove os volumes de certificado (importante para limpar o estado "sujo")
docker volume rm gar-om_certbot-etc gar-om_certbot-var

# Sobe novamente
docker-compose up -d