ARG PUPPETEER_VERSION=24.2.0

# Base
FROM --platform=$BUILDPLATFORM node:22.19.0-slim AS base
RUN npm install -g pnpm@10.22.0

# Browser Base
FROM --platform=$BUILDPLATFORM ghcr.io/puppeteer/puppeteer:$PUPPETEER_VERSION AS browser
USER root
RUN npm install -g pnpm@10.22.0
RUN apt update && apt install -y --no-install-recommends fonts-noto-cjk 
RUN fc-cache -fv

# Build
FROM base AS build
WORKDIR /usr/src/app
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install
RUN pnpm deploy --filter=pptr --prod /prod/pptr --legacy 
RUN pnpm deploy --filter=queue --prod /prod/queue --legacy 

# PPTR
FROM browser AS pptr
ENV PUPPETEER_CACHE_DIR=/home/pptruser/.cache/puppeteer
COPY --from=build /prod/pptr /app
WORKDIR /app
ENTRYPOINT ["pnpm", "start"]

# PPTR with fonts bundle
FROM pptr AS pptr-bundle
COPY assets/fonts/*  /usr/share/fonts/truetype/pptr/
WORKDIR /app
ENTRYPOINT ["pnpm", "start"]

# Queue
FROM base AS queue
RUN apt update && apt install -y ghostscript
COPY --from=build /prod/queue /app
WORKDIR /app
ENTRYPOINT ["pnpm", "start"]