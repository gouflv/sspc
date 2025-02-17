import { CaptureParamsType } from "@pptr/core"
import axios, { AxiosError } from "axios"

type CaptureResponseError = {
  success: boolean
  error: string
}

async function capture(
  params: CaptureParamsType,
  {
    url = process.env.PPTR_HOST || "http://localhost:3000/capture",
    timeout = 1000 * 60 * 5, // 5 minutes
  }: { url?: string; timeout?: number } = {},
) {
  try {
    const response = await axios.post(url, params, {
      timeout,
      responseType: "stream",
      headers: {
        "Content-Type": "application/json",
      },
    })
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
