export const requiredEnv = {
  frontend: [
    'VITE_AUTH_REDIRECT_URL',
  ],
  node: [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ],
  edge: {
    assistants: [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY',
    ],
    generateAd: [
      'OPENAI_API_KEY',
    ],
    generateAdChat: [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY',
    ],
    mlAuth: [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'MELI_CLIENT_ID',
      'MELI_CLIENT_SECRET',
      'MELI_REDIRECT_URI',
    ],
    mlSyncV2: [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'MELI_CLIENT_ID',
    ],
    mlTokenRenewal: [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'MELI_CLIENT_ID',
      'MELI_CLIENT_SECRET',
    ],
    mlWebhook: [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'MELI_WEBHOOK_SECRET',
    ],
    mlSecurityMonitor: [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
    ],
  },
} as const;
