/**
 * Structured logger for Mémoire engine.
 */

import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";
let prettyTransport: ReturnType<typeof pino.transport> | undefined;

export function shouldUsePrettyTransport(): boolean {
  if (isProduction) return false;
  if (process.env.NODE_ENV === "test") return false;
  if (process.env.VITEST === "true") return false;
  return true;
}

function getPrettyTransport() {
  if (!shouldUsePrettyTransport()) return undefined;
  if (!prettyTransport) {
    prettyTransport = pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    });
  }
  return prettyTransport;
}

export function createLogger(name: string) {
  const options = {
    name,
    level: process.env.MEMOIRE_LOG_LEVEL ?? process.env.NOCHE_LOG_LEVEL ?? "warn",
  };
  const transport = getPrettyTransport();
  return transport ? pino(options, transport) : pino(options);
}
