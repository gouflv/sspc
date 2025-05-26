# Page Capture Service with Puppeteer

## Features

- Provides a RESTful API to return the screenshot of given URL
- Basic on `puppeteer@24.2.0`
- Docker image with build in `Chrome@133.0.6943.53`, which is the default version of [`puppeteer@24.2.0`](https://github.com/puppeteer/puppeteer/blob/puppeteer-v24.2.0/packages/puppeteer-core/src/revisions.ts)

## API Reference

### `GET /capture`

Takes a screenshot or generates PDF of a webpage.

#### Request Headers

| Header       | Value            | Required |
| ------------ | ---------------- | -------- |
| Content-Type | application/json | Yes      |
| Request-Id   | string           | No       |

#### Request Body Parameters

| Parameter              | Type   | Required | Default | Description                 |
| ---------------------- | ------ | -------- | ------- | --------------------------- |
| url                    | string | Yes      | -       | Target webpage URL          |
| viewportWidth          | number | No       | -       | Browser viewport width      |
| viewportHeight         | number | No       | -       | Browser viewport height     |
| timeout                | number | No       | 30_000  | Operation timeout in ms     |
| readySelector          | string | No       | -       | Wait for element selector   |
| captureFormat          | string | No       | 'png'   | Output format: png/jpeg/pdf |
| quality                | number | No       | 100     | JPEG quality (1-100)        |
| captureElementSelector | string | No       | -       | Capture specific element    |

##### PDF Specific Options:

| Parameter   | Type    | Default | Description                          |
| ----------- | ------- | ------- | ------------------------------------ |
| pdfFormat   | string  | -       | Paper format (e.g. 'a4')             |
| pdfMargin   | object  | -       | Page margins                         |
| pdfWidth    | number  | -       | Custom page width                    |
| pdfHeight   | number  | -       | Custom page height                   |
| pdfCompress | boolean | true    | Compress PDF output with ghostscript |

#### Response

**Success (200)**

```http
Content-Type: image/png | image/jpeg | application/pdf
Body: <Binary File>
```

**Error Responses**

- 400 Bad Request
- 500 Internal Server Error

```json
{
  success: false,
  error: string
}
```

## Environment Variables

| Variable                  | Description                       | Default                     |
| ------------------------- | --------------------------------- | --------------------------- |
| PORT                      | API server port                   | 3000                        |
| LOG_LEVEL                 | Logging level                     | info                        |
| PUPPETEER_TIMEOUT         | Global operation timeout (ms)     | 30_000                      |
| PUPPETEER_CACHE_DIR       | Browser installation directory    | /$HOME_DIR/.cache/puppeteer |
| PUPPETEER_CHROME_REVISION | Chrome version                    | 133.0.6943.53               |
| PUPPETEER_EXECUTABLE_PATH | Custom Chrome binary path         | -                           |
| POOL_SIZE_MAX             | Chrome instance pool maximum size | 4                           |
| POOL_SIZE_MIN             | Chrome instance pool minimum size | 1                           |

## Development

```bash
# Install Chrome for Testing
pnpm dlx puppeteer@24.2.0 browser install chrome@133.0.6943.53
```

## References

- [Running Puppeteer in Docker](https://pptr.dev/guides/docker)
