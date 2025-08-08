import { test, expect } from '@playwright/test';

const routes = [
  '/', '/dashboard', '/admin', '/subscription',
  '/categories', '/products', '/pricing', '/commissions',
  '/fixed-fees', '/sales', '/strategy', '/ad-generator', '/auth'
].filter(Boolean);

const viewports = [
  { width: 320, height: 800 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
];

test.describe('Responsiveness - overflow guard', () => {
  for (const route of routes) {
    for (const vp of viewports) {
      test(`no horizontal overflow @ ${route} - ${vp.width}px`, async ({ page }) => {
        await page.addInitScript('window.__E2E__ = true;');
        await page.setViewportSize(vp);
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        const hasOverflow = await page.evaluate(() => {
          const doc = document.scrollingElement || document.documentElement;
          return doc.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasOverflow, `Overflow horizontal detectado em ${route} @${vp.width}px`).toBeFalsy();
      });
    }
  }
});
