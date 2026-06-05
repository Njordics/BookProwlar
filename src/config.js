const dotenv = require("dotenv");

dotenv.config();

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function toPort(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 65535) {
    return fallback;
  }
  return parsed;
}

const config = {
  port: toPort(process.env.PORT, 56545),
  pollIntervalMinutes: toPositiveInt(process.env.POLL_INTERVAL_MINUTES, 60)
};

module.exports = { config };
