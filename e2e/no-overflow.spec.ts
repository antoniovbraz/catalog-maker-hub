import { test, expect } from '@playwright/test';

const sizes = [
  { name: 'sm', width: 640, height: 800 },
  { name: 'md', width: 768, height: 800 },
  { name: 'lg', width: 1024, height: 800 },
];

const routes = ['/', '/ad-generator', '/subscription', '/admin'];

for (const route of routes) {
  for (const size of sizes) {
    test(`no horizontal overflow on ${route} at ${size.name}`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto(route);
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasOverflow).toBeFalsy();
    });
  }
}
