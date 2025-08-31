import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '@/services/auth';
import { testUtils } from '../setup';

// Mock do Supabase é feito no setup.ts

describe('AuthService', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
    (testUtils.mockSupabaseClient.auth as any).signInWithPassword = vi.fn();
  });

  it('deve realizar signIn', async () => {
    testUtils.mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({ data: { user: {} }, error: null });

    const result = await authService.signIn('test@example.com', '123456');

    expect(testUtils.mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'test@example.com', password: '123456' });
    expect(result.data).toBeDefined();
  });

  it('deve obter perfil atual', async () => {
    testUtils.mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'u1', tenant_id: 't1', role: 'admin' }, error: null })
    };
    testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery as any);

    const profile = await authService.getCurrentProfile();

    expect(profile?.id).toBe('u1');
  });

  it('deve retornar null quando não há usuário', async () => {
    testUtils.mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const result = await authService.getCurrentProfile();
    expect(result).toBeNull();
  });

  it('deve realizar signOut', async () => {
    testUtils.mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });
    const result = await authService.signOut();
    expect(result.error).toBeNull();
    expect(testUtils.mockSupabaseClient.auth.signOut).toHaveBeenCalled();
  });
});
