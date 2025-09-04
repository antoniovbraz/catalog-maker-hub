const logger = {
  debug: (message: string, context?: Record<string, unknown>) => {
    console.debug(JSON.stringify({ level: 'debug', message, ...context }));
  },
  info: (message: string, context?: Record<string, unknown>) => {
    console.info(JSON.stringify({ level: 'info', message, ...context }));
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'warn', message, ...context }));
  },
  error: (message: string, error?: Error, context?: Record<string, unknown>) => {
    console.error(JSON.stringify({ 
      level: 'error', 
      message, 
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      ...context 
    }));
  }
};

export function setupLogger(headers: Headers): void {
  // No setup needed for this simple logger
}

export { logger };
