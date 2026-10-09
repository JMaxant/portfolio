---
title: Post-deploy checklist
date_published: 2026-10-03
date_modified: 2026-10-09
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
| `Referrer-Policy`, `Permissions-Policy` and `frame-ancestors` on the HTML pages (#174) | `tests/live/smoke.spec.js`; set in `layouts/index.headers`, see [seo.md](seo.md#security-headers) |
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

## Public addresses

The site answers on `https://www.julien-maxant.com` only. `workers_dev` and `preview_urls` are
off in `wrangler.jsonc`, so the Worker has no `workers.dev` address and no per-version preview
URL: a second public copy would be one more address to keep consistent with the canonical one.

- **Apex**: `julien-maxant.com` is a proxied DNS record with a redirect rule to `www` (301,
  path and query string kept). "Always Use HTTPS" is on, so `http://` reaches the same rule.
- **PR previews** are not set up. Adding them means `preview_urls = true` and a job running
  `wrangler versions upload`, and the preview URL is public: nothing there is private.
- **To test a build before it ships**, serve `public/` locally (`task serve`).

## Cloudflare zone settings

The zone's settings live in the Cloudflare dashboard, not in this repository: recreating the
zone means redoing all of them. This is the state they were set to at launch.

**DNS**

- `www` is created by attaching the custom domain to the Worker (Workers & Pages, `portfolio`,
  Settings, Domains & Routes). Do not add it by hand: an existing record blocks the attach.
- The apex is a proxied `A` record to `192.0.2.1`, an address reserved for documentation where
  nothing listens. It exists only so that the redirect rule below can answer.
- Records for the domain's mailboxes, if any, stay "DNS only": a proxied `MX` or DKIM record
  breaks mail.

**Rules**

| Rule | Value |
|------|-------|
| Redirect Rule, apex to `www` | Wildcard pattern `https://julien-maxant.com/*`, target `https://www.julien-maxant.com/${1}`, 301, query string preserved. The pattern starts with `https://` on purpose: "Always Use HTTPS" upgrades `http://` first, and a looser pattern would also match `www` and loop |

**SSL/TLS, Edge Certificates**

| Setting | Value |
|---------|-------|
| Always Use HTTPS | On |
| Minimum TLS version | 1.2 |
| HSTS | On, `max-age` 6 months, **no** `includeSubDomains`, **no** preload: it is hard to undo, so it starts modest |
| No-Sniff header | On (`X-Content-Type-Options: nosniff`) |

The other security headers are not set here but in `layouts/index.headers`: see [seo.md](seo.md#security-headers).

**Left off on purpose**

- **Web Analytics and Real User Measurements.** Cloudflare injects a `beacon.min.js` into HTML
  for browsers, which conflicts with the "no analytics" rule of the
  [cahier des charges](cahier-des-charges.md) (section 9) and adds a script. It is invisible to
  `curl` without browser headers: check with a browser-like request, not a plain one.
- **Bot Preference Sync.** It would prepend lines to `robots.txt`, and `layouts/robots.txt` is the
  single source of that file (see [seo.md](seo.md#robotstxt)).
- **Rocket Loader** and **Email Address Obfuscation**: both rewrite page content.

**Deploy credentials.** The Deploy workflow reads the GitHub secrets `CLOUDFLARE_API_TOKEN`
(Workers Scripts edit, plus read access to account settings, user details and memberships, on the
one account) and `CLOUDFLARE_ACCOUNT_ID`. The token has an expiry date, **2027-01-04**: a
deploy fails with an authentication error after it, until a new token replaces the secret.

**Checking it** (the `--resolve` form works before DNS has propagated to your resolver):

```sh
curl -sI https://www.julien-maxant.com/ | grep -iE "strict-transport|x-content-type"
curl -s -A "Mozilla/5.0" -H "accept: text/html" -H "sec-fetch-dest: document" \
  https://www.julien-maxant.com/ | grep -c cloudflareinsights    # expect 0
```

**Not done yet**

- **DNSSEC.** Off for now: re-enable it at Cloudflare after the registrar transfer, which adds the
  DS record itself.
- **Mail records.** Once the mailboxes are gone, drop their records, then publish `v=spf1 -all`, a
  null `MX` (`0 .`) and a DMARC record so that nobody can send mail as the domain.

## 3. Record the run

At the end of a run, note the date, the URL and the commit deployed in the issue or PR that
triggered it. A bug found here becomes its own issue, not an item on this list.
