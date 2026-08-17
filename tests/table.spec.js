import { test, expect } from '@playwright/test';

// A table's min-content width depends on fonts the site does not ship: the same `<code>`
// token measured 80px locally and ~121px on CI, which is what made overflow.spec.js pass
// here and fail there. The fix is a scroll container, so the guard has to be a font the page
// cannot fit rather than the one this machine happens to have.
const PAGE = '/cas-max/';
const NARROW = { width: 320, height: 900 };

const geometry = (page) => page.evaluate(() => {
  const wrap = document.querySelector('.table-scroll');
  return {
    pageOverflow: document.scrollingElement.scrollWidth - window.innerWidth,
    wrapperFits: wrap.getBoundingClientRect().right <= window.innerWidth,
    wrapperScrolls: wrap.scrollWidth > wrap.clientWidth,
  };
});

test.describe('table overflow at 320px', () => {
  test('every table is wrapped in a scroll container', async ({ page }) => {
    await page.setViewportSize(NARROW);
    await page.goto(PAGE);

    const tables = await page.locator('table').count();
    expect(tables).toBeGreaterThan(0);
    await expect(page.locator('.table-scroll')).toHaveCount(tables);
  });

  test('the container is keyboard reachable', async ({ page }) => {
    // A scrollable region that cannot be focused is unreachable without a mouse — WCAG 2.1.1,
    // and axe's scrollable-region-focusable rule.
    await page.setViewportSize(NARROW);
    await page.goto(PAGE);

    const wrap = page.locator('.table-scroll').first();
    await expect(wrap).toHaveAttribute('tabindex', '0');
    await expect(wrap).toHaveAttribute('role', 'region');
    await expect(wrap).toHaveAccessibleName(/.+/);
  });

  for (const [name, scale] of [['the shipped font', null], ['a much wider font', '300%']]) {
    test(`the page does not overflow with ${name}`, async ({ page }) => {
      await page.setViewportSize(NARROW);
      await page.goto(PAGE);
      if (scale) {
        await page.addStyleTag({ content: `code { font-size: ${scale} !important; }` });
      }

      const g = await geometry(page);
      expect(g.pageOverflow).toBeLessThanOrEqual(0);
      expect(g.wrapperFits).toBe(true);
      if (scale) {
        // Guards against the assertion passing because the table shrank rather than scrolled.
        expect(g.wrapperScrolls).toBe(true);
      }
    });
  }
});
