# Base
FROM node:22-slim AS base
RUN npm install -g corepack@latest
RUN corepack enable

# browser
FROM base AS browser
RUN pnpm dlx puppeteer browsers install chrome@133.0.6943.53 
RUN apt-get update \
    && apt-get install -y --no-install-recommends fonts-wqy-zenhei fonts-freefont-ttf

# Build
FROM base AS build
WORKDIR /usr/src/app
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm deploy --filter=pptr --prod /prod/pptr --legacy 

# PPTR
FROM ghcr.io/puppeteer/puppeteer AS pptr
COPY --from=build /prod/pptr /app
WORKDIR /app
ENTRYPOINT ["pnpm", "start"]