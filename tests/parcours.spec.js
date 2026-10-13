import { test, expect } from '@playwright/test';
import { FIXTURES } from './pages.js';

// #198, #199: what a text extractor reads from the Parcours, whitespace aside.

test.beforeEach(async ({ page }) => {
  await page.goto(FIXTURES.parcours.url);
});

test('a section heading is separated from its period by more than whitespace', async ({ page }) => {
  const heading = await page.locator('.resume__section h2').first().textContent();

  // Extractors drop the whitespace around an inline span, so squeeze it out as they do.
  expect(heading.replace(/\s+/g, '')).toBe('Actuellement,Depuis2017');
});

test('a period inside one year shows that year once', async ({ page }) => {
  const entry = page.locator('.timeline__item', { hasText: 'Fixture training' });

  await expect(entry.locator('.timeline__period')).toHaveText('2025');
});

test('a period over several years shows both ends', async ({ page }) => {
  const entry = page.locator('.timeline__item', { hasText: 'Fixture role' });

  await expect(entry.locator('.timeline__period')).toHaveText(/^2024\s+→\s+\S+/);
});
