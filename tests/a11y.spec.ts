import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = [
  '/', '/dashboard', '/admin', '/subscription',
  '/categories', '/products', '/pricing', '/commissions',
  '/fixed-fees', '/sales', '/strategy', '/ad-generator', '/auth'
].filter(Boolean);

test.describe('A11y - axe', () => {
  for (const route of routes) {
    test(`axe ${route}`, async ({ page }) => {
      await page.addInitScript('window.__E2E__ = true;');
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const serious = results.violations.filter(v => ['serious', 'critical'].includes((v.impact || '').toLowerCase()));
      expect(serious, `Axe serious/critical violations found on ${route}: ${serious.map(v => v.id).join(', ')}`)
        .toEqual([]);
    });
  }
});
