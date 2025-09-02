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
    mockSupabaseClient.functions.invoke.mockResolvedValue({
      data: { auth_url: 'https://auth.url', state: 'state123' },
      error: null,
    });

    const result = await MLService.startAuth();

    expect(result).toEqual({ auth_url: 'https://auth.url', state: 'state123' });
    expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('ml-auth', {
      body: { action: 'start_auth' },
      headers: { Authorization: 'Bearer token' },
    });
  });

  it('handles callback with provided code and state', async () => {
    mockSupabaseClient.functions.invoke.mockResolvedValue({ data: null, error: null });

    await MLService.handleCallback('code123', 'state456');

    expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('ml-auth', {
      body: { action: 'handle_callback', code: 'code123', state: 'state456' },
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
