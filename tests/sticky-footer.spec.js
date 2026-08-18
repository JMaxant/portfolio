import { test, expect } from '@playwright/test';
import { PAGES } from './pages.js';

// #90: on a page shorter than the viewport, the footer must stay anchored to the bottom of
// the screen rather than following straight on from the content.
const TALL_VIEWPORT = { width: 1280, height: 3000 };

for (const [name, path] of PAGES) {
  test(`${name} keeps the footer at the bottom of a tall viewport`, async ({ page }) => {
    await page.setViewportSize(TALL_VIEWPORT);
    await page.goto(path);

    const result = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      return {
        footerBottom: footer.getBoundingClientRect().bottom,
        contentFitsViewport: document.documentElement.scrollHeight <= window.innerHeight + 1,
        innerHeight: window.innerHeight,
      };
    });

    // Only meaningful when the page content is actually shorter than the
    // viewport — otherwise the footer is pushed below the fold regardless
    // of the sticky-footer rule, and the assertion would be vacuous. "cas
    // max" is a genuinely long case-study page and never fits here.
    test.skip(!result.contentFitsViewport, `${name}'s content is taller than the test viewport`);
    expect(result.footerBottom).toBeCloseTo(result.innerHeight, 0);
  });

  test(`${name} does not overlap the footer with content on a short viewport`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 400 });
    await page.goto(path);

    const overlap = await page.evaluate(() => {
      const main = document.querySelector('main');
      const footer = document.querySelector('footer');
      return footer.getBoundingClientRect().top - main.getBoundingClientRect().bottom;
    });

    expect(overlap).toBeGreaterThanOrEqual(0);
  });
}
