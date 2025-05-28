# Page Capture Queue Service

A service that manages capture jobs in a queue.

## Configuration

| Environment Variable | Description                   | Default                       |
| -------------------- | ----------------------------- | ----------------------------- |
| PORT                 | API server port               | 3001                          |
| LOG_LEVEL            | Logging level                 | info                          |
| REDIS_URL            | Redis connection URL          | redis://localhost:6379        |
| JOB_EXPIRE           | Job expiration time (seconds) | 1d                            |
| JOB_ATTEMPTS         | Max job retry attempts        | 1                             |
| CAPTURE_ENDPOINT     | Page capture service URL      | http://localhost:3000/capture |
| CAPTURE_CONCURRENCY  | Max concurrent capture tasks  | 4                             |

## API Reference

### Create Job (`POST /jobs`)

Create a new capture job for one or multiple pages.

#### Headers

| Name         | Value            | Required |
| ------------ | ---------------- | -------- |
| Content-Type | application/json | Yes      |

#### Request Body

```typescript
{
  // Required: Array of pages to capture
  pages: Array<{
    url: string,   // Target webpage URL
    name: string   // Output filename
  }>,

  // Optional capture settings
  viewportWidth?: number,
  viewportHeight?: number,
  timeout?: number,        // Default: 30_000
  captureFormat?: string,  // 'png'|'jpeg'|'pdf', Default: 'png'
  quality?: number,        // 1-100, Default: 100
  captureElementSelector?: string,

  // PDF specific options
  pdfFormat?: string,      // e.g. 'a4'
  pdfMargin?: {
    top: number,
    right: number,
    bottom: number,
    left: number
  },
  pdfWidth?: number,
  pdfHeight?: number
}
```

#### Response

```typescript
{
  success: true,
  data: {
    id: string  // Job ID for status checks and downloads
  }
}
```

### Check Status (`GET /jobs/:id`)

Get current job status and progress.

#### Response

```typescript
{
  success: true,
  data: {
    id: string,
    status: 'pending' | 'running' | 'completed' | 'failed',
    error: string,
    progress: {
      total: number,
      pending: number,
      running: number,
      completed: number,
      failed: number
    }
  }
}
```

### Download Result (`GET /jobs/:id/artifact`)

Download captured files. Returns ZIP for multiple pages, direct file otherwise.

#### Response

Content-Type:

- For multiple pages
  - `application/zip`
- Single page capture
  - `image/png`
  - `image/jpeg`
  - `application/pdf`

#### Response

**Success (200)**

```http
Content-type: `application/zip | image/png | image/jpeg | application/pdf`
Body: <Binary File>
```

**Error (400)**

- Artifact not found

### Cancel Job (`GET /jobs/:id/cancel`)

Cancel a running job.

#### Response

```typescript
{
  success: true
}
```

### Create Urgent Job (`POST /jobs/urgent`)

Create a job in highest priority. Will wait fot it complete, then return the artifact. Only one page allowed in pre job.

#### Request Body

Same as `POST /jobs`.

#### Response

**Success (200)**

```
Content-Type: `image/png | image/jpeg | application/pdf`
Body: <Binary File>
```

**Error (400/500)**

```typescript
{
  success: false,
  error: string
}
```

### Dashboard (`GET /ui`)

Web interface for queue monitoring and job management.

## References

- [Node.js queue library comparison](https://npm-compare.com/agenda,bee-queue,bull,bullmq,kue)
