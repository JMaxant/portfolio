import { test, expect } from '@playwright/test';
import { FIXTURES } from './pages.js';

// #173: the profiles of `params.social` are links in the footer of every page, not only
// entries of the JSON-LD. Both are rendered from the same list, so the structured data is the
// reference here and the spec needs no copy of the configuration.
const PAGES = [
  ['home', '/'],
  ['blog single', FIXTURES.article.url],
  ['project single', FIXTURES.project.url],
  ['tag term', FIXTURES.tag.url],
  ['404', '/404.html'],
];

const profiles = async (page) => {
  await page.goto('/');
  const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph'];
  return graph.find((node) => node['@type'] === 'Person').sameAs;
};

for (const [name, path] of PAGES) {
  test(`${name} shows each social profile as a footer link`, async ({ page }) => {
    const urls = await profiles(page);
    expect(urls.length).toBeGreaterThan(0);

    await page.goto(path);
    for (const url of urls) {
      const link = page.locator('.site-footer a').and(page.locator(`[href="${url}"]`));
      await expect(link, url).toBeVisible();
      // The text is the accessible name: a link without one would be announced as its URL.
      await expect(link, url).toHaveText(/\S/);
    }
  });
}

test('the footer links sit in a named navigation landmark', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.site-footer nav[aria-label]')).toHaveCount(1);
  await expect(page.locator('.site-footer nav[aria-label]')).toHaveAttribute('aria-label', /\S/);
});
