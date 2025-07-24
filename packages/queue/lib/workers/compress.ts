import { Job as QueueJob, Worker } from "bullmq"
import { first, values } from "lodash-es"
import { StepStorage } from "../entities/Step"
import { env } from "../env"
import { RedisURL } from "../redis"
import { StepIdentity, WorkerResult } from "../types"
import logger from "../utils/logger"

export const compressWorker = new Worker<any, WorkerResult>(
  "compress",
  async function (queueJob: QueueJob) {
    const stepId = queueJob.name as StepIdentity

    const childrenValues = values(await queueJob.getChildrenValues())
    const previousValue = first(childrenValues) as WorkerResult | undefined
    if (!previousValue) {
      throw new Error(`No child value found for step: ${stepId}`)
    }

    try {
      logger.info("[worker:compress] started", { step: stepId })

      // Retrieve StepEntity
      const step = await StepStorage.get(stepId)
      if (!step) {
        throw new Error(`Step not found: ${stepId}`)
      }

      // Update status
      await StepStorage.update(stepId, {
        status: "running",
      })

      // TODO - Implement compression logic here
      const filename = previousValue.artifact

      // Save artifact
      // const filename = toFilename(
      //   `${stepId}.${mime.getExtension(captureResult.contentType)}`,
      // )
      // await Artifact.save(captureResult.stream, filename)

      // Update status
      // await StepStorage.update(stepId, {
      //   status: "completed",
      //   artifact: filename,
      //   finishedAt: Date.now(),
      // })

      logger.info("[worker:compress] completed", {
        step: stepId,
        filename,
        duration: 0, //captureResult.duration,
      })

      return {
        step: stepId,
        artifact: filename,
      }
    } catch (e) {
      const error = e as Error
      logger.error("[worker:compress] failed", { step: stepId, error })

      // Update status
      try {
        await StepStorage.update(stepId, {
          status: "failed",
          error: error.message,
          finishedAt: Date.now(),
        })
      } catch (updateError) {
        logger.error("[worker:compress] failed to update step", {
          step: stepId,
          error: (updateError as Error).message,
        })
      }

      throw e
    }
  },
  {
    connection: { url: RedisURL },
    concurrency: env.COMPRESS_CONCURRENCY,
  },
)
