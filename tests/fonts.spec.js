import { test, expect } from '@playwright/test';
import { PAGES } from './pages.js';

// Catches a silent fallback to Georgia/Times: nothing here fails the Hugo build (the font
// files exist and bundle fine), only the rendered font-family would be wrong — a typo in
// the @font-face name, a component overriding font-family, or CSS specificity shadowing
// `--font-serif`.

for (const [name, path] of PAGES) {
  test(`${name} renders body and headings in Spectral`, async ({ page }) => {
    await page.goto(path);

    const body = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(body).toContain('Spectral');

    const headings = await page.locator('h1, h2').evaluateAll((nodes) =>
      nodes.map((node) => ({
        fontFamily: getComputedStyle(node).fontFamily,
        fontWeight: getComputedStyle(node).fontWeight,
      })),
    );
    expect(headings.length).toBeGreaterThan(0);
    for (const heading of headings) {
      expect(heading.fontFamily).toContain('Spectral');
      expect(heading.fontWeight).toBe('600');
    }
  });
}

// Doesn't prove the italic is a genuine cut rather than a faux-oblique fallback — a
// computed style can't tell the two apart — only that the italic @font-face is actually
// reached (right family, right style), which is what a CSS regression would break.
test('single__intro-text is styled italic in Spectral', async ({ page }) => {
  await page.goto('/blog/apprendre-go-venant-de-php/');

  const intro = await page
    .locator('.single__intro-text')
    .evaluate((node) => ({
      fontFamily: getComputedStyle(node).fontFamily,
      fontStyle: getComputedStyle(node).fontStyle,
    }));

  expect(intro.fontFamily).toContain('Spectral');
  expect(intro.fontStyle).toBe('italic');
});
