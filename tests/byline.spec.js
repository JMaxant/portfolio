import { test, expect } from '@playwright/test';
import { FIXTURES } from './pages.js';

// #170: the byline is a `dl` of label / value pairs, with the tags beside it in
// `.single__meta`. See docs/components.md#dates.
const labels = (page) => page.locator('dl.byline .byline__label').allTextContents();

test('a blog article lists its publication date, update date and reading time', async ({ page }) => {
  await page.goto(FIXTURES.disclaimer.url);

  expect(await labels(page)).toEqual(['Publié le', 'Mis à jour le', 'Lecture']);
});

test('the update date only appears when lastmod is later than the date', async ({ page }) => {
  await page.goto(FIXTURES.article.url);

  expect(await labels(page)).toEqual(['Publié le', 'Lecture']);
});

test('every label has a value in the same entry', async ({ page }) => {
  await page.goto(FIXTURES.disclaimer.url);

  for (const item of await page.locator('dl.byline .byline__item').all()) {
    await expect(item.locator('dt')).toHaveCount(1);
    await expect(item.locator('dd')).toHaveText(/\S/);
  }
});

test('the tags sit in the same row as the byline on a wide viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(FIXTURES.disclaimer.url);

  const byline = await page.locator('dl.byline').boundingBox();
  const tags = await page.locator('.single__meta .tags').boundingBox();
  expect(tags.x).toBeGreaterThan(byline.x + byline.width - 1);
  expect(tags.y).toBeLessThan(byline.y + byline.height);
});

test('a project has no reading time and groups its links in one entry', async ({ page }) => {
  await page.goto(FIXTURES.projectWithRepo.url);

  const found = await labels(page);
  expect(found).toContain('Liens');
  expect(found).not.toContain('Lecture');

  const repo = page.locator('.byline__value--links a');
  await expect(repo).toHaveAttribute('href', FIXTURES.projectWithRepo.repo);
  await expect(repo).toHaveAttribute('target', '_blank');
});

test('a project without links has no Liens entry', async ({ page }) => {
  await page.goto(FIXTURES.project.url);

  expect(await labels(page)).not.toContain('Liens');
});
