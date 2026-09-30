import { test, expect } from '@playwright/test';
import { FIXTURES } from './pages.js';

// The trail is built from Ancestors, so the assertions state the expected chain rather than
// counting items. See docs/components.md#breadcrumbhtml.
const trail = (page) => page.getByRole('navigation', { name: "Fil d'Ariane" });

const cases = [
  { name: 'blog list', url: '/blog/', links: ['Accueil'], current: 'Blog' },
  { name: 'blog article', url: FIXTURES.article.url, links: ['Accueil', 'Blog'], current: FIXTURES.article.title },
  { name: 'projet', url: FIXTURES.project.url, links: ['Accueil', 'Projets'], current: FIXTURES.project.title },
  { name: 'tags list', url: '/tags/', links: ['Accueil'], current: 'Tags' },
  { name: 'tag term', url: FIXTURES.tag.url, links: ['Accueil', 'Tags'], current: FIXTURES.tag.title },
  { name: 'parcours', url: FIXTURES.parcours.url, links: ['Accueil', 'À propos'], current: FIXTURES.parcours.title },
];

for (const { name, url, links, current } of cases) {
  test(`${name} renders its own ancestor trail`, async ({ page }) => {
    await page.goto(url);

    await expect(trail(page).getByRole('link')).toHaveText(links);
    await expect(trail(page).locator('[aria-current="page"]')).toHaveText(current);
  });
}

test('the current page is not a link', async ({ page }) => {
  await page.goto(FIXTURES.article.url);

  await expect(trail(page).locator('[aria-current="page"]')).toHaveJSProperty('tagName', 'SPAN');
});

// Chromium exposes generated content, so a separator without the empty alt-text lands in
// the accessibility tree between every crumb.
test('the separator is not announced', async ({ page }) => {
  await page.goto(FIXTURES.article.url);

  expect(await trail(page).ariaSnapshot()).not.toContain('>');
});

// The current crumb is truncated rather than wrapped, so the trail keeps the same height
// at every width and the separators never shift. See docs/components.md#breadcrumbhtml.
test('the trail stays on one line once the title no longer fits', async ({ page }) => {
  const url = FIXTURES.article.url;
  const listHeight = () => trail(page).locator('.breadcrumb__list').evaluate((el) => el.getBoundingClientRect().height);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(url);
  const wide = await listHeight();

  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(url);

  expect(await listHeight()).toBe(wide);
  await expect(trail(page).locator('[aria-current="page"]')).toHaveText(FIXTURES.article.title);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test('the home page carries no trail', async ({ page }) => {
  await page.goto('/');

  await expect(trail(page)).toHaveCount(0);
});
