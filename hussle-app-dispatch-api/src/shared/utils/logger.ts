/**
 * Minimal structured logger matching the interface used by auth code.
 * Uses process.stdout/process.stderr — no Winston dependency.
 */

export type LogMeta = Record<string, unknown>;

export interface Logger {
  info(message: string, meta?: LogMeta): void;
  debug(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, meta?: LogMeta): void;
}

const formatEntry = (level: string, message: string, meta?: LogMeta): string => {
  const timestamp = new Date().toISOString();
  const base = { timestamp, level, message, ...meta };
  return JSON.stringify(base);
};

export const logger: Logger = {
  info: (message, meta) => {
    process.stdout.write(`${formatEntry('info', message, meta)}\n`);
  },
  debug: (message, meta) => {
    if (process.env['NODE_ENV'] !== 'production') {
      process.stdout.write(`${formatEntry('debug', message, meta)}\n`);
    }
  },
  warn: (message, meta) => {
    process.stderr.write(`${formatEntry('warn', message, meta)}\n`);
  },
  error: (message, meta) => {
    process.stderr.write(`${formatEntry('error', message, meta)}\n`);
  },
};
