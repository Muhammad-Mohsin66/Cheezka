const winston = require('winston');
const Sentry = require('@sentry/node');

// Initialize Sentry if DSN is configured
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
}

// Custom format for clean console logs during development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// Standard JSON format for production logs (ideal for ELK/CloudWatch)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? prodFormat : consoleFormat,
  transports: [
    new winston.transports.Console(),
    // In production, also log errors to file
    ...(process.env.NODE_ENV === 'production'
      ? [new winston.transports.File({ filename: 'logs/error.log', level: 'error' })]
      : []
    )
  ],
});

// Helper to log and report errors to Sentry
logger.reportError = (err, context = {}) => {
  logger.error(err.message || err, { stack: err.stack, ...context });
  if (process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context.user) {
        scope.setUser({ id: context.user.id, email: context.user.email, role: context.user.role });
      }
      if (context.tags) scope.setTags(context.tags);
      if (context.extra) scope.setExtras(context.extra);
      Sentry.captureException(err);
    });
  }
};

module.exports = logger;
