import { requiredEnv } from '../../env/required.ts';

export function checkEnv() {
  const missing = requiredEnv.edge.filter((name) => !Deno.env.get(name));
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables for edge runtime: ${missing.join(', ')}`);
  }
}
