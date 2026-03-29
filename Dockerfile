# ---- BASE ----
FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ---- BUILDER ----
FROM base AS builder
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/common/package.json ./packages/common/
COPY packages/web/package.json ./packages/web/
COPY packages/socket/package.json ./packages/socket/

RUN --mount=type=cache,target=/pnpm/store pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @rahoot/web build

# ---- RUNNER ----
FROM alpine:3.21 AS runner

RUN apk add --no-cache nginx supervisor

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf

COPY --from=builder /app/packages/web/dist /app/web

EXPOSE 3000

CMD ["supervisord", "-c", "/etc/supervisord.conf"]
