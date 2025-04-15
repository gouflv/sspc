import Poll from "generic-pool"
import { launch } from "./browser"
import logger from "./logger"

export const pool = Poll.createPool(
  {
    create: () => launch(),
    destroy: (browser) => browser.close(),
  },
  {
    max: parseInt(process.env["POOL_SIZE"] || "4"),
    min: 0,
  },
)

pool.on("factoryCreateError", (e) => {
  logger.error("Factory create error", e)
})

pool.on("factoryDestroyError", (e) => {
  logger.error("Factory destroy error", e)
})
