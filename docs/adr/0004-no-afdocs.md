---
title: ADR 0004 — Do not adopt afdocs
version: 1.0.0
date_published: 2026-10-02
date_modified: 2026-10-02
---

# Do not adopt afdocs

Status: accepted

[afdocs](https://afdocs.dev/) audits a site against the
[Agent-Friendly Documentation Spec](https://agentdocsspec.com/) (#71). We ran it on the local
build (`afdocs@0.22.2`, `--sampling deterministic`, `--canonical-origin` set to production):
**74/100 (C)**, 16 passed, 7 failed, 5 skipped.

None of the 7 failures is a defect of this site:

- `llms-txt-directive-html` asks for a hidden element aimed at agents: cloaking.
- `content-negotiation` needs server rules (`.htaccess`); no candidate host (#20) is Apache.
- `markdown-url-support`, `llms-txt-links-markdown` and `llms-txt-directive-md` need a `.md`
  twin of every page, which pays off on a large documentation site, not on a handful of pages.
- `llms-txt-coverage` (33%) counts tag pages and listings, which `llms.txt` leaves out on
  purpose: it indexes content, not listings (#18).
- `content-start-position` only fails on `/veille/`, which is empty for now.

The 16 passing checks are either already covered by `tests/robots-llms.spec.js` (`llms.txt`
structure, links, content) and `lychee` (links), or are not at risk on a static Hugo site
(server-side rendering, page weight, status codes, redirects).

With a config skipping the noise, the audit exits 0 and brings nothing that is not already
enforced. Adopting it would add a heavy dependency tree (about 1,200 lines of
`package-lock.json`), a build-and-crawl CI job, and a 0.x tool whose check IDs and flags may
change between minor versions. Hence not in pre-commit either (`ci.yml` mirrors
`lefthook.yml`), nor in a dedicated workflow.

Consequence: the structural checks stay with the Playwright suite. If the site's shape changes
(a documentation section, a host serving markdown), re-run it ad hoc:

```sh
hugo --gc --minify
npx http-server public -p 1313 -s &
npx afdocs@0.22.2 check http://localhost:1313 \
  --canonical-origin https://www.julien-maxant.com --sampling deterministic
```
