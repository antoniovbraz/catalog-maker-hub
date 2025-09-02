import pino from 'https://esm.sh/pino@8';

const originalConsole = globalThis.console;

const elasticUrl = Deno.env.get('ELASTIC_URL');
const elasticApiKey = Deno.env.get('ELASTIC_API_KEY');

const stream = elasticUrl
  ? {
      write: (msg: string) => {
        fetch(elasticUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(elasticApiKey ? { Authorization: `ApiKey ${elasticApiKey}` } : {}),
          },
          body: msg,
        }).catch((err) => {
          originalConsole.error('Elastic export error', err);
        });

        originalConsole.log(msg);
      },
    }
  : undefined;

const baseLogger = pino(
  {
    level: Deno.env.get('LOG_LEVEL') ?? 'info',
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  stream,
);

function bindLogger(logger: pino.Logger): Console {
  return {
    log: logger.info.bind(logger),
    info: logger.info.bind(logger),
    error: logger.error.bind(logger),
    warn: logger.warn.bind(logger),
    debug: logger.debug.bind(logger),
  } as Console;
}

// Default console without correlationId
globalThis.console = bindLogger(baseLogger);

export function setupLogger(headers: Headers) {
  const correlationId = headers.get('x-correlation-id') ?? crypto.randomUUID();
  const logger = baseLogger.child({ correlationId });
  globalThis.console = bindLogger(logger);
  return logger;
}

