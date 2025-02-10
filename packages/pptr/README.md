# pptr

## Features

- Provides a RESTful API to return the screenshot of given URL
- Build in `Chrome@133.0.6943.53`, which is the default version of [`puppeteer@24.2.0`](https://github.com/puppeteer/puppeteer/blob/puppeteer-v24.2.0/packages/puppeteer-core/src/revisions.ts)

## ENV

| Name                      | Description | Default   |
| ------------------------- | ----------- | --------- |
| PUPPETEER_EXECUTABLE_PATH |             |           |
| PUPPETEER_TIMEOUT         |             | 30_000 ms |
| HONO_PORT                 |             | 3000      |
| LOG_LEVEL                 |             | info      |

## Development Guide

- Install `Chrome for Testing` locally

```bash
pnpm dlx puppeteer browser install chrome@133.0.6943.53
```

## Notes

- Run Puppeteer in Docker https://pptr.dev/guides/docker
