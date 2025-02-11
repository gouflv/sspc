ARG PUPPETEER_VERSION=24.2.0

# Base
FROM node:22-slim AS base
RUN npm install -g corepack@latest
RUN corepack enable

# Browser
FROM ghcr.io/puppeteer/puppeteer:$PUPPETEER_VERSION AS browser
USER root

# Build
FROM base AS build
WORKDIR /usr/src/app
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm deploy --filter=pptr --prod /prod/pptr --legacy 

# PPTR
FROM browser AS pptr
ENV PUPPETEER_CACHE_DIR=/home/pptruser/.cache/puppeteer
ENV NODE_ENV=production
RUN npm install -g corepack@latest
RUN corepack enable
COPY --from=build /prod/pptr /app
WORKDIR /app
ENTRYPOINT ["pnpm", "start"]