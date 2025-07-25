import { Job as QueueJob, Worker } from "bullmq"
import { first, values } from "lodash-es"
import { StepStorage } from "../entities/Step"
import { env } from "../env"
import { RedisURL } from "../redis"
import { compressPDF } from "../service/compress"
import { StepIdentity, WorkerResult } from "../types"
import Artifact from "../utils/artifact"
import { toFilename } from "../utils/helper"
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

      // Compress
      const source = Artifact.resolveFilePath(previousValue.artifact.filename)
      const result = await compressPDF(source)

      // Save artifact
      const filename = toFilename(`${stepId}.pdf`)
      const { size } = await Artifact.save(result.stream, filename)
      const artifact: WorkerResult["artifact"] = {
        contentType: "application/pdf",
        filename: filename,
        size: size,
      }

      // Update status
      await StepStorage.update(stepId, {
        status: "completed",
        artifact,
        finishedAt: Date.now(),
      })

      logger.info("[worker:compress] completed", {
        step: stepId,
        filename,
        size,
        duration: result.duration,
      })

      return {
        step: stepId,
        artifact,
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
          error: updateError,
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
