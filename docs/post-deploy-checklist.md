---
title: Post-deploy checklist
version: 1.0.0
date_published: 2026-10-03
date_modified: 2026-10-03
---

# Post-deploy checklist

Ref: issues #25, #26, #28, phase 7 of the [cahier des charges](cahier-des-charges.md).

Phase 7 asks whether the site works once everything is online together. Most of that is
already asserted by the Playwright suite ([tests-layout.md](tests-layout.md)) against a local
build, so the recette is two things: re-run a small subset against the deployed URL, then do
the few checks no test can.

## 1. Automated: smoke suite against the live site

```sh
task test:live                                  # default: https://www.julien-maxant.com
task test:live -- https://staging.example.com   # any other deployment
```

This sets `BASE_URL`, which makes `playwright.config.ts` skip the local Hugo server and run
only `tests/live/`, on chromium, firefox, webkit and two mobile profiles (Pixel 7,
iPhone 14). The editorial content is real: the test fixtures are not deployed, which is why
the full suite cannot simply be pointed at production.

| Phase 7 item | Covered by |
|--------------|------------|
| End-to-end path (home, project, blog, contact) | `tests/live/smoke.spec.js` |
| Responsive / cross-browser (#25) | the same tests on 3 desktop and 2 mobile projects; the layout itself is covered locally by `breakpoints`, `overflow`, `nav`, `sticky-footer` and `table` specs |
| Light / dark switch and persistence (#26) | `tests/live/smoke.spec.js`; the full behaviour is in `theme-switcher.spec.js` |
| `robots.txt`, `llms.txt`, `sitemap.xml` reachable | `tests/live/smoke.spec.js`, which also checks the sitemap points to the tested host (a wrong `baseURL` at build time ships a sitemap for another site) |
| Canonical `Link` header and UTF-8 charset on the Markdown versions and text files (#20, #168) | `tests/live/smoke.spec.js`; the canonical check compares the path only, as the header always names the production host |
| Outgoing links (#28) | `tests/live/smoke.spec.js` (mailto shape, GitHub and LinkedIn profiles from `params.social`); the weekly `links-external.yml` covers every other link |

LinkedIn answers `999` to anything that is not a logged-in browser, so that status counts as
alive. Other profile URLs are retried for 20s before failing.

## 2. Manual: what no test can judge

About ten minutes, on the deployed URL.

- [ ] On a real phone: scroll the home page, a project and an article. Nothing clipped, tap
  targets comfortable, the burger menu opens and closes.
- [ ] Safari on iOS: light/dark switch and reload; the system theme follows the OS setting.
- [ ] Click the email button and confirm the mail client opens with the right address.
- [ ] Open the GitHub and LinkedIn links from the site and confirm they land on the right
  profiles.
- [ ] Paste the home page, an article and a project into an external structured-data
  validator (Google Rich Results Test, validator.schema.org): no errors.
- [ ] Share one URL in a chat or social preview tool: title, description and image look right.
- [ ] Screen reader pass: follow [a11y-recette.md](a11y-recette.md).

## 3. Record the run

At the end of a run, note the date, the URL and the commit deployed in the issue or PR that
triggered it. A bug found here becomes its own issue, not an item on this list.
