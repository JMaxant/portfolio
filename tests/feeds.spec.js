import { test, expect } from '@playwright/test';
import { FIXTURES } from './pages.js';

// #16 and #74: what each RSS feed lists and where its items point. See docs/seo.md#feeds.
const items = async (page, request, path) => {
  const response = await request.get(path);
  expect(response.status()).toBe(200);
  const xml = await response.text();
  return page.evaluate((source) => {
    const doc = new DOMParser().parseFromString(source, 'application/xml');
    if (doc.querySelector('parsererror')) {
      throw new Error('the feed is not well-formed XML');
    }
    return [...doc.querySelectorAll('item')].map((item) => ({
      link: item.querySelector('link').textContent,
      guid: item.querySelector('guid').textContent,
      isPermaLink: item.querySelector('guid').getAttribute('isPermaLink'),
    }));
  }, xml);
};

const path = (url) => new URL(url).pathname;

test('the main feed lists the blog and the projects only', async ({ page, request }) => {
  const links = (await items(page, request, '/index.xml')).map((item) => path(item.link));

  expect(links).toContain(FIXTURES.article.url);
  expect(links).toContain(FIXTURES.project.url);
  for (const link of links) {
    expect(link).toMatch(/^\/(blog|projets)\//);
  }
});

// The a-propos section holds the resume only; the tag index lists terms, not content.
for (const feed of ['/a-propos/index.xml', '/tags/index.xml']) {
  test(`${feed} is not generated`, async ({ request }) => {
    expect((await request.get(feed)).status()).toBe(404);
  });
}

// A veille entry has no page of its own, so its Permalink is a 404.
for (const feed of ['/veille/index.xml', `${FIXTURES.tag.url}index.xml`]) {
  test(`${feed} links a veille entry to its source`, async ({ page, request }) => {
    const entry = (await items(page, request, feed)).find((item) => item.guid.endsWith('/veille/fixture-entry/'));

    expect(entry.link).toBe('https://example.com/');
    expect(entry.isPermaLink).toBe('false');
  });
}

test('every page advertises the main feed', async ({ page }) => {
  await page.goto(FIXTURES.article.url);

  const feed = page.locator('link[rel="alternate"][type="application/rss+xml"]').first();
  expect(path(await feed.getAttribute('href'))).toBe('/index.xml');
});
