FROM node:20-alpine AS builder
WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm ci

# Copia código e gera build + Prisma Client
COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Usa as dependências já instaladas e o client Prisma gerado
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3001

CMD ["node", "dist/main.js"]
