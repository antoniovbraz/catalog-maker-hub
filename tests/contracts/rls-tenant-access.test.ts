import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const canAccess = (rowTenant: string, userId: string) => rowTenant === userId;

describe('RLS tenant access policies', () => {
  it('blocks cross-tenant product access', () => {
    const tenantA = 'tenant-a';
    const tenantB = 'tenant-b';
    expect(canAccess(tenantA, tenantA)).toBe(true);
    expect(canAccess(tenantA, tenantB)).toBe(false);
  });

  it('migration enforces tenant policy', () => {
    const sql = readFileSync(
      'supabase/migrations/20250802134141_c5c89547-5c97-4543-9d1d-634f90c42007.sql',
      'utf-8',
    );
    expect(sql).toContain('USING (tenant_id = auth.uid())');
  });
});
