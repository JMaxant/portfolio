import { test, expect } from '@playwright/test';

// #69 : régression de media query que la suite overflow ne peut pas voir, parce qu'elle ne
// fait pas déborder la page. Sous 560px, la grille de .entry-list__item doit se replier sur
// une colonne. L'override était écrit `.entry-list li` (0,1,1) face à une base
// `.entry-list .entry-list__item` (0,2,0) : mort, alors que le déplacement de
// .entry-list__body, lui, s'appliquait.

const COLLAPSE = 560;

test.describe('entry list below 560px', () => {
  test('the item grid collapses to a single column', async ({ page }) => {
    await page.setViewportSize({ width: COLLAPSE - 1, height: 900 });
    await page.goto('/blog/');

    const { item, body } = await page.evaluate(() => {
      const el = document.querySelector('.entry-list__item');
      const bodyEl = document.querySelector('.entry-list__body');
      return {
        item: Math.round(el.getBoundingClientRect().width),
        body: Math.round(bodyEl.getBoundingClientRect().width),
      };
    });

    // Le corps occupe toute la largeur de l'entrée, au lieu d'être écrasé dans l'ancienne
    // colonne de date (120px, quelle que soit la largeur du viewport).
    expect(body).toBe(item);
  });

  test('the two-column layout is still there just above the breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: COLLAPSE + 1, height: 900 });
    await page.goto('/blog/');

    const columns = await page.locator('.entry-list__item').first()
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);

    expect(columns).toBe(2);
  });
});
