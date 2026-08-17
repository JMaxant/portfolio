import { test, expect } from '@playwright/test';

// The panel is a desktop popover above 768px and a permanently open block below it, so most
// assertions have to state which side of the breakpoint they are on. See
// docs/theme-switcher.md.
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };

const openPopover = async (page) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/');
  await page.click('.theme-switcher__toggle');
};

const themeState = (page) => page.evaluate(() => ({
  attribute: document.documentElement.dataset.theme ?? null,
  stored: localStorage.getItem('theme'),
  checked: document.querySelector('input[name="theme"]:checked').id,
}));

test.describe('choice and persistence', () => {
  test('an explicit choice survives a reload', async ({ page }) => {
    await openPopover(page);
    await page.click('label[for="theme-dark"]');
    expect(await themeState(page)).toEqual({ attribute: 'dark', stored: 'dark', checked: 'theme-dark' });

    await page.reload();
    expect(await themeState(page)).toEqual({ attribute: 'dark', stored: 'dark', checked: 'theme-dark' });
  });

  test('"system" clears both the attribute and the key', async ({ page }) => {
    // Selecting a theme leaves the panel open, so no reopening in between.
    await openPopover(page);
    await page.click('label[for="theme-dark"]');
    await page.click('label[for="theme-system"]');

    expect(await themeState(page)).toEqual({ attribute: null, stored: null, checked: 'theme-system' });
  });

  test('a value that is not a known theme is ignored', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'chartreuse'));
    await page.setViewportSize(DESKTOP);
    await page.goto('/');

    expect(await page.evaluate(() => document.documentElement.dataset.theme ?? null)).toBeNull();
  });

  test('the switcher still works when localStorage throws', async ({ page }) => {
    // Safari with "block all cookies", some enterprise policies, certain webviews. Reading
    // storage before wiring the listeners used to abort the script and leave the switcher
    // inert with no visible symptom.
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() { throw new DOMException('blocked', 'SecurityError'); },
      });
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await openPopover(page);
    await page.click('label[for="theme-dark"]');

    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
  });
});

test.describe('popover behaviour above 768px', () => {
  test('opening moves focus onto the current choice', async ({ page }) => {
    await openPopover(page);

    expect(await page.evaluate(() => document.activeElement.id)).toBe('theme-system');
    await expect(page.locator('.theme-switcher__toggle')).toHaveAttribute('aria-expanded', 'true');
  });

  test('arrow keys traverse the group without dismissing it', async ({ page }) => {
    // The arrow keys are the navigation mechanism of a radio group and they fire `change`.
    // Closing on `change` committed a theme and shut the panel on the first keystroke,
    // making the group impossible to traverse with the keyboard.
    await openPopover(page);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');

    expect(await page.evaluate(() => document.activeElement.id)).toBe('theme-light');
    await expect(page.locator('#theme-switcher-panel')).toHaveClass(/is-open/);
  });

  test('Escape closes it and gives the focus back', async ({ page }) => {
    await openPopover(page);
    await page.keyboard.press('Escape');

    await expect(page.locator('#theme-switcher-panel')).not.toHaveClass(/is-open/);
    expect(await page.evaluate(() => document.activeElement.className)).toContain('theme-switcher__toggle');
  });

  test('tabbing out of the panel closes it', async ({ page }) => {
    await openPopover(page);
    await page.keyboard.press('Tab');

    await expect(page.locator('#theme-switcher-panel')).not.toHaveClass(/is-open/);
  });

  test('a click outside closes it', async ({ page }) => {
    await openPopover(page);
    await page.click('main');

    await expect(page.locator('#theme-switcher-panel')).not.toHaveClass(/is-open/);
  });

  test('the trigger announces the current theme', async ({ page }) => {
    await openPopover(page);
    await expect(page.locator('.theme-switcher__toggle')).toHaveAccessibleName(/Système/);

    await page.click('label[for="theme-dark"]');
    await expect(page.locator('.theme-switcher__toggle')).toHaveAccessibleName(/Sombre/);
  });
});

test.describe('layout below 768px', () => {
  test('the panel is inline and the trigger is gone', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await page.click('.menu-toggle');

    await expect(page.locator('.theme-switcher__toggle')).toBeHidden();
    expect(await page.locator('#theme-switcher-panel').evaluate((el) => getComputedStyle(el).position)).toBe('static');
  });

  test('crossing the breakpoint with the popover open resets it', async ({ page }) => {
    // The popover rules are keyed on `.is-open`, which outranks the mobile block on
    // specificity: the panel stayed absolutely positioned inside the burger menu.
    await openPopover(page);
    await page.setViewportSize(MOBILE);

    await expect(page.locator('.theme-switcher__toggle')).toHaveAttribute('aria-expanded', 'false');
    expect(await page.locator('#theme-switcher-panel').evaluate((el) => getComputedStyle(el).position)).toBe('static');
  });
});

test.describe('without JavaScript', () => {
  test('the trigger is hidden rather than inert', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: DESKTOP });
    const page = await context.newPage();
    await page.goto('/');

    await expect(page.locator('.theme-switcher__toggle')).toBeHidden();
    await expect(page.locator('#theme-system')).toBeChecked();

    await context.close();
  });
});
