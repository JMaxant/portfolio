import { test, expect } from '@playwright/test';
import { FIXTURES } from './pages.js';

// #15: the schema.org @graph each template emits. See docs/seo.md#structured-data.
const graph = async (page) => {
  const scripts = page.locator('script[type="application/ld+json"]');
  await expect(scripts).toHaveCount(1);
  return JSON.parse(await scripts.textContent())['@graph'];
};

const types = (nodes) => nodes.map((node) => node['@type']);
const byType = (nodes, type) => nodes.find((node) => node['@type'] === type);

const CASES = [
  ['home', '/', ['WebSite', 'Person']],
  ['à propos', '/a-propos/', ['ProfilePage', 'Person', 'BreadcrumbList']],
  ['blog single', FIXTURES.article.url, ['BlogPosting', 'Person', 'BreadcrumbList']],
  ['project single', FIXTURES.project.url, ['Article', 'Person', 'BreadcrumbList']],
  ['parcours', FIXTURES.parcours.url, ['BreadcrumbList']],
  ['blog list', '/blog/', ['BreadcrumbList']],
  ['tag term', FIXTURES.tag.url, ['BreadcrumbList']],
];

for (const [name, path, expected] of CASES) {
  test(`${name} emits ${expected.join(', ')}`, async ({ page }) => {
    await page.goto(path);
    expect(types(await graph(page))).toEqual(expected);
  });
}

// An @id only resolves within the document, so every reference needs its node on the page.
for (const [name, path] of [['home', '/'], ['blog single', FIXTURES.article.url]]) {
  test(`${name} references a Person defined on the same page`, async ({ page }) => {
    await page.goto(path);
    const nodes = await graph(page);
    const person = byType(nodes, 'Person');

    expect(person.name).toMatch(/\S/);
    expect(person.sameAs.length).toBeGreaterThan(0);
    const refs = nodes.flatMap((node) => [node.author, node.publisher, node.mainEntity]).filter(Boolean);
    for (const ref of refs) {
      expect(ref['@id']).toBe(person['@id']);
    }
  });
}

test('an article shares the meta description and the canonical URL', async ({ page }) => {
  await page.goto(FIXTURES.article.url);
  const article = byType(await graph(page), 'BlogPosting');

  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', article.description);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', article.url);
  expect(article.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}T/);
});

test('a project is described as code only when it has a repository', async ({ page }) => {
  await page.goto(FIXTURES.project.url);
  expect(byType(await graph(page), 'Article').about).toBeUndefined();

  await page.goto(FIXTURES.projectWithRepo.url);
  expect(byType(await graph(page), 'Article').about).toEqual(
    expect.objectContaining({ '@type': 'SoftwareSourceCode', codeRepository: FIXTURES.projectWithRepo.repo }),
  );
});

// The visible trail and the BreadcrumbList walk Ancestors separately: they must not drift.
test('the BreadcrumbList matches the visible trail', async ({ page }) => {
  await page.goto(FIXTURES.article.url);
  const list = byType(await graph(page), 'BreadcrumbList');
  const crumbs = await page
    .getByRole('navigation', { name: "Fil d'Ariane" })
    .getByRole('listitem')
    .allTextContents();

  expect(list.itemListElement.map((item) => item.name)).toEqual(crumbs.map((text) => text.trim()));
  expect(list.itemListElement.map((item) => item.position)).toEqual(crumbs.map((_, i) => i + 1));
});

test('microdata is gone', async ({ page }) => {
  await page.goto(FIXTURES.article.url);
  await expect(page.locator('[itemprop]')).toHaveCount(0);
});
