import path from "node:path";
import pino from "pino";

const dir = path.resolve(__dirname, "../logs");
const filePath = path.join(dir, `pptr.log`);

const logger = pino({
  level: process.env["LOG_LEVEL"] || "info",
  transport: {
    targets: [
      {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
      {
        target: "pino/file",
        options: {
          destination: filePath,
          makeDir: true,
        },
      },
    ],
  },
});

export default logger;
