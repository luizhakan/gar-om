FROM node:20-alpine AS builder
WORKDIR /app

# Instala dependências
COPY package*.json ./
# Usamos npm install para permitir a atualização do lockfile com a nova versão do Vite
RUN npm install

# Copia código e gera build
COPY . .

# Permite informar a API na hora do build
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine AS runner
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80