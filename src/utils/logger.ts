/**
 * Sistema de logging estruturado para a aplicação
 * Substitui console.log por um sistema mais profissional
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn', 
  INFO = 'info',
  DEBUG = 'debug'
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  timestamp: string;
  data?: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  
  private formatMessage(level: LogLevel, message: string, context?: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      data
    };
  }

  private log(entry: LogEntry): void {
    if (!this.isDevelopment && entry.level === LogLevel.DEBUG) {
      return; // Não loggar debug em produção
    }

    const prefix = `[${entry.timestamp}] ${entry.level.toUpperCase()}`;
    const contextInfo = entry.context ? ` [${entry.context}]` : '';
    const fullMessage = `${prefix}${contextInfo}: ${entry.message}`;

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(fullMessage, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(fullMessage, entry.data);
        break;
      case LogLevel.INFO:
        console.info(fullMessage, entry.data);
        break;
      case LogLevel.DEBUG:
        console.log(fullMessage, entry.data);
        break;
    }
  }

  error(message: string, context?: string, data?: unknown): void {
    this.log(this.formatMessage(LogLevel.ERROR, message, context, data));
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.log(this.formatMessage(LogLevel.WARN, message, context, data));
  }

  info(message: string, context?: string, data?: unknown): void {
    this.log(this.formatMessage(LogLevel.INFO, message, context, data));
  }

  debug(message: string, context?: string, data?: unknown): void {
    this.log(this.formatMessage(LogLevel.DEBUG, message, context, data));
  }
}

export const logger = new Logger();

/**
 * Hook para logging em componentes React
 */
export function useLogger(context: string) {
  return {
    error: (message: string, data?: unknown) => logger.error(message, context, data),
    warn: (message: string, data?: unknown) => logger.warn(message, context, data),
    info: (message: string, data?: unknown) => logger.info(message, context, data),
    debug: (message: string, data?: unknown) => logger.debug(message, context, data),
  };
}