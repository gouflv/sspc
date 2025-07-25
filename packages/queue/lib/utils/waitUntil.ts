import { d } from "@sspc/core"

export interface WaitOptions {
  pollInterval: number
  maxWaitTime: number
}

export async function waitUntil(
  check: () => Promise<boolean>,
  options?: Partial<WaitOptions>,
): Promise<boolean> {
  const config: WaitOptions = {
    pollInterval: d("1 second"),
    maxWaitTime: d("1 mins"),
    ...options,
  }
  const startTime = Date.now()
  while (true) {
    try {
      const result = await check()
      if (result) return result
    } catch (e) {
      throw e
    }
    if (Date.now() - startTime > config.maxWaitTime) {
      throw new Error("Wait timeout")
    }
    await new Promise((resolve) => setTimeout(resolve, config.pollInterval))
  }
}
