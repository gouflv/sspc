import Poll from "generic-pool"
import { launch } from "./browser"
import { env } from "./env"
import logger from "./logger"

export const pool = Poll.createPool(
  {
    create: () => launch(),
    destroy: (browser) => browser.close(),
  },
  {
    max: env.POOL_SIZE_MAX,
    min: env.POOL_SIZE_MIN,
  },
)

pool.on("factoryCreateError", (e) => {
  logger.error("Factory create error", e)
})

pool.on("factoryDestroyError", (e) => {
  logger.error("Factory destroy error", e)
})
