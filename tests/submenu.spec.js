import { test, expect } from '@playwright/test';

// The submenu is a disclosure at every width — unlike the burger, it does not switch to an
// always-open panel below 768px, so its own assertions never need to branch on the
// breakpoint the way nav.spec.js does. See docs/components.md#menu-itemshtml.
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };

const TOGGLE = '.submenu-toggle';
const PANEL = '#submenu-main-a-propos';

test.describe('disclosure behaviour', () => {
  test('the toggle opens the submenu', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');

    await expect(page.locator(PANEL)).toBeHidden();
    await page.click(TOGGLE);

    await expect(page.locator(PANEL)).toBeVisible();
    await expect(page.locator(TOGGLE)).toHaveAttribute('aria-expanded', 'true');
  });

  test('a second click closes it', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');

    await page.click(TOGGLE);
    await page.click(TOGGLE);

    await expect(page.locator(PANEL)).toBeHidden();
    await expect(page.locator(TOGGLE)).toHaveAttribute('aria-expanded', 'false');
  });

  test('Escape closes it and gives the focus back', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');

    await page.click(TOGGLE);
    await page.keyboard.press('Escape');

    await expect(page.locator(PANEL)).toBeHidden();
    expect(await page.evaluate(() => document.activeElement.className)).toContain('submenu-toggle');
  });

  test('aria-controls resolves to the submenu it toggles', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');

    const controls = await page.locator(TOGGLE).getAttribute('aria-controls');
    expect(controls).toBe('submenu-main-a-propos');
    await expect(page.locator(PANEL)).toHaveClass(/submenu/);
  });

  test('both children render inside the submenu', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');

    await expect(page.locator(PANEL).getByText('Qui suis-je ?')).toHaveCount(1);
    await expect(page.locator(PANEL).getByText('Parcours')).toHaveCount(1);
  });

  test('a click outside closes it', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');

    await page.click(TOGGLE);
    await page.click('main');

    await expect(page.locator(PANEL)).toBeHidden();
    await expect(page.locator(TOGGLE)).toHaveAttribute('aria-expanded', 'false');
  });

  test('tabbing out of the panel closes it', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');

    await page.click(TOGGLE);
    await page.locator(PANEL).getByText('Parcours').focus();
    await page.keyboard.press('Tab');

    await expect(page.locator(PANEL)).toBeHidden();
  });
});

test.describe('interaction with the mobile nav panel', () => {
  test('closing the burger resets a submenu left open inside it', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');

    await page.click('.menu-toggle');
    await page.click(TOGGLE);
    await expect(page.locator(TOGGLE)).toHaveAttribute('aria-expanded', 'true');

    // Closing via the burger itself, not Escape: Escape would also fire the submenu's own
    // disclosure listener, which masks whether nav-toggle.js's own reset ran.
    await page.click('.menu-toggle');

    await expect(page.locator(TOGGLE)).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator(PANEL)).not.toHaveClass(/is-open/);
  });
});

test.describe('without JavaScript', () => {
  // Nothing can toggle `.is-open`, so the button is hidden and the submenu stays expanded —
  // same "hide the control, keep the content" rule as the burger toggle and `.site-nav`.
  for (const [name, viewport] of [['above 768px', DESKTOP], ['below 768px', MOBILE]]) {
    test(`the submenu content is reachable without a click ${name}`, async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false, viewport });
      const page = await context.newPage();
      await page.goto('/');

      await expect(page.locator(TOGGLE)).toBeHidden();
      await expect(page.locator(PANEL)).toBeVisible();
      await expect(page.locator(PANEL).getByText('Qui suis-je ?')).toBeVisible();

      await context.close();
    });
  }
});
