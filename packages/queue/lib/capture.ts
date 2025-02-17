import { CaptureParamsType } from "@pptr/core"
import axios, { AxiosError } from "axios"
import { Stream } from "node:stream"
import logger from "./logger"

type CaptureResponseError = {
  success: boolean
  error: string
}

const CaptureEndpoint =
  process.env.CAPTURE_ENDPOINT || "http://localhost:3000/capture"

const Timeout = 1000 * 60 * 5 // 5 minutes

async function capture(
  id: string,
  params: CaptureParamsType,
): Promise<{
  contentType: string
  stream: Stream
}> {
  logger.debug(`Capture started: ${id}`)

  try {
    const response = await axios.post(CaptureEndpoint, params, {
      timeout: Timeout,
      responseType: "stream",
      headers: {
        "Content-Type": "application/json",
        "request-id": id,
      },
    })

    const duration = response.headers["duration"]

    logger.debug("Capture completed", { duration })

    return {
      contentType: response.headers["content-type"],
      stream: response.data,
    }
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const error = e as AxiosError<CaptureResponseError>
      const response = error.response?.data
      if (response?.error) {
        throw new Error(response.error)
      }
      throw new Error(error.message || error.code)
    }
    throw e
  }
}

export default capture
