FROM node:20-alpine AS builder
WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm install

# Copia código
COPY . .

# --- ALTERAÇÃO AQUI ---
# Recebe as variáveis de build
ARG VITE_API_URL=http://localhost:3001
ARG VITE_MERCADO_PAGO_PUBLIC_KEY

# Define as variáveis de ambiente para o build do Vite
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MERCADO_PAGO_PUBLIC_KEY=$VITE_MERCADO_PAGO_PUBLIC_KEY
# ----------------------

RUN npm run build

FROM nginx:1.27-alpine AS runner
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80