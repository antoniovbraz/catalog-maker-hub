// @deno-types="https://deno.land/x/types/deno.d.ts"
declare const Deno: any;

export function isMLWriteEnabled(): boolean {
  const denoFlag = typeof Deno !== 'undefined' ? Deno.env.get('ML_WRITE_ENABLED') : undefined;
  const nodeFlag = typeof process !== 'undefined' ? process.env.ML_WRITE_ENABLED : undefined;
  const value = denoFlag ?? nodeFlag ?? 'false';
  return value === 'true';
}
