import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { A11Y_PAGES } from './pages.js';

// `system` is the unforced rendering: no emulated colour scheme at all.
const COLOR_SCHEMES = ['light', 'dark', 'system'];

// `wcag*` tags are the success-criterion rules, `best-practice` adds landmark-unique,
// heading-order and the like. Contrast is held to AAA, not axe's default AA.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(colorScheme, () => {
    for (const [name, path] of A11Y_PAGES) {
      test(`${name} has no automatically detectable a11y violations`, async ({ page }) => {
        if (colorScheme !== 'system') {await page.emulateMedia({ colorScheme });}
        await page.goto(path);

        const results = await new AxeBuilder({ page })
          .withTags(TAGS)
          // `withRules` would replace the tag selection, not extend it.
          .options({ rules: { 'color-contrast-enhanced': { enabled: true } } })
          .analyze();

        const message = results.violations
          .map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`)
          .join('\n\n');
        expect(results.violations, message).toEqual([]);
      });
    }
  });
}
