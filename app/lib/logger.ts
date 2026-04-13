type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatLogEntry(level: LogLevel, message: string, context?: Record<string, any>): string {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };
  return JSON.stringify(entry);
}

export const logger = {
  debug(message: string, context?: Record<string, any>) {
    if (shouldLog('debug')) {
      console.log(formatLogEntry('debug', message, context));
    }
  },

  info(message: string, context?: Record<string, any>) {
    if (shouldLog('info')) {
      console.log(formatLogEntry('info', message, context));
    }
  },

  warn(message: string, context?: Record<string, any>) {
    if (shouldLog('warn')) {
      console.warn(formatLogEntry('warn', message, context));
    }
  },

  error(message: string, error?: Error, context?: Record<string, any>) {
    if (shouldLog('error')) {
      console.error(formatLogEntry('error', message, {
        ...context,
        error: error?.message,
        stack: error?.stack,
      }));
    }
  },
};

export function createLogger(context: string) {
  return {
    debug(message: string, ctx?: Record<string, any>) {
      logger.debug(`[${context}] ${message}`, ctx);
    },
    info(message: string, ctx?: Record<string, any>) {
      logger.info(`[${context}] ${message}`, ctx);
    },
    warn(message: string, ctx?: Record<string, any>) {
      logger.warn(`[${context}] ${message}`, ctx);
    },
    error(message: string, error?: Error, ctx?: Record<string, any>) {
      logger.error(`[${context}] ${message}`, error, ctx);
    },
  };
}

export async function logAnalytics(event: string, properties?: Record<string, any>) {
  const analyticsEntry = {
    event,
    timestamp: new Date().toISOString(),
    properties,
    userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : 'server',
  };

  console.log('[analytics]', JSON.stringify(analyticsEntry));

  if (process.env.UPSTASH_REDIS_REST_URL) {
    try {
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      
      await redis.lpush('analytics:events', JSON.stringify(analyticsEntry));
      await redis.ltrim('analytics:events', 0, 999);
    } catch (error) {
      console.error('[analytics] Failed to store:', error);
    }
  }
}