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
    // Both are computed from the same chain; a mismatch means one of them forked.
    await expect(meta(page, 'property', 'og:description')).toHaveAttribute('content', description);

    await expect(meta(page, 'property', 'og:title')).toHaveAttribute('content', /\S/);
    await expect(meta(page, 'property', 'og:type')).toHaveAttribute('content', /^(website|article)$/);
    await expect(meta(page, 'property', 'og:locale')).toHaveAttribute('content', 'fr_FR');
    await expect(meta(page, 'name', 'author')).toHaveAttribute('content', /\S/);

    // og:image is optional, but a relative URL is ignored by every scraper.
    for (const image of await meta(page, 'property', 'og:image').all()) {
      await expect(image).toHaveAttribute('content', /^https?:\/\//);
    }
  });
}
