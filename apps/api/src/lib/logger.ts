import { pino } from "pino"
import { env, isProduction } from "../env"

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : isProduction ? "info" : "debug",
  // Pretty output is a development convenience only; production logs stay JSON
  // so the hosting platform can parse them.
  transport: isProduction
    ? undefined
    : { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } },
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "password", "*.password"],
    censor: "[redacted]",
  },
})
