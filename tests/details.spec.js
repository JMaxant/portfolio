import { test, expect } from '@playwright/test';
import { FIXTURES } from './pages.js';

// #170: the AI disclaimer is the `details.html` partial, rendered by `_default/single.html`
// only when the front matter carries `aiDisclaimer`. See docs/components.md#detailshtml.
const disclaimer = (page) => page.locator('details.details--ai-disclaimer');

test('an article with aiDisclaimer shows it, closed by default', async ({ page }) => {
  await page.goto(FIXTURES.disclaimer.url);

  await expect(disclaimer(page)).toHaveCount(1);
  await expect(disclaimer(page)).not.toHaveAttribute('open', '');
  await expect(disclaimer(page).locator('summary')).toHaveText(/\S/);
  await expect(disclaimer(page).locator('.details__body')).toBeHidden();
});

test('the summary opens the disclaimer from the keyboard', async ({ page }) => {
  await page.goto(FIXTURES.disclaimer.url);

  await disclaimer(page).locator('summary').focus();
  await page.keyboard.press('Enter');

  await expect(disclaimer(page)).toHaveAttribute('open', '');
  await expect(disclaimer(page).locator('.details__body')).toHaveText('Partial (outline and proofreading)');

  await page.keyboard.press('Space');
  await expect(disclaimer(page)).not.toHaveAttribute('open', '');
});

test('the summary is a touch target of at least 44px', async ({ page }) => {
  await page.goto(FIXTURES.disclaimer.url);

  const box = await disclaimer(page).locator('summary').boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
});

test('an article without aiDisclaimer emits no details block', async ({ page }) => {
  await page.goto(FIXTURES.article.url);

  await expect(page.locator('.details')).toHaveCount(0);
});
