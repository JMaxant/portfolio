import { test, expect } from '@playwright/test';

// #69 : deux régressions de media query que la suite overflow ne peut pas voir, parce
// qu'aucune des deux ne fait déborder la page.
//
// 1. Sous --bp-mobile, la grille de .entry-list__item doit se replier sur une colonne.
//    L'override était écrit `.entry-list li` (0,1,1) face à une base
//    `.entry-list .entry-list__item` (0,2,0) : mort, alors que le déplacement de
//    .entry-list__body, lui, s'appliquait.
// 2. À --bp-tablet pile, une seule des deux mises en page doit être active. La grille de
//    cartes était en min-width quand tout le reste est en max-width.
//
// Les valeurs sont recopiées des tokens, comme les media queries elles-mêmes ; c'est
// scripts/quality/check-breakpoints.mjs qui garantit qu'elles restent alignées.

const MOBILE = 576;
const TABLET = 768;

test.describe('entry list below the mobile breakpoint', () => {
  test('the item grid collapses to a single column', async ({ page }) => {
    await page.setViewportSize({ width: MOBILE - 1, height: 900 });
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
    await page.setViewportSize({ width: MOBILE + 1, height: 900 });
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

// Le repli sous --bp-mobile n'appartient qu'à l'agencement par défaut. Les deux variantes
// gardent leurs colonnes — d'où le `:not()` dans components/entry-list.css, qui vaut (0,3,0)
// et bat la base (0,2,0). Sans lui elles se replieraient toutes les deux.
test.describe('the entry-list modifiers keep their columns below the breakpoint', () => {
  test('--compact keeps three columns and lets the title span them', async ({ page }) => {
    await page.setViewportSize({ width: MOBILE - 1, height: 900 });
    await page.goto('/');

    const { columns, title } = await page.evaluate(() => {
      const item = document.querySelector('.entry-list--compact .entry-list__item');
      return {
        columns: getComputedStyle(item).gridTemplateColumns.split(' ').length,
        title: getComputedStyle(item.querySelector(':scope > a')).gridColumnEnd,
      };
    });

    expect(columns).toBe(3);
    expect(title).toBe('-1');
  });

  test('--stacked keeps three columns down to 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/tags/');

    const columns = await page.locator('.entry-list--stacked .entry-list__item').first()
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);

    expect(columns).toBe(3);
  });
});
