import { test, expect } from '@playwright/test';

// #20, #153, #168: the /_headers file Cloudflare parses and does not serve. The Hugo test server
// serves it as any file, which is what lets this spec read it.
// See docs/seo.md#markdown-versions.

const rulesOf = (text) => new Map(text.trim().split(/\n\n+/).map((block) => {
  const [path, ...headers] = block.split('\n');
  return [path, headers];
}));

const fetchRules = async (request) => rulesOf(await (await request.get('/_headers')).text());

test('each publication section has one rule giving its Markdown versions a canonical Link', async ({ request }) => {
  const rules = await fetchRules(request);

  for (const section of ['blog', 'projets']) {
    const headers = rules.get(`/${section}/:slug/index.md`);
    expect(headers, section).toBeDefined();
    // The :slug placeholder is reused in the value: one rule covers every page of the section.
    expect(headers.some((line) => new RegExp(`^  Link: <https?://[^/>]+/${section}/:slug/>; rel="canonical"$`).test(line)), section).toBe(true);
    expect(headers, section).toContain('  Content-Type: text/markdown; charset=utf-8');
  }
});

test('the text files declare their charset', async ({ request }) => {
  const rules = await fetchRules(request);

  for (const path of ['/llms.txt', '/robots.txt']) {
    expect(rules.get(path), path).toEqual(['  Content-Type: text/plain; charset=utf-8']);
  }
});

test('no rule targets a page without a Markdown version', async ({ request }) => {
  const paths = [...(await fetchRules(request)).keys()];

  for (const path of paths) {
    expect(path, path).toMatch(/^\/((blog|projets)\/:slug\/index\.md|llms\.txt|robots\.txt)$/);
  }
});
