// Content pages the suites target. They live in tests/fixtures/content, mounted over the
// editorial content for the test server only (see docs/tests-layout.md#fixtures), so
// editing or deleting a real page cannot break a test.
export const FIXTURES = {
  // Long title and an intro, for the breadcrumb truncation and the italic intro.
  article: { url: '/blog/fixture-article/', title: 'Fixture article with a title long enough to overflow the breadcrumb at 320px wide' },
  // Shortcode and relative links in the body, for the Markdown twin.
  markdownArticle: { url: '/blog/fixture-markdown/' },
  project: { url: '/projets/fixture-project/', title: 'Fixture project' },
  projectWithRepo: { url: '/projets/fixture-project-repo/', repo: 'https://example.com/fixture/repo' },
  table: { url: '/fixture-table/' },
  parcours: { url: '/a-propos/fixture-parcours/', title: 'Fixture parcours' },
  tag: { url: '/tags/fixture-tag/', title: 'Fixture-Tag' },
};

// Pages probed by the cross-cutting test suites (overflow, a11y). Paths are relative to
// playwright.config.ts's use.baseURL.
export const PAGES = [
  ['blog list', '/blog/'],
  ['table', FIXTURES.table.url],
  ['parcours', FIXTURES.parcours.url],
];
