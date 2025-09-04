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

let currentLogger: pino.Logger = baseLogger;

function getLogger(): pino.Logger {
  return currentLogger;
}

globalThis.console = {
  log: (...args: unknown[]) => getLogger().info(...args),
  info: (...args: unknown[]) => getLogger().info(...args),
  error: (...args: unknown[]) => getLogger().error(...args),
  warn: (...args: unknown[]) => getLogger().warn(...args),
  debug: (...args: unknown[]) => getLogger().debug(...args),
} as Console;

export function setupLogger(headers: Headers) {
  const correlationId = headers.get('x-correlation-id') ?? crypto.randomUUID();
  const logger = baseLogger.child({ correlationId });
  currentLogger = logger;
  return logger;
}

