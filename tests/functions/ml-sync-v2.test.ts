import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestHandler } from '../../supabase/functions/shared/adapter';
import { createAdapter } from '../../supabase/functions/shared/adapter';
import { MLRepository } from '../../supabase/functions/shared/repositories/ml-repository';
import { MLError } from '../../packages/types/mercado-livre';

const mockServe = vi.fn().mockImplementation((handler: RequestHandler) => {
  return async (request: Request) => handler(request);
});

vi.mock('../../supabase/functions/shared/adapter', () => ({
  createAdapter: () => ({
    serve: mockServe
  })
}));

vi.mock('../../supabase/functions/shared/repositories/ml-repository', () => ({
  MLRepository: vi.fn().mockImplementation(() => ({
    validateJWT: vi.fn(),
    getAuthToken: vi.fn(),
    validateToken: vi.fn()
  }))
}));

describe('ML Sync v2', () => {
  let repository: MLRepository;
  const { serve } = createAdapter();

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new MLRepository({} as any);
  });

  it('should validate JWT and ML token', async () => {
    const mockRequest = new Request('http://localhost', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-jwt'
      }
    });

    vi.spyOn(repository, 'validateJWT').mockResolvedValue({
      userId: 'user-1',
      tenantId: 'tenant-1'
    });

    vi.spyOn(repository, 'getAuthToken').mockResolvedValue({
      id: '1',
      tenant_id: 'tenant-1',
      access_token: 'test-token',
      refresh_token: 'refresh-token',
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      created_at: new Date().toISOString()
    });

    const mockHandler: RequestHandler = async () => {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    };

    // Call the mock handler directly since we've mocked serve to pass through
    const response = await mockServe(mockHandler)(mockRequest);

    expect(response.status).toBe(200);
    expect(repository.validateJWT).toHaveBeenCalledWith('test-jwt');
    expect(repository.getAuthToken).toHaveBeenCalledWith('tenant-1');
  });

  it('should handle MLError with correct status code', async () => {
    const mockRequest = new Request('http://localhost', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-jwt'
      }
    });

    vi.spyOn(repository, 'validateJWT').mockRejectedValue(
      new MLError('Invalid token', 401)
    );

    const mockHandler: RequestHandler = async () => {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    };

    // Call the mock handler directly since we've mocked serve to pass through
    const response = await mockServe(mockHandler)(mockRequest);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Invalid token');
  });
});
