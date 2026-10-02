import { test, expect } from '@playwright/test';
import { FIXTURES } from './pages.js';

// #17 and #18: the two root files meant for crawlers and agents. See docs/seo.md#robotstxt.
// The test server runs with --environment production, so robots.txt allows crawling.

test('robots.txt allows every crawler and points to the sitemap', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);
  const robots = await response.text();

  expect(robots).not.toMatch(/^Disallow:/m);
  for (const crawler of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
    expect(robots).toContain(`User-agent: ${crawler}\n`);
  }

  const sitemap = robots.match(/^Sitemap: (\S+)$/m)?.[1];
  expect(sitemap).toMatch(/^https?:\/\/.+\/sitemap\.xml$/);
  expect((await request.get(new URL(sitemap).pathname)).status()).toBe(200);
});

const llms = async (request) => {
  const response = await request.get('/llms.txt');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/^text\/plain/);
  return response.text();
};

test('llms.txt follows the llmstxt.org structure', async ({ request }) => {
  const lines = (await llms(request)).split('\n');

  expect(lines[0]).toMatch(/^# \S/);
  expect(lines[2]).toMatch(/^> \S/);
  const headings = lines.filter((line) => line.startsWith('## '));
  expect(headings).toEqual(['## Projets', '## Blog', '## À propos', '## Optional']);
});

test('llms.txt lists the publications, not the veille entries', async ({ request }) => {
  const text = await llms(request);

  expect(text).toContain(`- [${FIXTURES.article.title}](`);
  expect(text).toContain(`- [${FIXTURES.project.title}](`);
  expect(text).not.toContain('/veille/fixture-entry/');
});

// Generated from the content, so a link can only break through a template bug.
test('every llms.txt link resolves', async ({ request }) => {
  const links = [...(await llms(request)).matchAll(/\]\((\S+?)\)/g)].map((match) => new URL(match[1]).pathname);

  expect(links.length).toBeGreaterThan(0);
  for (const link of links) {
    expect((await request.get(link)).status(), link).toBe(200);
  }
});
