# base
FROM node:22-slim AS base
RUN npm install -g corepack@latest
RUN corepack enable

# browser
FROM base AS browser
RUN pnpm dlx puppeteer browsers install chrome@132
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    fonts-wqy-zenhei fonts-freefont-ttf

# pnpm deploy
FROM base AS build
WORKDIR /usr/src/app
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
# add --legacy to make it work 
RUN pnpm deploy --filter=pptr --prod /prod/pptr --legacy
    
# run
FROM browser AS pptr
COPY --from=build /prod/pptr /app
WORKDIR /app
ENTRYPOINT ["pnpm", "start"]