#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [[ -f "$ENV_FILE" ]]; then
  echo ".env já existe. Edite manualmente se quiser alterar."
  exit 0
fi

AUTH_SECRET=$(openssl rand -hex 32)
cat > "$ENV_FILE" <<EOF
# Variáveis usadas pelo docker-compose
AUTH_SECRET=$AUTH_SECRET
CERTBOT_DOMAIN=garcomagil.com
CERTBOT_EMAIL=seu-email@dominio.com
EOF

echo ".env criado com AUTH_SECRET aleatório."
