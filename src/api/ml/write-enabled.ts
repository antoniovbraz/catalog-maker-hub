const getCookieValue = (cookieHeader: string | null, name: string): string | null => {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
};

export default async function handler(req: Request): Promise<Response> {
  const token = getCookieValue(req.headers.get('cookie'), 'sb-access-token');

  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  const enabled = (process.env.ML_WRITE_ENABLED ?? 'false') === 'true';
  return new Response(
    JSON.stringify({ enabled }),
    {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}
