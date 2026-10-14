import { test, expect } from '@playwright/test';
import { FIXTURES } from './pages.js';

// #204 (RGAA 12.1 to 12.4): an HTML site map is the second navigation system, reachable from
// the footer of every page, relevant, and kept out of search results.
const PATH = '/plan-du-site/';

const SECTIONS = ['/', '/projets/', '/blog/', '/veille/', '/a-propos/', '/a-propos/parcours/', '/tags/'];

test('lists every section, each link resolving', async ({ page, request }) => {
  await page.goto(PATH);

  await expect(page.locator('h1')).toHaveText('Plan du site');
  for (const href of SECTIONS) {
    await expect(page.locator(`.site-map > li > a[href="${href}"]`), href).toBeVisible();
  }

  const hrefs = await page.locator('.site-map a').evaluateAll((links) => links.map((a) => a.getAttribute('href')));
  for (const href of new Set(hrefs)) {
    expect((await request.get(href)).status(), href).toBe(200);
  }
});

test('lists each tag and the pages of a section, but no veille entry', async ({ page }) => {
  await page.goto(PATH);

  await expect(page.locator(`.site-map a[href="${FIXTURES.tag.url}"]`)).toBeVisible();
  await expect(page.locator(`.site-map a[href="${FIXTURES.article.url}"]`)).toBeVisible();
  // Listed once: a page with its own menu entry is not repeated under its section.
  await expect(page.locator('.site-map a[href="/a-propos/parcours/"]')).toHaveCount(1);
  // Veille entries link to their source and have no page of their own.
  await expect(page.locator('.site-map a[href^="/veille/"]')).toHaveCount(1);
});

test('is not indexed, but its links are followed', async ({ page, request }) => {
  await page.goto(PATH);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');

  // Only this page carries it.
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).not.toContain('plan-du-site');
});

// 12.4: the same access from every page.
for (const [name, path] of [
  ['home', '/'],
  ['blog single', FIXTURES.article.url],
  ['project single', FIXTURES.project.url],
  ['tag term', FIXTURES.tag.url],
  ['404', '/404.html'],
]) {
  test(`${name} links to the site map from its footer`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('.site-footer nav a[href$="/plan-du-site/"]')).toHaveText('Plan du site');
  });
}
