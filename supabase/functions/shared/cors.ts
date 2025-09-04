export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://peepers-hub.lovable.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

export function handleCors(req: Request): Response | undefined {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
}
