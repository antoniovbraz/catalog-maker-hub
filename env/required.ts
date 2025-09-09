export const requiredEnv = {
  frontend: [
    'VITE_AUTH_REDIRECT_URL',
  ],
  node: [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ],
  edge: [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'MELI_CLIENT_ID',
    'MELI_CLIENT_SECRET',
    'MELI_REDIRECT_URI',
    'MELI_WEBHOOK_SECRET',
    'OPENAI_API_KEY',
  ],
} as const;
