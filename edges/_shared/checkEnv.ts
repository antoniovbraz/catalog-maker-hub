export function checkEnv(vars: readonly string[]) {
  const missing = vars.filter((name) => !Deno.env.get(name));
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for edge runtime: ${missing.join(', ')}`,
    );
  }
}
