import { test, expect } from '@playwright/test';

// The navigation is an inline row above 768px and a full-screen panel behind the burger
// toggle below it, so every assertion has to state which side of the breakpoint it is on.
// See docs/components.md#navhtml.
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };

const openMenu = async (page) => {
  await page.setViewportSize(MOBILE);
  await page.goto('/');
  await page.click('.menu-toggle');
};

const inertState = (page) => page.evaluate(() => ({
  main: document.querySelector('main').hasAttribute('inert'),
  footer: document.querySelector('.site-footer').hasAttribute('inert'),
}));

test.describe('disclosure behaviour below 768px', () => {
  test('the toggle opens the panel', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');

    await expect(page.locator('#primary-nav')).toBeHidden();
    await page.click('.menu-toggle');

    await expect(page.locator('#primary-nav')).toBeVisible();
    await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded', 'true');
  });

  test('Escape closes it and gives the focus back', async ({ page }) => {
    await openMenu(page);
    await page.keyboard.press('Escape');

    await expect(page.locator('#primary-nav')).toBeHidden();
    expect(await page.evaluate(() => document.activeElement.className)).toContain('menu-toggle');
  });

  test('activating a link closes it', async ({ page }) => {
    await openMenu(page);
    await page.click('.menu a:first-of-type');

    await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded', 'false');
  });

  test('the page behind is scroll-locked while open, and released after', async ({ page }) => {
    await openMenu(page);
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');

    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('visible');
  });
});

test.describe('focus containment below 768px', () => {
  // The open panel is `position: fixed; inset: 0` and opaque, so it covers the page rather
  // than pushing it down. Leaving the covered content in the tab order let Tab walk out of
  // the last nav link into a `<main>` the user cannot see — WCAG 2.4.3 and 2.4.11.
  test('the content behind the panel is inert while it is open', async ({ page }) => {
    await openMenu(page);

    expect(await inertState(page)).toEqual({ main: true, footer: true });
  });

  test('tabbing through the panel never reaches the content behind it', async ({ page }) => {
    await openMenu(page);

    const escaped = [];
    for (let i = 0; i < 20; i += 1) {
      await page.keyboard.press('Tab');
      const outside = await page.evaluate(() => {
        const el = document.activeElement;
        return el !== document.body && !el.closest('.site-header');
      });

      if (outside) {
        escaped.push(i);
      }
    }

    expect(escaped).toEqual([]);
  });

  test('closing releases the content behind it', async ({ page }) => {
    await openMenu(page);
    await page.keyboard.press('Escape');

    expect(await inertState(page)).toEqual({ main: false, footer: false });
  });

  test('crossing the breakpoint with the panel open resets and releases it', async ({ page }) => {
    await openMenu(page);
    await page.setViewportSize(DESKTOP);

    await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded', 'false');
    expect(await inertState(page)).toEqual({ main: false, footer: false });
  });
});

test.describe('above 768px', () => {
  test('the nav is an inline row and nothing is made inert', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');

    await expect(page.locator('#primary-nav')).toBeVisible();
    await expect(page.locator('.menu-toggle')).toBeHidden();
    expect(await inertState(page)).toEqual({ main: false, footer: false });
  });
});

// The trail is resolved by menu.html from IsMenuCurrent / HasMenuCurrent, and three of its
// failure modes are silent: a wrong menu identifier, a menu entry declared with `url`
// instead of `pageRef`, and a mismatched dict key all produce a menu where nothing is ever
// marked, with no build error. Only a rendered page can tell.
// See docs/components.md#the-active-trail.
const MAIN = '.menu--main';
const marked = (page) => page.locator(`${MAIN} [aria-current]`);

const decoration = (locator) => locator.evaluate(
  (node) => getComputedStyle(node).textDecorationLine,
);

test.describe('active trail', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP);
  });

  test('a section page marks its own entry, and only it', async ({ page }) => {
    await page.goto('/blog/');

    await expect(marked(page)).toHaveCount(1);
    await expect(marked(page)).toHaveAttribute('aria-current', 'page');
    await expect(marked(page)).toHaveText('Blog');
  });

  test('the page being read is not a link', async ({ page }) => {
    await page.goto('/blog/');

    // A <span> keeps the entry out of the tab order: an assertion on the tag name is what
    // says this is a decision and not an accident.
    expect(await marked(page).evaluate((node) => node.tagName)).toBe('SPAN');
  });

  test('a page inside a section marks that section as an ancestor', async ({ page }) => {
    await page.goto('/blog/');
    await page.locator('.entry-list__title').first().click();
    expect(new URL(page.url()).pathname).toMatch(/^\/blog\/.+/);

    await expect(marked(page)).toHaveCount(1);
    await expect(marked(page)).toHaveAttribute('aria-current', 'true');
    await expect(marked(page)).toHaveText('Blog');
    // The ancestor stays reachable, unlike the page being read.
    await expect(marked(page)).toHaveAttribute('href', '/blog/');
  });

  test('the home page marks the home entry and nothing else', async ({ page }) => {
    await page.goto('/');

    await expect(marked(page)).toHaveCount(1);
    await expect(marked(page)).toHaveAttribute('aria-current', 'page');
  });

  test('a page under no menu entry marks nothing', async ({ page }) => {
    // Taxonomy pages sit under no entry of the main menu, so an empty result is the
    // expected answer here — not a trail that failed to resolve.
    await page.goto('/tags/hugo/');

    await expect(marked(page)).toHaveCount(0);
  });

  test('the active entry is distinguished by more than its colour', async ({ page }) => {
    await page.goto('/blog/');

    // RGAA 3.3: colour cannot be the only carrier, and it is the one thing
    // `forced-colors: active` erases.
    expect(await decoration(marked(page))).toBe('underline');
    expect(await decoration(page.locator(`${MAIN} a:not([aria-current])`).first())).toBe('none');
  });

  test('the ancestor entry still reacts to the pointer', async ({ page }) => {
    await page.goto('/blog/');
    await page.locator('.entry-list__title').first().click();

    // `.menu [aria-current]` outweighs `a:hover`, so the active link stops responding to
    // hover unless the rule declares it — it did, for a while.
    const colour = () => marked(page).evaluate((node) => getComputedStyle(node).color);
    const resting = await colour();
    await marked(page).hover();

    await expect.poll(colour).not.toBe(resting);
  });

  test('the trail is marked in the mobile panel too', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/blog/');
    await page.click('.menu-toggle');

    await expect(marked(page)).toBeVisible();
    await expect(marked(page)).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('without JavaScript', () => {
  // Nothing can add `.is-open`, so a hidden panel would leave no reachable navigation at all
  // below the breakpoint. The toggle is hidden and the nav goes back in flow instead.
  test('the navigation is reachable below 768px', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: MOBILE });
    const page = await context.newPage();
    await page.goto('/');

    await expect(page.locator('.menu-toggle')).toBeHidden();
    await expect(page.locator('#primary-nav')).toBeVisible();
    await expect(page.locator('.menu a').first()).toBeVisible();
    // The theme switcher is deliberately not part of that: see tests/theme-switcher.spec.js.
    await expect(page.locator('.theme-switcher')).toBeHidden();

    // Putting the nav back in flow must not reintroduce the overflow #72 was about.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);

    await context.close();
  });

  test('the navigation is reachable above 768px', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: DESKTOP });
    const page = await context.newPage();
    await page.goto('/');

    await expect(page.locator('.menu-toggle')).toBeHidden();
    await expect(page.locator('.menu a').first()).toBeVisible();

    await context.close();
  });
});
