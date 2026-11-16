# syntax=docker/dockerfile:1.7
# Smoke Island API + Telegram bots
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --no-audit --no-fund

FROM node:22-bookworm-slim AS runner
WORKDIR /app
# NODE_ENV comes from compose / .env.docker — do not force production here
ENV PORT=3000
RUN useradd --system --create-home --uid 10001 smokeisland
COPY --from=deps --chown=smokeisland:smokeisland /app/node_modules ./node_modules
COPY --chown=smokeisland:smokeisland package.json package-lock.json ./
COPY --chown=smokeisland:smokeisland src ./src
USER smokeisland
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=12 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
