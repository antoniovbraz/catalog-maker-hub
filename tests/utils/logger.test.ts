import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger, useLogger, Logger } from '@/utils/logger';

// Ensure console methods are spied
beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('logger', () => {
  it('uses console.log for error level', () => {
    logger.error('oops', new Error('test error'), { foo: 'bar' });
    expect(console.log).toHaveBeenCalledOnce();
  });

  it('uses console.log for warn level', () => {
    logger.warn('warn msg');
    expect(console.log).toHaveBeenCalledOnce();
  });

  it('uses console.log for info level', () => {
    logger.info('info msg');
    expect(console.log).toHaveBeenCalledOnce();
  });

  it('uses console.log for debug level', () => {
    logger.debug('debug msg');
    expect(console.log).toHaveBeenCalledOnce();
  });

  it('logs messages to console', () => {
    logger.debug('debug msg');
    expect(console.log).toHaveBeenCalled();
  });
});

describe('useLogger', () => {
  it('creates a new logger instance with provided scope', () => {
    const log = useLogger('CTX');
    expect(log).toBeInstanceOf(Logger);
  });

  it('provides all log level methods', () => {
    const log = useLogger('CTX');
    expect(typeof log.error).toBe('function');
    expect(typeof log.warn).toBe('function');
    expect(typeof log.info).toBe('function');
    expect(typeof log.debug).toBe('function');
  });
});
