# Page Capture Service with Puppeteer

## Overview

Provides a RESTful API to capture screenshots or generate PDFs of web pages using Puppeteer.

## Features

- RESTful API for webpage screenshots and PDF generation
- Built on `puppeteer@24.2.0`
- Docker image with built-in `Chrome@133.0.6943.53`
- Chrome instance pooling for better performance

## API Reference

### `GET /capture`

Captures a screenshot or generates a PDF of a webpage.

#### Request Headers

| Header       | Value            | Required | Description          |
| ------------ | ---------------- | -------- | -------------------- |
| Content-Type | application/json | Yes      | Request content type |
| Request-Id   | string           | No       | Optional request ID  |

#### Request Parameters

##### Basic Parameters

| Parameter      | Type   | Required | Default | Description               |
| -------------- | ------ | -------- | ------- | ------------------------- |
| url            | string | Yes      | -       | Target webpage URL        |
| viewportWidth  | number | No       | -       | Browser viewport width    |
| viewportHeight | number | No       | -       | Browser viewport height   |
| timeout        | number | No       | 30_000  | Operation timeout in ms   |
| readySelector  | string | No       | -       | Wait for element selector |

##### Capture Options

| Parameter              | Type   | Required | Default | Description                 |
| ---------------------- | ------ | -------- | ------- | --------------------------- |
| captureFormat          | string | No       | 'png'   | Output format: png/jpeg/pdf |
| quality                | number | No       | 100     | JPEG quality (1-100)        |
| captureElementSelector | string | No       | -       | Capture specific element    |

##### PDF Options

| Parameter | Type   | Required | Default | Description              |
| --------- | ------ | -------- | ------- | ------------------------ |
| pdfFormat | string | No       | -       | Paper format (e.g. 'a4') |
| pdfMargin | object | No       | -       | Page margins             |
| pdfWidth  | number | No       | -       | Custom page width        |
| pdfHeight | number | No       | -       | Custom page height       |

#### Response

##### Success Response (200)

```http
Content-Type: image/png | image/jpeg | application/pdf
Body: <Binary File>
```

##### Error Responses

**Client Errors (400)**

```json
{
  "success": false,
  "error": ZodError,
}
```

**Server Errors (500)**

```json
{
  "success": false,
  "error": "Navigation timeout of 300 ms exceeded"
}
```

## Configuration

### Environment Variables

#### Server Configuration

| Variable  | Description     | Default |
| --------- | --------------- | ------- |
| PORT      | API server port | 3000    |
| LOG_LEVEL | Logging level   | info    |

#### Puppeteer Configuration

| Variable                  | Description                    | Default                     |
| ------------------------- | ------------------------------ | --------------------------- |
| PUPPETEER_TIMEOUT         | Global operation timeout (ms)  | 30_000                      |
| PUPPETEER_CACHE_DIR       | Browser installation directory | /$HOME_DIR/.cache/puppeteer |
| PUPPETEER_CHROME_REVISION | Chrome version                 | 133.0.6943.53               |
| PUPPETEER_EXECUTABLE_PATH | Custom Chrome binary path      | -                           |

#### Performance Configuration

| Variable      | Description                       | Default |
| ------------- | --------------------------------- | ------- |
| POOL_SIZE_MAX | Chrome instance pool maximum size | 4       |
| POOL_SIZE_MIN | Chrome instance pool minimum size | 1       |

## References

- [Puppeteer Documentation](https://pptr.dev/)
