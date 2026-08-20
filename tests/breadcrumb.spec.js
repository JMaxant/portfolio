import { test, expect } from '@playwright/test';

// The trail is built from Ancestors, so the assertions state the expected chain rather than
// counting items. See docs/components.md#breadcrumbhtml.
const trail = (page) => page.getByRole('navigation', { name: "Fil d'Ariane" });

const cases = [
  { name: 'blog list', url: '/blog/', links: ['Accueil'], current: 'Blog' },
  { name: 'blog article', url: '/blog/apprendre-go-venant-de-php/', links: ['Accueil', 'Blog'], current: 'Apprendre Go en venant de PHP : premières impressions' },
  { name: 'projet', url: '/projets/api-suivi-go/', links: ['Accueil', 'Projets'], current: 'API de suivi en Go' },
  { name: 'tags list', url: '/tags/', links: ['Accueil'], current: 'Tags' },
  { name: 'tag term', url: '/tags/go/', links: ['Accueil', 'Tags'], current: 'Go' },
  { name: 'parcours', url: '/parcours/', links: ['Accueil'], current: 'Parcours' },
];

for (const { name, url, links, current } of cases) {
  test(`${name} renders its own ancestor trail`, async ({ page }) => {
    await page.goto(url);

    await expect(trail(page).getByRole('link')).toHaveText(links);
    await expect(trail(page).locator('[aria-current="page"]')).toHaveText(current);
  });
}

test('the current page is not a link', async ({ page }) => {
  await page.goto('/blog/apprendre-go-venant-de-php/');

  await expect(trail(page).locator('[aria-current="page"]')).toHaveJSProperty('tagName', 'SPAN');
});

// Chromium exposes generated content, so a separator without the empty alt-text lands in
// the accessibility tree between every crumb.
test('the separator is not announced', async ({ page }) => {
  await page.goto('/blog/apprendre-go-venant-de-php/');

  expect(await trail(page).ariaSnapshot()).not.toContain('>');
});

test('the home page carries no trail', async ({ page }) => {
  await page.goto('/');

  await expect(trail(page)).toHaveCount(0);
});
