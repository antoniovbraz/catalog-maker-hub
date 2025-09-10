import { config } from 'dotenv';
import { requiredEnv } from '../env/required.ts';

// Load environment variables from .env file
config();

function checkEnv(vars: readonly string[], runtime: string) {
  const missing = vars.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables for ${runtime}: ${missing.join(', ')}`);
  }
}

try {
  checkEnv(requiredEnv.node, 'Node scripts');
  checkEnv(requiredEnv.frontend, 'frontend');
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}
