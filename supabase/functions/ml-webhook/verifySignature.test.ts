import { describe, it, expect } from 'vitest';
import { verifySignature } from './verifySignature';

const body = JSON.stringify({ foo: 'bar' });
const secret = 'secret';

async function sign() {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

describe('verifySignature', () => {
  it('validates correct signature', async () => {
    const sig = await sign();
    const valid = await verifySignature(body, `sha256=${sig}`, secret);
    expect(valid).toBe(true);
  });

  it('rejects invalid signature', async () => {
    const sig = await sign();
    const valid = await verifySignature(body, `sha256=bad${sig}`, secret);
    expect(valid).toBe(false);
  });

  it('rejects when signature missing', async () => {
    const valid = await verifySignature(body, null, secret);
    expect(valid).toBe(false);
  });
});
