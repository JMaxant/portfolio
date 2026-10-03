import { test, expect } from '@playwright/test';
import { FIXTURES } from './pages.js';

// What axe cannot judge: behaviour under the keyboard, and the names a screen reader reads.
const DESKTOP = { width: 1280, height: 800 };

test.use({ viewport: DESKTOP });

test.describe('skip link', () => {
  test('is the first tab stop, becomes visible, and reaches #main-content', async ({ page }) => {
    await page.goto(FIXTURES.article.url);
    await page.keyboard.press('Tab');

    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport({ ratio: 1 });

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main-content$/);

    // The next stop must be inside <main>, not back in the header.
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement.closest('main') !== null)).toBe(true);
  });
});

test('landmarks of the same role each have a unique name', async ({ page }) => {
  await page.goto(FIXTURES.article.url);

  const names = await page.getByRole('navigation').evaluateAll((navs) => navs.map((n) => n.getAttribute('aria-label')));
  expect(names).toEqual(expect.arrayContaining(['Principale', 'Fil d\'Ariane', 'Articles', 'Pied de page']));
  expect(new Set(names).size).toBe(names.length);
});

test('a code block that overflows is focusable and scrolls from the keyboard', async ({ page }) => {
  await page.goto(FIXTURES.code.url);
  const pre = page.locator('main pre');

  expect(await pre.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);

  await pre.focus();
  await expect(pre).toBeFocused();
  await page.keyboard.press('ArrowRight');
  // Smooth scrolling is animated, so the offset is polled rather than read once.
  await expect.poll(() => pre.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
});

test.describe('theme switcher', () => {
  test('opens with Enter and switches theme with the arrow keys', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('.theme-switcher__toggle');

    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await page.locator('#theme-system').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#theme-dark')).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test('every interactive element on the home page shows a focus indicator', async ({ page }) => {
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme });
    await page.goto('/');

    const stops = await page.evaluate(async () => {
      const bad = [];
      const links = [...document.querySelectorAll('a[href], button')].filter((el) => el.offsetParent !== null);
      for (const el of links) {
        el.focus({ focusVisible: true });
        const { outlineStyle, outlineWidth, boxShadow } = getComputedStyle(el);
        if (outlineStyle === 'none' && outlineWidth === '0px' && boxShadow === 'none') {bad.push(el.outerHTML.slice(0, 80));}
      }
      return bad;
    });
    expect(stops, colorScheme).toEqual([]);
  }
});

test('prefers-reduced-motion removes transitions and smooth scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const motion = await page.evaluate(() => ({
    scroll: getComputedStyle(document.documentElement).scrollBehavior,
    transition: parseFloat(getComputedStyle(document.querySelector('.theme-switcher__toggle')).transitionDuration),
  }));
  expect(motion.scroll).toBe('auto');
  expect(motion.transition).toBeLessThan(0.001);
});
