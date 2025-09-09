export interface FetchRetryOptions {
  retries?: number;
  baseDelayMs?: number;
  timeoutMs?: number;
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  options: FetchRetryOptions = {}
): Promise<Response> {
  const { retries = 3, baseDelayMs = 500, timeoutMs = 30000 } = options;

  let attempt = 0;
  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      const shouldRetry = response.status === 429 || response.status >= 500;

      console.log(
        JSON.stringify({
          type: 'ml_fetch_attempt',
          url,
          attempt: attempt + 1,
          status: response.status,
          retry: shouldRetry && attempt < retries,
        }),
      );

      if (!shouldRetry) {
        console.log(
          JSON.stringify({ type: 'ml_fetch_success', url, status: response.status }),
        );
        return response;
      }

      if (attempt === retries) {
        console.log(
          JSON.stringify({ type: 'ml_fetch_failure', url, status: response.status }),
        );
        return response;
      }
    } catch (error) {
      console.log(
        JSON.stringify({
          type: 'ml_fetch_error',
          url,
          attempt: attempt + 1,
          error: error instanceof Error ? error.message : String(error),
          retry: attempt < retries,
        }),
      );
      if (attempt === retries) throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    const delay = baseDelayMs * Math.pow(2, attempt);
    await new Promise((resolve) => setTimeout(resolve, delay));
    attempt++;
  }

  throw new Error('fetchWithRetry failed');
}
