import { describe, it, expect, beforeEach } from 'vitest';
import { MLService } from '@/services/ml-service';
import { testUtils } from '../setup';

const { mockSupabaseClient } = testUtils;

describe('ml-auth service', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });
  });

  it('starts auth flow and returns url', async () => {
    const state = 'tenant123_1712345678901_550e8400-e29b-41d4-a716-446655440000';
    mockSupabaseClient.functions.invoke.mockResolvedValue({
      data: { auth_url: 'https://auth.url', state },
      error: null,
    });

    const result = await MLService.startAuth();

    expect(result).toEqual({ auth_url: 'https://auth.url', state });
    expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('ml-auth', {
      body: { action: 'start_auth' },
      headers: { Authorization: 'Bearer token' },
    });
  });

  it('handles callback with provided code and state', async () => {
    const state = 'tenant123_1712345678901_550e8400-e29b-41d4-a716-446655440000';
    mockSupabaseClient.functions.invoke.mockResolvedValue({ data: null, error: null });

    await MLService.handleCallback('code123', state);

    expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('ml-auth', {
      body: { action: 'handle_callback', code: 'code123', state },
      headers: { Authorization: 'Bearer token' },
    });
  });

  it('refreshes token successfully', async () => {
    mockSupabaseClient.functions.invoke.mockResolvedValue({ data: { success: true }, error: null });

    await MLService.refreshToken();

    expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('ml-auth', {
      body: { action: 'refresh_token' },
      headers: { Authorization: 'Bearer token' },
    });
  });
});
