import { describe, it, expect } from 'vitest';

type MLAuthTokens = {
  tenant_id: string;
  access_token?: string | null;
  refresh_token?: string | null;
};

function encryptMlTokens(row: MLAuthTokens): MLAuthTokens {
  const encrypted = { ...row };
  if (encrypted.access_token) {
    encrypted.access_token = Buffer.from(encrypted.access_token).toString('base64');
  }
  if (encrypted.refresh_token) {
    encrypted.refresh_token = Buffer.from(encrypted.refresh_token).toString('base64');
  }
  return encrypted;
}

describe('encrypt_ml_tokens trigger', () => {
  it('encrypts tokens on insert and update', () => {
    let record = encryptMlTokens({ tenant_id: 't1', access_token: 'access', refresh_token: 'refresh' });
    expect(record.access_token).not.toBe('access');
    expect(record.refresh_token).not.toBe('refresh');
    expect(() => Buffer.from(record.access_token!, 'base64')).not.toThrow();
    expect(() => Buffer.from(record.refresh_token!, 'base64')).not.toThrow();

    record = encryptMlTokens({ ...record, access_token: 'newAccess', refresh_token: 'newRefresh' });
    expect(record.access_token).not.toBe('newAccess');
    expect(record.refresh_token).not.toBe('newRefresh');
    expect(() => Buffer.from(record.access_token!, 'base64')).not.toThrow();
    expect(() => Buffer.from(record.refresh_token!, 'base64')).not.toThrow();
  });
});
