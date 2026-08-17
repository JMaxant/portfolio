import { test, expect } from '@playwright/test';

// #69 : deux régressions de media query que la suite overflow ne peut pas voir, parce
// qu'aucune des deux ne fait déborder la page.
//
// 1. Sous 560px, la grille de .entry-list__item doit se replier sur une colonne. L'override
//    était écrit `.entry-list li` (0,1,1) face à une base `.entry-list .entry-list__item`
//    (0,2,0) : mort, alors que le déplacement de .entry-list__body, lui, s'appliquait.
// 2. À 768px pile, une seule des deux mises en page doit être active. La grille de cartes
//    était en min-width quand tout le reste est en max-width.

const COLLAPSE = 560;
const TABLET = 768;

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

test.describe('768px boundary', () => {
  // Exactement à la borne, le régime mobile s'applique : c'est le sens de toutes les autres
  // media queries du projet, qui sont en `width <= 768px`.
  for (const [label, width, burgerVisible] of [
    ['just below', TABLET - 1, true],
    ['exactly on', TABLET, true],
    ['just above', TABLET + 1, false],
  ]) {
    test(`${label} the breakpoint, chrome and card grid agree`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      const { burger, gap } = await page.evaluate(() => ({
        burger: getComputedStyle(document.querySelector('.menu-toggle')).display !== 'none',
        gap: getComputedStyle(document.querySelector('.cards--grid')).gap,
      }));

      expect(burger).toBe(burgerVisible);
      // --spacing-md (16px) en mobile, --spacing-xl (40px) en desktop : le gap doit suivre
      // le burger, pas le contredire.
      expect(gap).toBe(burgerVisible ? '16px' : '40px');
    });
  }
});
