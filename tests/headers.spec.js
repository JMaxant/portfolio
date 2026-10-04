import { test, expect } from '@playwright/test';
import { FIXTURES } from './pages.js';

// #20, #153: the canonical Link header of each Markdown twin, generated into /_headers for
// Cloudflare. See docs/seo.md#markdown-versions.

const rules = (text) => text.trim().split(/\n\n+/).map((block) => {
  const [path, ...headers] = block.split('\n');
  return { path, headers };
});

test('/_headers gives each Markdown twin a canonical Link header to its HTML page', async ({ request }) => {
  const response = await request.get('/_headers');
  expect(response.status()).toBe(200);
  const byPath = new Map(rules(await response.text()).map((rule) => [rule.path, rule.headers]));

  for (const { url } of [FIXTURES.article, FIXTURES.project, FIXTURES.markdownArticle]) {
    const headers = byPath.get(`${url}index.md`);
    expect(headers, url).toBeDefined();
    expect(headers).toHaveLength(1);
    expect(headers[0], url).toMatch(new RegExp(`^  Link: <https?://[^/>]+${url}>; rel="canonical"$`));
  }
});

test('/_headers has no rule for a page without a Markdown twin', async ({ request }) => {
  const paths = rules(await (await request.get('/_headers')).text()).map((rule) => rule.path);

  expect(paths.length).toBeGreaterThan(0);
  for (const path of paths) {
    expect(path, path).toMatch(/^\/(blog|projets)\/[^/]+\/index\.md$/);
  }
});
