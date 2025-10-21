/**
 * Centralized logging utility with level-based filtering and deduplication
 * 
 * Usage:
 *   logger.debug('Component', 'Detailed debug info', data);
 *   logger.info('Component', 'Important event', data);
 *   logger.warn('Component', 'Warning message', data);
 *   logger.error('Component', 'Error occurred', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  enableDeduplication: boolean;
  deduplicationWindow: number; // milliseconds
}

class Logger {
  private config: LoggerConfig;
  private recentLogs: Map<string, number> = new Map();
  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor() {
    // In production, only show warnings and errors
    const isDevelopment = import.meta.env.DEV;
    
    this.config = {
      level: isDevelopment ? 'debug' : 'warn',
      enableDeduplication: true,
      deduplicationWindow: 1000 // 1 second
    };
  }

  private shouldLog(level: LogLevel, message: string): boolean {
    // Check log level
    if (this.levels[level] < this.levels[this.config.level]) {
      return false;
    }

    // Check deduplication
    if (this.config.enableDeduplication) {
      const key = `${level}:${message}`;
      const lastLogTime = this.recentLogs.get(key);
      const now = Date.now();

      if (lastLogTime && now - lastLogTime < this.config.deduplicationWindow) {
        return false; // Skip duplicate
      }

      this.recentLogs.set(key, now);

      // Clean up old entries periodically
      if (this.recentLogs.size > 100) {
        const cutoff = now - this.config.deduplicationWindow;
        for (const [k, time] of this.recentLogs.entries()) {
          if (time < cutoff) {
            this.recentLogs.delete(k);
          }
        }
      }
    }

    return true;
  }

  private formatMessage(context: string, message: string, data?: any): any[] {
    const emoji = {
      debug: '🔍',
      info: '✅',
      warn: '⚠️',
      error: '❌'
    };

    const prefix = `${context}:`;
    
    if (data !== undefined) {
      return [prefix, message, data];
    }
    
    return [prefix, message];
  }

  debug(context: string, message: string, data?: any): void {
    if (this.shouldLog('debug', `${context}:${message}`)) {
      console.log(...this.formatMessage(context, message, data));
    }
  }

  info(context: string, message: string, data?: any): void {
    if (this.shouldLog('info', `${context}:${message}`)) {
      console.log(...this.formatMessage(context, message, data));
    }
  }

  warn(context: string, message: string, data?: any): void {
    if (this.shouldLog('warn', `${context}:${message}`)) {
      console.warn(...this.formatMessage(context, message, data));
    }
  }

  error(context: string, message: string, data?: any): void {
    if (this.shouldLog('error', `${context}:${message}`)) {
      console.error(...this.formatMessage(context, message, data));
    }
  }

  /**
   * Force log a message regardless of level or deduplication
   */
  force(level: LogLevel, context: string, message: string, data?: any): void {
    const logFn = {
      debug: console.log,
      info: console.log,
      warn: console.warn,
      error: console.error
    }[level];

    logFn(...this.formatMessage(context, message, data));
  }

  /**
   * Clear recent logs cache (useful for testing)
   */
  clearCache(): void {
    this.recentLogs.clear();
  }

  /**
   * Update logger configuration
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const logger = new Logger();
export default logger;

