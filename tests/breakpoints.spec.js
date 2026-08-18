import { test, expect } from '@playwright/test';

// #69: two media query regressions the overflow suite cannot see, because neither of them
// makes the page overflow.
//
// 1. Below --bp-mobile, the .entry-list__item grid must collapse to a single column. The
//    override was written `.entry-list li` (0,1,1) against a base of
//    `.entry-list .entry-list__item` (0,2,0): dead, while the .entry-list__body move next
//    to it did apply.
// 2. At exactly --bp-tablet, only one of the two layouts may be active. The card grid was a
//    min-width query when everything else is max-width.
//
// The values are copied from the tokens, like the media queries themselves;
// scripts/quality/check-breakpoints.mjs is what keeps them aligned.

const MOBILE = 576;
const TABLET = 768;

test.describe('entry list below the mobile breakpoint', () => {
  test('the item grid collapses to a single column', async ({ page }) => {
    await page.setViewportSize({ width: MOBILE - 1, height: 900 });
    await page.goto('/blog/');

    const { item, body } = await page.evaluate(() => {
      const el = document.querySelector('.entry-list__item');
      const bodyEl = document.querySelector('.entry-list__body');
      return {
        item: Math.round(el.getBoundingClientRect().width),
        body: Math.round(bodyEl.getBoundingClientRect().width),
      };
    });

    // The body takes the full width of the entry instead of being squeezed into the old
    // date column (120px, whatever the viewport width).
    expect(body).toBe(item);
  });

  test('the two-column layout is still there just above the breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: MOBILE + 1, height: 900 });
    await page.goto('/blog/');

    const columns = await page.locator('.entry-list__item').first()
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);

    expect(columns).toBe(2);
  });
});

test.describe('768px boundary', () => {
  // At exactly the breakpoint the mobile side wins: that is the direction of every other
  // media query in the project, all written `width <= 768px`.
  for (const [label, width, burgerVisible] of [
    ['just below', TABLET - 1, true],
    ['exactly on', TABLET, true],
    ['just above', TABLET + 1, false],
  ]) {
    test(`${label} the breakpoint, chrome and card grid agree`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      const { burger, gap } = await page.evaluate(() => ({
        burger: getComputedStyle(document.querySelector('.menu-toggle')).display !== 'none',
        gap: getComputedStyle(document.querySelector('.cards--grid')).gap,
      }));

      expect(burger).toBe(burgerVisible);
      // --spacing-md (16px) on mobile, --spacing-xl (40px) on desktop: the gap has to follow
      // the burger, not contradict it.
      expect(gap).toBe(burgerVisible ? '16px' : '40px');
    });
  }
});

// Collapsing below --bp-mobile belongs to the default arrangement only. Both modifiers keep
// their columns — hence the `:not()` in components/entry-list.css, which is (0,3,0) and beats
// the base (0,2,0). Without it both of them would collapse.
test.describe('the entry-list modifiers keep their columns below the breakpoint', () => {
  test('--compact keeps three columns and lets the title span them', async ({ page }) => {
    await page.setViewportSize({ width: MOBILE - 1, height: 900 });
    await page.goto('/');

    const { columns, title } = await page.evaluate(() => {
      const item = document.querySelector('.entry-list--compact .entry-list__item');
      return {
        columns: getComputedStyle(item).gridTemplateColumns.split(' ').length,
        title: getComputedStyle(item.querySelector(':scope > a')).gridColumnEnd,
      };
    });

    expect(columns).toBe(3);
    expect(title).toBe('-1');
  });

  test('--stacked keeps three columns down to 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/tags/');

    const columns = await page.locator('.entry-list--stacked .entry-list__item').first()
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);

    expect(columns).toBe(3);
  });
});
