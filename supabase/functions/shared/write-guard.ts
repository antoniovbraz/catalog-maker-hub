export function isMLWriteEnabled(): boolean {
  const denoFlag = typeof globalThis.Deno !== 'undefined' ? globalThis.Deno.env.get('ML_WRITE_ENABLED') : undefined;
  const nodeFlag = typeof process !== 'undefined' ? process.env.ML_WRITE_ENABLED : undefined;
  const value = denoFlag ?? nodeFlag ?? 'false';
  return value === 'true';
}
