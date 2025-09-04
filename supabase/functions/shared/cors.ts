export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://peepers-hub.lovable.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

export function handleCors(req: Request): Response | undefined {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
}
