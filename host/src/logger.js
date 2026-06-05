// -- Structured Logger --
// All output goes to stderr so stdout stays clean for Native Messaging.

const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const LEVEL = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.INFO;

function log(level, label, msg, data) {
  if (LEVELS[level] < LEVEL) return;
  const entry = {
    t: new Date().toISOString(),
    level: label,
    msg,
    ...(data ? { data } : {}),
  };
  process.stderr.write(JSON.stringify(entry) + "\n");
}

export const logger = {
  debug: (msg, data) => log("DEBUG", "DBG", msg, data),
  info: (msg, data) => log("INFO", "INF", msg, data),
  warn: (msg, data) => log("WARN", "WRN", msg, data),
  error: (msg, data) => log("ERROR", "ERR", msg, data),
};
