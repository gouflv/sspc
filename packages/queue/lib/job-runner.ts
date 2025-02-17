/**
 * run jobs in queue
 *
 * Example:
 * // push jobs to queue
 * JobRunner.run(task, jobs)
 *
 * // bull queue process callback
 * queue.process(async (job) => {
 *   // exec job
 *   const artifact = await JobRunner.exec(job)
 * })
 *
 * function exec() {
 *   // capture
 *   const captureResult = await capture()
 *
 *   // save artifact
 *   Artifact.save()
 *
 *   // update job status and artifact
 *   await Job.update(job.id, { status: "completed", artifact })
 *
 *   // update task status which is combined by all jobs
 *   const status = combinedStatus(jobs)
 *
 *   // package all jobs's artifact to task artifact if task is completed
 *   if (status === "completed") {
 *     const artifacts = await packageArtifacts(jobs)
 *   }
 *
 *   await Task.update(task.id, {
 *     status,
 *     artifact
 *   })
 * }
 */

import Artifact from "./artifact"
import capture from "./capture"
import Job from "./job"
import logger from "./logger"
import Task from "./task"
import { JobData, Status } from "./types"

async function exec(job: JobData) {
  logger.info("Queue job started", { id: job.id })

  try {
    await Job.update(job.id, { status: "running", error: null })

    // update task
    updateTask(job.taskId)

    const task = await Task.findById(job.taskId)
    if (!task) {
      throw new Error(`Task ${job.taskId} not found`)
    }

    // capture
    const page = task.params.pages[job.index]
    const captureResult = await capture(job.id, {
      ...task.params,
      url: page.url,
    })

    // save artifact
    const filename = `${job.id}.${Artifact.contentType2Extension(captureResult.contentType)}`
    await Artifact.save(captureResult.stream, filename)

    // update job status and artifact
    await Job.update(job.id, {
      status: "completed",
      artifact: filename,
    })

    // update task
    updateTask(job.taskId)
  } catch (e) {
    await Job.update(job.taskId, {
      status: "failed",
      error: (e as Error).message,
    })

    // update task
    updateTask(job.taskId)

    // TODO: stop all jobs in queue

    throw e
  }
}

async function updateTask(taskId: string) {
  const jobs = await Job.findAllByTask(taskId)
  const status = combinedStatus(jobs)

  // package all jobs's artifact to task artifact if task is completed
  if (status === "completed") {
    const { filename } = await Artifact.packageArtifacts(
      jobs.map((job) => job.artifact!),
      `${taskId}.zip`,
    )
    Task.update(taskId, { status, artifact: filename })
  } else {
    Task.update(taskId, { status })
  }
}

function combinedStatus(jobs: JobData[]): Status {
  if (jobs.length === 0) {
    return "pending"
  }
  const statusCount = Job.countByStatus(jobs)

  if (statusCount.running) {
    return "running"
  }
  if (statusCount.completed === jobs.length) {
    return "completed"
  }
  if (statusCount.failed) {
    return "failed"
  }
  return "pending"
}

export default {
  exec,
  combinedStatus,
}
