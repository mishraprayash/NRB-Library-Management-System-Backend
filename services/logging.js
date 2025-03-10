
import { createLogger, format, transports } from "winston";
const { combine, timestamp, json } = format;

export const logger = createLogger({
  level: "info",
  format: combine(
    timestamp(
      { format: 'YYYY-MM-DD hh:mm:ss.SSS A' }
    ),
    json()
  ),
  transports: [
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
});