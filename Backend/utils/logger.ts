// utils/logger.ts
const write = (level: "info" | "warn" | "error", msg: string, meta = {}) => {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...meta });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
};

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => write("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => write("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => write("error", msg, meta),
  security: (event: string, meta?: Record<string, unknown>) =>
    write("warn", `security.${event}`, meta),
};