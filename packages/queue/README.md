## Page capture queue service

## Environment

| Name                | Description | Default                       |
| ------------------- | ----------- | ----------------------------- |
| HONO_PORT           |             | 3001                          |
| REDIS_URL           |             | redis://localhost:6379        |
| TASK_EXPIRE         |             | 7d                            |
| JOB_ATTEMPTS        |             | 2                             |
| CAPTURE_ENDPOINT    |             | http://localhost:3000/capture |
| CAPTURE_CONCURRENCY |             | 2                             |

## Note

- [Node.js queue library comparison](https://npm-compare.com/agenda,bee-queue,bull,bullmq,kue)
