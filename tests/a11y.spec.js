import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PAGES } from './pages.js';

const COLOR_SCHEMES = ['light', 'dark'];

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(colorScheme, () => {
    for (const [name, path] of PAGES) {
      test(`${name} has no automatically detectable a11y violations`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await page.goto(path);

        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

        const message = results.violations
          .map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`)
          .join('\n\n');
        expect(results.violations, message).toEqual([]);
      });
    }
  });
}
