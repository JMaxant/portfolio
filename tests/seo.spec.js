import { test, expect } from '@playwright/test';
import { FIXTURES } from './pages.js';

// #14: the meta description was empty on the home page and every list without a
// `description`, which is what a search engine or a LinkedIn preview falls back to. One page
// per template, since each one reaches the description chain through a different branch.
const PAGES = [
  ['home', '/'],
  ['blog list', '/blog/'],
  ['veille list', '/veille/'],
  ['tags list', '/tags/'],
  ['tag term', FIXTURES.tag.url],
  ['blog single', FIXTURES.article.url],
  ['project single', FIXTURES.project.url],
  ['parcours', FIXTURES.parcours.url],
];

const meta = (page, attr, name) => page.locator(`meta[${attr}="${name}"]`);

for (const [name, path] of PAGES) {
  test(`${name} emits its description, canonical and OpenGraph tags`, async ({ page }) => {
    await page.goto(path);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', page.url());
    await expect(meta(page, 'property', 'og:url')).toHaveAttribute('content', page.url());

    const descriptionTag = meta(page, 'name', 'description');
    await expect(descriptionTag).toHaveAttribute('content', /\S/);
    const description = await descriptionTag.getAttribute('content');
    // Both are computed from the same chain; a mismatch means one of them forked. Tag pages
    // are the exception: their description is generated, and Hugo's embedded OpenGraph
    // template reads .Description only. See docs/seo.md.
    if (name !== 'tag term') {
      await expect(meta(page, 'property', 'og:description')).toHaveAttribute('content', description);
    }

    await expect(meta(page, 'property', 'og:title')).toHaveAttribute('content', /\S/);
    await expect(meta(page, 'property', 'og:type')).toHaveAttribute('content', /^(website|article)$/);
    await expect(meta(page, 'property', 'og:locale')).toHaveAttribute('content', 'fr_FR');
    await expect(meta(page, 'name', 'author')).toHaveAttribute('content', /\S/);

    // #146: every page carries a card. A relative URL is ignored by every scraper.
    const image = meta(page, 'property', 'og:image');
    await expect(image).toHaveCount(1);
    await expect(image).toHaveAttribute('content', /^https?:\/\//);
    await expect(meta(page, 'name', 'twitter:card')).toHaveAttribute('content', 'summary_large_image');
    await expect(meta(page, 'name', 'twitter:image')).toHaveAttribute('content', await image.getAttribute('content'));
  });
}

// The home page title is the site title: the generic `<Title> | <Site>` pattern repeated it.
test('home title does not repeat the site name', async ({ page }) => {
  await page.goto('/');
  const parts = (await page.title()).split(' | ');
  expect(new Set(parts).size).toBe(parts.length);
});

// The card is built with the production baseURL, which the test server does not answer to:
// fetch the same path from the local one.
const fetchImage = async (page, url) => {
  const response = await page.request.get(new URL(url).pathname);
  expect(response.ok()).toBe(true);
  return response.body();
};

// PNG header: 8-byte signature, then the IHDR chunk, whose first two fields are the size.
const pngSize = (bytes) => ({ width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) });

for (const [name, path] of PAGES) {
  test(`${name} card is a 1200×630 PNG`, async ({ page }) => {
    await page.goto(path);
    const url = await meta(page, 'property', 'og:image').getAttribute('content');
    expect(pngSize(await fetchImage(page, url))).toEqual({ width: 1200, height: 630 });
  });
}

test('titles of different lengths get different cards', async ({ page }) => {
  const cards = new Set();
  for (const path of ['/', FIXTURES.article.url, FIXTURES.project.url]) {
    await page.goto(path);
    cards.add(await meta(page, 'property', 'og:image').getAttribute('content'));
  }
  expect(cards.size).toBe(3);
});

test('an images front matter replaces the generated card', async ({ page }) => {
  await page.goto(FIXTURES.cardOverride.url);
  await expect(meta(page, 'property', 'og:image')).toHaveAttribute('content', /\/apple-touch-icon\.png$/);
});
