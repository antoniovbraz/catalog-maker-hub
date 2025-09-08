import { describe, it, expect, beforeEach } from 'vitest';
import { callMLFunction } from '@/utils/ml/ml-api';
import { testUtils } from '../setup';

const { mockSupabaseClient } = testUtils;

describe('ml-webhook function', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });
  });

  it('throws error when signature is invalid', async () => {
    mockSupabaseClient.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Invalid webhook signature' },
    });

    await expect(
      callMLFunction('ml-webhook', 'process', {}, { headers: { 'X-Hub-Signature': 'bad' } })
    ).rejects.toThrow('Invalid webhook signature');

    expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('ml-webhook', {
      body: { action: 'process' },
      headers: { Authorization: 'Bearer token', 'X-Hub-Signature': 'bad' },
    });
  });

  it('throws error when signature is missing', async () => {
    mockSupabaseClient.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Invalid webhook signature' },
    });

    await expect(
      callMLFunction('ml-webhook', 'process', {}, { headers: {} })
    ).rejects.toThrow('Invalid webhook signature');

    expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('ml-webhook', {
      body: { action: 'process' },
      headers: { Authorization: 'Bearer token' },
    });
  });
});
