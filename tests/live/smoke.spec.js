import { test, expect } from '@playwright/test';

// Post-deploy smoke tests, run against a live site (BASE_URL), so real content only: the
// fixtures are not deployed. See docs/post-deploy-checklist.md.

test('the end-to-end path home, project, blog, contact works', async ({ page }) => {
  // Direct section URLs: the menu is behind a burger on mobile, and nav.spec.js covers it.
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();

  await page.goto('/projets/');
  await page.locator('main a[href^="/projets/"]').first().click();
  await expect(page.locator('h1')).toBeVisible();

  await page.goto('/blog/');
  await page.locator('main a[href^="/blog/"]').first().click();
  await expect(page.locator('h1')).toBeVisible();

  await page.goto('/');
  await expect(page.locator('a.cta[href^="mailto:"]').first()).toBeVisible();
});

test('the theme choice survives a reload', async ({ page }) => {
  await page.goto('/');
  // Below 768px the switcher panel lives in the burger menu and has no toggle of its own.
  const toggle = page.locator('.theme-switcher__toggle');
  const burger = page.locator('.menu-toggle');
  await (await burger.isVisible() ? burger : toggle).click();
  await page.click('label[for="theme-dark"]');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#theme-dark')).toBeChecked();
});

test('the crawler files are served and point to this very site', async ({ request, baseURL }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  const sitemap = (await robots.text()).match(/^Sitemap: (\S+)$/m)?.[1];
  // A wrong baseURL at build time ships a sitemap for another host.
  expect(new URL(sitemap).origin).toBe(new URL(baseURL).origin);

  for (const path of [new URL(sitemap).pathname, '/llms.txt']) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
});

test('a Markdown version carries a canonical Link header to its HTML page', async ({ page, request }) => {
  await page.goto('/blog/');
  const article = await page.locator('main a[href^="/blog/"]').first().getAttribute('href');
  const response = await request.get(`${article}index.md`);

  expect(response.status()).toBe(200);
  // Only the path is compared: the header names the production host, whatever host is tested.
  const canonical = response.headers().link?.match(/^<([^>]+)>; rel="canonical"$/)?.[1];
  expect(new URL(canonical).pathname).toBe(article);
  expect(response.headers()['content-type']).toBe('text/markdown; charset=utf-8');
});

test('the text files are served as UTF-8', async ({ request }) => {
  // Without a charset a browser guesses one and shows `Ã©` for `é`: #168.
  for (const path of ['/llms.txt', '/robots.txt']) {
    expect((await request.get(path)).headers()['content-type'], path).toBe('text/plain; charset=utf-8');
  }
});

test('the HTML pages carry the security headers', async ({ request }) => {
  // Set in layouts/index.headers: only a deployed site proves the host applies them. #174.
  const headers = (await request.get('/')).headers();

  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()');
  expect(headers['content-security-policy']).toBe("frame-ancestors 'none'");
});

test('the outgoing links are not dead', async ({ page, request }) => {
  await page.goto('/');
  const mailto = await page.locator('a.cta[href^="mailto:"]').first().getAttribute('href');
  expect(mailto).toMatch(/^mailto:[^@\s]+@[^@\s]+$/);

  const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph'];
  const profiles = graph.find((node) => node['@type'] === 'Person').sameAs;
  expect(profiles.length).toBeGreaterThan(0);

  // The profiles must be on the page, not only in the structured data: #173.
  const footerLinks = await page.locator('.site-footer a').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  for (const url of profiles) {
    expect(footerLinks, `${url} is missing from the footer`).toContain(url);
  }

  for (const url of profiles) {
    // Retried: the big platforms answer 5xx now and then to a client that is not a browser.
    await expect.poll(async () => {
      const status = (await request.get(url)).status();
      // LinkedIn answers 999 to anything that is not a logged-in browser: the page exists.
      return status < 400 || (status === 999 && new URL(url).hostname.endsWith('linkedin.com'));
    }, { message: `${url} is dead`, intervals: [1000, 3000, 5000], timeout: 20000 }).toBe(true);
  }
});
