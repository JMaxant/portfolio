// Content pages the suites target. They live in tests/fixtures/content, mounted over the
// editorial content for the test server only (see docs/tests-layout.md#fixtures), so
// editing or deleting a real page cannot break a test.
export const FIXTURES = {
  // Long title and an intro, for the breadcrumb truncation and the italic intro.
  article: { url: '/blog/fixture-article/', title: 'Fixture article with a title long enough to overflow the breadcrumb at 320px wide' },
  // `aiDisclaimer`, `lastmod` and three tags: every entry of the byline and the details block.
  disclaimer: { url: '/blog/fixture-disclaimer/' },
  // Shortcode and relative links in the body, for the Markdown twin.
  markdownArticle: { url: '/blog/fixture-markdown/' },
  project: { url: '/projets/fixture-project/', title: 'Fixture project' },
  projectWithRepo: { url: '/projets/fixture-project-repo/', repo: 'https://example.com/fixture/repo' },
  table: { url: '/fixture-table/' },
  // A highlighted block wider than any viewport the suite uses.
  code: { url: '/fixture-code/' },
  parcours: { url: '/a-propos/fixture-parcours/', title: 'Fixture parcours' },
  tag: { url: '/tags/fixture-tag/', title: 'fixture-tag' },
};

// Pages probed by the cross-cutting test suites (overflow, a11y). Paths are relative to
// playwright.config.ts's use.baseURL.
export const PAGES = [
  ['blog list', '/blog/'],
  ['table', FIXTURES.table.url],
  ['parcours', FIXTURES.parcours.url],
  // The widest byline: three entries and three tags in one flex row.
  ['article with disclaimer', FIXTURES.disclaimer.url],
  ['project with repository', FIXTURES.projectWithRepo.url],
];

// One page per template, for the a11y suite: landmark, heading and h1 rules only mean
// something once every layout has been scanned. The 404 is served at /404.html.
export const A11Y_PAGES = [
  ['home', '/'],
  ...PAGES,
  ['article', FIXTURES.article.url],
  ['code block', FIXTURES.code.url],
  ['projects list', '/projets/'],
  ['project', FIXTURES.project.url],
  ['watch list', '/veille/'],
  ['tag index', '/tags/'],
  ['tag term', FIXTURES.tag.url],
  ['404', '/404.html'],
];
