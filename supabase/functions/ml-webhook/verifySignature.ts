export async function verifySignature(
  body: string,
  signature: string | null,
  secret: string,
): Promise<boolean> {
  if (!signature || !secret) return false;
  const [, received] = signature.split('=');
  if (!received) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expected = new Uint8Array(digest);
  const receivedBytes = Uint8Array.from(
    received.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? [],
  );
  if (receivedBytes.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected[i] ^ receivedBytes[i];
  }
  return diff === 0;
}
