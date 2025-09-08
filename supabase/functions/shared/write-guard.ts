export function isMLWriteEnabled(): boolean {
  const denoGlobal = globalThis as typeof globalThis & {
    Deno?: { env: { get(key: string): string | undefined } };
  };
  const denoFlag = denoGlobal.Deno?.env.get('ML_WRITE_ENABLED');
  const nodeFlag = typeof process !== 'undefined' ? process.env.ML_WRITE_ENABLED : undefined;
  const value = denoFlag ?? nodeFlag ?? 'false';
  return value === 'true';
}
