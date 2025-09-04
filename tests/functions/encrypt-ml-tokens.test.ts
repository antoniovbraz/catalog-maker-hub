import { execSync } from 'child_process';
import { describe, it, beforeAll, expect } from 'vitest';

function run(sql: string) {
  return execSync(`sudo -u postgres psql -X -A -t -c "${sql}"`, { encoding: 'utf8' }).trim();
}

beforeAll(() => {
  try {
    execSync('pg_ctlcluster 16 main start');
  } catch (err) {
    // cluster already running
  }

  run('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  run('DROP TABLE IF EXISTS ml_auth_tokens');
  run(`CREATE TABLE ml_auth_tokens (
    tenant_id text,
    access_token text,
    refresh_token text
  )`);
  run(`CREATE OR REPLACE FUNCTION public.encrypt_ml_tokens()
RETURNS trigger AS '
DECLARE
  secret_key text := current_setting(''app.ml_encryption_key'', true);
BEGIN
  IF secret_key IS NULL THEN
    secret_key := ''changeme'';
  END IF;
  IF NEW.access_token IS NOT NULL THEN
    NEW.access_token := encode(pgp_sym_encrypt(NEW.access_token, secret_key), ''base64'');
  END IF;
  IF NEW.refresh_token IS NOT NULL THEN
    NEW.refresh_token := encode(pgp_sym_encrypt(NEW.refresh_token, secret_key), ''base64'');
  END IF;
  RETURN NEW;
END;
' LANGUAGE plpgsql SECURITY DEFINER;`);
  run('DROP TRIGGER IF EXISTS encrypt_ml_tokens_trigger ON public.ml_auth_tokens');
  run(`CREATE TRIGGER encrypt_ml_tokens_trigger
    BEFORE INSERT OR UPDATE ON public.ml_auth_tokens
    FOR EACH ROW EXECUTE FUNCTION public.encrypt_ml_tokens()`);
});

describe('encrypt_ml_tokens trigger', () => {
  it('encrypts tokens on insert and update', () => {
    run("INSERT INTO ml_auth_tokens (tenant_id, access_token, refresh_token) VALUES ('t1', 'access', 'refresh')");
    let res = run("SELECT access_token || ',' || refresh_token FROM ml_auth_tokens WHERE tenant_id='t1'");
    let [a1, r1] = res.split(',');
    expect(a1).not.toBe('access');
    expect(r1).not.toBe('refresh');
    expect(() => Buffer.from(a1, 'base64')).not.toThrow();
    expect(() => Buffer.from(r1, 'base64')).not.toThrow();

    run("UPDATE ml_auth_tokens SET access_token='newAccess', refresh_token='newRefresh' WHERE tenant_id='t1'");
    res = run("SELECT access_token || ',' || refresh_token FROM ml_auth_tokens WHERE tenant_id='t1'");
    ;[a1, r1] = res.split(',');
    expect(a1).not.toBe('newAccess');
    expect(r1).not.toBe('newRefresh');
    expect(() => Buffer.from(a1, 'base64')).not.toThrow();
    expect(() => Buffer.from(r1, 'base64')).not.toThrow();
  });
});
