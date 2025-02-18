ARG PUPPETEER_VERSION=24.2.0

# Base
FROM node:22-slim AS base
RUN npm install -g pnpm@latest-10

# Browser
FROM ghcr.io/puppeteer/puppeteer:$PUPPETEER_VERSION AS browser
USER root
RUN npm install -g pnpm@latest-10

# Build
FROM base AS build
WORKDIR /usr/src/app
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm deploy --filter=pptr --prod /prod/pptr --legacy 
RUN pnpm deploy --filter=queue --prod /prod/queue --legacy 

# PPTR
FROM browser AS pptr
ENV PUPPETEER_CACHE_DIR=/home/pptruser/.cache/puppeteer
COPY --from=build /prod/pptr /app
WORKDIR /app
ENTRYPOINT ["pnpm", "start"]

# Queue
FROM base AS queue
COPY --from=build /prod/queue /app
WORKDIR /app
ENTRYPOINT ["pnpm", "start"]