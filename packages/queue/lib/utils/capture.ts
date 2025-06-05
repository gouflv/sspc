import { CaptureParamsType } from "@pptr/core"
import axios, { AxiosError } from "axios"
import { Stream } from "node:stream"
import { buffer } from "stream/consumers"
import { env } from "../env"
import logger from "./logger"

type CaptureResponseError = {
  success: boolean
  error: string
}

async function capture(
  id: string,
  params: CaptureParamsType,
): Promise<{
  contentType: string
  stream: Stream
  duration: number
}> {
  logger.debug("[capture] started", { id })

  try {
    const url = env.CAPTURE_ENDPOINT

    const response = await axios.post(url, params, {
      responseType: "stream",
      headers: {
        "Content-Type": "application/json",
        "request-id": id,
      },
    })

    const duration = parseInt(response.headers["duration"] || "0")

    logger.debug("[capture] completed", { id, duration })

    return {
      contentType: response.headers["content-type"],
      stream: response.data,
      duration,
    }
  } catch (e) {
    logger.error("[capture] failed", { id, error: e })

    if (axios.isAxiosError(e)) {
      const error = e as AxiosError<CaptureResponseError>

      // Steam response to json manually
      const response = error.response?.data as ReadableStream | undefined
      if (!response) {
        throw new Error(error.message || error.code)
      }
      const buf = await buffer(response)
      const json = JSON.parse(buf.toString("utf-8"))
      if (json?.error) {
        throw new Error(json.error)
      }

      // Throw original error of axios
      throw new Error(error.message || error.code)
    }
    throw e
  }
}

export default capture
