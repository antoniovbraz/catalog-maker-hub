import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger, useLogger } from '@/utils/logger';

// Ensure console methods are spied
beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('logger', () => {
  it('uses console.error for error level', () => {
    logger.error('oops', 'CTX', { foo: 'bar' });
    expect(console.error).toHaveBeenCalledOnce();
  });

  it('uses console.warn for warn level', () => {
    logger.warn('warn msg');
    expect(console.warn).toHaveBeenCalledOnce();
  });

  it('uses console.info for info level', () => {
    logger.info('info msg');
    expect(console.info).toHaveBeenCalledOnce();
  });

  it('uses console.log for debug level', () => {
    logger.debug('debug msg');
    expect(console.log).toHaveBeenCalledOnce();
  });

  it('skips debug logs in production mode', () => {
    (logger as any).isDevelopment = false;
    logger.debug('no log');
    expect(console.log).toHaveBeenCalledTimes(0);
    (logger as any).isDevelopment = true;
  });
});

describe('useLogger', () => {
  it('delegates to logger with provided context', () => {
    const spy = vi.spyOn(logger, 'info');
    const log = useLogger('CTX');
    log.info('hello');
    expect(spy).toHaveBeenCalledWith('hello', 'CTX', undefined);
  });

  it('provides wrappers for all log levels', () => {
    const log = useLogger('CTX');
    const spyError = vi.spyOn(logger, 'error');
    const spyWarn = vi.spyOn(logger, 'warn');
    const spyDebug = vi.spyOn(logger, 'debug');

    log.error('err');
    log.warn('warn');
    log.debug('dbg');

    expect(spyError).toHaveBeenCalledWith('err', 'CTX', undefined);
    expect(spyWarn).toHaveBeenCalledWith('warn', 'CTX', undefined);
    expect(spyDebug).toHaveBeenCalledWith('dbg', 'CTX', undefined);
  });
});
