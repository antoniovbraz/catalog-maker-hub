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

  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ml-auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action: 'start_auth' }),
  });

  if (!response.ok) {
    const text = await response.text();
    return new Response(text, { status: response.status });
  }

  const { auth_url, state } = await response.json();

  return new Response(
    JSON.stringify({ auth_url, state }),
    {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}
