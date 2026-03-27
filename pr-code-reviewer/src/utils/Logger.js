import winston from 'winston';

/**
 * Logger utility for consistent logging across the application
 */
export class Logger {
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
      ),
      defaultMeta: { service: 'pr-code-reviewer' },
      transports: [
        // Write all logs to console
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(
              ({ level, message, timestamp, ...metadata }) => {
                let msg = `${timestamp} [${level}]: ${message}`;
                if (Object.keys(metadata).length > 0) {
                  msg += ` ${JSON.stringify(metadata)}`;
                }
                return msg;
              }
            )
          ),
        }),
        // Write all logs to file
        new winston.transports.File({
          filename: 'review-output/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'review-output/combined.log',
        }),
      ],
    });
  }

  info(message, ...args) {
    this.logger.info(message, ...args);
  }

  warn(message, ...args) {
    this.logger.warn(message, ...args);
  }

  error(message, ...args) {
    this.logger.error(message, ...args);
  }

  debug(message, ...args) {
    this.logger.debug(message, ...args);
  }
}

// Made with Bob
