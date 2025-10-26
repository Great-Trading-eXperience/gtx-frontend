/**
 * Centralized logging utility
 * Replace console statements throughout the codebase
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  context?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private shouldLog(level: LogLevel): boolean {
    if (!this.isDevelopment) return false;
    return true;
  }

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const prefix = context ? `[${context}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${prefix} ${message}`;
  }

  private addLog(level: LogLevel, message: string, data?: any, context?: string): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      context
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  debug(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('debug')) return;
    
    const formattedMessage = this.formatMessage('debug', message, context);
    console.debug(formattedMessage, data);
    this.addLog('debug', message, data, context);
  }

  info(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('info')) return;
    
    const formattedMessage = this.formatMessage('info', message, context);
    console.info(formattedMessage, data);
    this.addLog('info', message, data, context);
  }

  warn(message: string, data?: any, context?: string): void {
    const formattedMessage = this.formatMessage('warn', message, context);
    console.warn(formattedMessage, data);
    this.addLog('warn', message, data, context);
  }

  error(message: string, error?: Error | any, context?: string): void {
    const formattedMessage = this.formatMessage('error', message, context);
    console.error(formattedMessage, error);
    this.addLog('error', message, error, context);
  }

  // Get recent logs for debugging
  getLogs(level?: LogLevel, limit = 50): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(-limit);
  }

  // Clear all logs
  clearLogs(): void {
    this.logs = [];
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for specific contexts
export const createLogger = (context: string) => ({
  debug: (message: string, data?: any) => logger.debug(message, data, context),
  info: (message: string, data?: any) => logger.info(message, data, context),
  warn: (message: string, data?: any) => logger.warn(message, data, context),
  error: (message: string, error?: Error | any) => logger.error(message, error, context),
});

// Context-specific loggers
export const tradingLogger = createLogger('trading');
export const swapLogger = createLogger('swap');
export const walletLogger = createLogger('wallet');
export const apiLogger = createLogger('api');
export const websocketLogger = createLogger('websocket');