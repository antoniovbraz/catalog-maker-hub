/**
 * Structured logger for production use
 * Replaces console.log statements with proper JSON logging
 */

interface LogData {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  scope: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message?: string;
  data?: LogData;
  userId?: string;
  tenantId?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private createEntry(
    scope: string, 
    level: LogEntry['level'],
    message?: string, 
    data?: LogData
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      scope,
      level,
      message,
      data: this.sanitizeData(data),
    };
  }

  private sanitizeData(data?: LogData): LogData | undefined {
    if (!data) return undefined;
    
    // Remove sensitive information
    const sanitized = { ...data };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
    
    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  private log(entry: LogEntry) {
    if (this.isDevelopment) {
      // In development, use readable console output
      const color = {
        info: '\x1b[36m',
        warn: '\x1b[33m', 
        error: '\x1b[31m',
        debug: '\x1b[90m'
      }[entry.level];
      
      console.log(
        `${color}[${entry.timestamp}] ${entry.level.toUpperCase()} [${entry.scope}]:\x1b[0m`,
        entry.message || '',
        entry.data || ''
      );
    } else {
      // In production, use structured JSON
      console.log(JSON.stringify(entry));
    }
  }

  info(scope: string, message?: string, data?: LogData) {
    this.log(this.createEntry(scope, 'info', message, data));
  }

  warn(scope: string, message?: string, data?: LogData) {
    this.log(this.createEntry(scope, 'warn', message, data));
  }

  error(scope: string, message?: string, data?: LogData) {
    this.log(this.createEntry(scope, 'error', message, data));
  }

  debug(scope: string, message?: string, data?: LogData) {
    this.log(this.createEntry(scope, 'debug', message, data));
  }
}

export const logger = new Logger();