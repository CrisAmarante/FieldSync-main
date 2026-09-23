# ── Estágio de build ──────────────────────────────────────────
FROM node:24.20.0-alpine AS builder
WORKDIR /app

# Instala TODAS as dependências (dev incluso) para compilar TypeScript
COPY package*.json ./
RUN npm ci

COPY . .
RUN DATABASE_URL="postgresql://mock:mock@localhost:5432/mock" npx prisma generate
RUN npm run build

# ── Estágio de produção ───────────────────────────────────────
FROM node:24.20.0-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Copia apenas o necessário do estágio de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Instala apenas dependências de produção no estágio final
RUN npm ci --omit=dev

# Client do Prisma já gerado no builder (engine + código gerado) — evita
# rede/geração no estágio final.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# schema.prisma + migrations + seed.ts: `prisma`/`ts-node`/`typescript` são
# dependencies (não devDependencies) exatamente para isto — `prisma migrate
# deploy` e `prisma db seed` (bootstrap do Administrador em produção, ver
# prisma/seed.ts) rodam dentro DESTE container (`docker compose exec backend
# npx prisma migrate deploy` / `db seed`, ver README), então precisam da CLI
# e do schema disponíveis aqui, não só no estágio de build. seed.ts importa
# de `../src/*` (AuthService, validateAdminPasswordStrength) e o `ts-node`
# que o executa precisa do `tsconfig.json` para saber compilar decorators —
# por isso `src/` e os tsconfig também são copiados, não só `dist/`.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig*.json ./

# Usuário não-root (segurança)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3001
CMD ["node", "dist/main"]
