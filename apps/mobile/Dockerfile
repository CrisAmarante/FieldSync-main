# Uso: só para desenvolvimento (serve o Metro bundler/QR do Expo dentro do
# docker-compose.dev.yml, junto com backend/web) — não existe estágio de
# produção aqui, o app mobile é distribuído como build nativo (EAS/APK), não
# como container.
FROM node:24.20.0-bookworm-slim
WORKDIR /app

# CLI `tailscale` usada por docker-entrypoint.sh para resolver o IP atual do
# nó (via socket compartilhado do serviço `tailscale`) — só o binário
# cliente, não o daemon `tailscaled` (que roda no serviço `tailscale`, não
# aqui).
COPY --from=tailscale/tailscale:stable /usr/local/bin/tailscale /usr/local/bin/tailscale

# Base Debian (não Alpine): binários pré-compilados de dependências nativas
# do toolchain Expo/Metro (ex: sharp) visam glibc — evita build nativo
# lento/instável no musl do Alpine só para rodar o dev server.
COPY package*.json ./
RUN npm ci

COPY . .
RUN chmod +x docker-entrypoint.sh

# 8081: Metro bundler. 19000-19002: Expo Dev Tools/manifest (protocolo
# legado ainda usado por alguns clientes Expo Go).
EXPOSE 8081 19000 19001 19002

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npx", "expo", "start", "--lan"]
