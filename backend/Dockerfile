# ── Etapa base: dependencias ─────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
# OpenSSL necesario para el query engine de Prisma en Alpine
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci

# ── Desarrollo: hot reload con ts-node-dev ───────────────────────────────────
FROM base AS development
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]

# ── Compilación TypeScript ───────────────────────────────────────────────────
FROM base AS builder
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Producción: solo el JS compilado ────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3000
CMD ["node", "dist/index.js"]
