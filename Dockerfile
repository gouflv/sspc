# base
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# dependencies
FROM base AS build
WORKDIR /usr/src/app
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm deploy --filter=pptr --prod /prod/pptr
    
# pptr
FROM base AS pptr
COPY --from=build /prod/pptr /app
RUN pnpm dlx puppeteer browsers install chrome
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    fonts-wqy-zenhei fonts-freefont-ttf 
WORKDIR /app
ENTRYPOINT ["pnpm", "start"]