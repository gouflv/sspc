# pptr

## Features

- Provides a RESTful API to return the screenshot of given URL
- Basic on `puppeteer@24.2.0`
- Docker image with build in `Chrome@133.0.6943.53`, which is the default version of [`puppeteer@24.2.0`](https://github.com/puppeteer/puppeteer/blob/puppeteer-v24.2.0/packages/puppeteer-core/src/revisions.ts)

## API

### GET /capture

- Query Parameters

| Name                   | Type                                                           | Required | Default  |
| ---------------------- | -------------------------------------------------------------- | -------- | -------- |
| url                    | string                                                         | true     |          |
| viewportWidth          | number                                                         |          |          |
| viewportHeight         | number                                                         |          |          |
| timeout                | number                                                         |          | 30_000ms |
| captureFormat          | 'png' \| 'jpeg' \| 'pdf'                                       |          | 'png'    |
| quality                | number                                                         |          | 100      |
| captureElementSelector | string                                                         |          |          |
| pdfFormat              | 'a4'                                                           |          |          |
| pdfMargin              | `{ top: number, right: number, bottom: number, left: number }` |          |          |
| pdfWidth               | number                                                         |          |          |
| pdfHeight              | number                                                         |          |          |

## ENV

| Name                      | Description                                                            | Default                     |
| ------------------------- | ---------------------------------------------------------------------- | --------------------------- |
| PUPPETEER_EXECUTABLE_PATH | Chrome 可执行文件所在目录。指定时，将忽略 CACHE_DIR, CHROMIUM_REVISION |                             |
| PUPPETEER_CACHE_DIR       | Puppeteer 的浏览器安装目录                                             | /$HOME_DIR/.cache/puppeteer |
| PUPPETEER_CHROME_REVISION | Chrome 版本                                                            | 133.0.6943.53               |
| PUPPETEER_TIMEOUT         | 浏览器全局操作超时时间，单位：毫秒                                     | 30_000 ms                   |
| HONO_PORT                 | API 服务端口                                                           | 3000                        |
| LOG_LEVEL                 | 日志级别                                                               | info                        |

## Development Guide

- Install `Chrome for Testing` locally

```bash
pnpm dlx puppeteer@24.2.0 browser install chrome@133.0.6943.53
```

## Notes

- Run Puppeteer in Docker https://pptr.dev/guides/docker
