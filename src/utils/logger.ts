import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  scope?: string;
  tenantId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

export class Logger {
  private correlationId: string;
  private scope: string;

  constructor(scope: string = 'app', correlationId?: string) {
    this.scope = scope;
    this.correlationId = correlationId || this.generateCorrelationId();
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(entry: Omit<LogEntry, 'timestamp' | 'scope' | 'correlationId'>): void {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", { locale: ptBR }),
      scope: this.scope,
      correlationId: this.correlationId,
    };

    // Em produção, enviar para serviço de logging
    if (import.meta.env.PROD) {
      // TODO: Integrar com serviço de logging (ex: Sentry, LogRocket)
      console.log(JSON.stringify(logEntry));
    } else {
      // Em desenvolvimento, log colorido
      const colors = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m', // red
        reset: '\x1b[0m'
      };
      
      console.log(
        `${colors[entry.level]}[${entry.level.toUpperCase()}] ${this.scope}${colors.reset}: ${entry.message}`,
        entry.metadata ? entry.metadata : ''
      );
    }
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log({ level: 'debug', message, metadata });
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log({ level: 'info', message, metadata });
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log({ level: 'warn', message, metadata });
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.log({ 
      level: 'error', 
      message, 
      metadata: {
        ...metadata,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      }
    });
  }

  child(scope: string): Logger {
    return new Logger(`${this.scope}:${scope}`, this.correlationId);
  }
}

// Factory function
export function createLogger(scope: string): Logger {
  return new Logger(scope);
}

// Hook for components
export function useLogger(scope: string): Logger {
  return createLogger(scope);
}

// Default logger instance
export const logger = createLogger('catalog-maker-hub');