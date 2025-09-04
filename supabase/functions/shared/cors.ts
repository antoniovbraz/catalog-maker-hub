export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://peepers-hub.lovable.app',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Request-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Headers': req.headers.get('Access-Control-Request-Headers') || '*'
      }
    });
  }
  return null;
}

export function handleCors(req: Request): Response | undefined {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
}
