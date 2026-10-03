import { test, expect } from '@playwright/test';
import { FIXTURES } from './pages.js';

// #153: a Markdown twin of each article and project. See docs/seo.md#markdown-versions.

const twin = (url) => `${url}index.md`;

test('an article and a project have a Markdown twin with title, description and body', async ({ request }) => {
  for (const page of [FIXTURES.article, FIXTURES.project]) {
    const response = await request.get(twin(page.url));
    expect(response.status(), page.url).toBe(200);
    expect(response.headers()['content-type']).toMatch(/^text\/markdown/);
    const text = await response.text();
    expect(text).toMatch(/^# \S/);
    expect(text).toMatch(/^> \S/m);
    expect(text).toContain('Body.');
    expect(text).not.toMatch(/^(\+\+\+|---)$/m);
  }
});

test('the Markdown twin has no shortcode and absolute links', async ({ request }) => {
  const text = await (await request.get(twin(FIXTURES.markdownArticle.url))).text();

  expect(text).not.toMatch(/\{\{[<%]/);
  expect(text).not.toContain('Shortcode to strip');
  expect(text).toMatch(/\]\(https?:\/\/[^/]+\/projets\/fixture-project\/\)/);
  expect(text).toMatch(/\]\(https?:\/\/[^/]+\/blog\/fixture-markdown\/sibling\.png\)/);
  expect(text).toMatch(/\]\(https?:\/\/[^/]+\/blog\/fixture-markdown\/#top\)/);
  expect(text).toContain('](https://example.com/x)');
  expect(text).toContain('](//example.com/y)');
});

test('the HTML page advertises its Markdown twin and links to it', async ({ page }) => {
  for (const { url } of [FIXTURES.article, FIXTURES.project]) {
    await page.goto(url);
    await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute('href', new RegExp(`${url}index\\.md$`));
    await expect(page.getByRole('link', { name: 'Version Markdown' })).toHaveAttribute('href', twin(url));
  }
});

test('listings, tags, resume and home have no Markdown twin', async ({ page, request }) => {
  for (const url of ['/', '/blog/', '/projets/', '/tags/', FIXTURES.tag.url, '/a-propos/', FIXTURES.parcours.url]) {
    expect((await request.get(twin(url))).status(), url).toBe(404);
    await page.goto(url);
    await expect(page.locator('link[type="text/markdown"]'), url).toHaveCount(0);
  }
});

test('llms.txt links to the Markdown twin of the publications', async ({ request }) => {
  const text = await (await request.get('/llms.txt')).text();

  expect(text).toContain(`- [${FIXTURES.article.title}](`);
  expect(text).toMatch(/\/blog\/fixture-article\/index\.md\)/);
  expect(text).toMatch(/\/projets\/fixture-project\/index\.md\)/);
});
