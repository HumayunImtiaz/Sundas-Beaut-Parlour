FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
RUN npm ci

COPY apps/backend apps/backend
WORKDIR /app/apps/backend
RUN npx medusa build

FROM node:20-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
RUN npm ci --omit=dev --workspace=@dtc/backend --include-workspace-root=false --no-audit --no-fund \
    && npm cache clean --force
COPY --from=build --chown=node:node /app/apps/backend/.medusa/server ./apps/backend/.medusa/server
WORKDIR /app/apps/backend/.medusa/server

USER node

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:9000/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["/app/node_modules/.bin/medusa", "start", "--host", "0.0.0.0"]
