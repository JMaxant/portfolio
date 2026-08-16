---
title: ADR 0001 — Exclude Markdown task lists from cas-max
version: 1.0.0
date_published: 2026-08-16
date_modified: 2026-08-16
---

# Exclude Markdown task lists from cas-max

Status: accepted

`content/cas-max.md` (#78) is meant to exercise every HTML element a Markdown file can
produce, so each one gets styled once and checked in isolation instead of piecemeal in
production. We added a `tasklist` section (`- [ ] …`) to cover it.

Goldmark's `tasklist` extension renders `<li><input type="checkbox" disabled> text</li>`
with no `<label>`, no `aria-label`, and no `aria-labelledby`. `@axe-core/playwright`
(`tests/a11y.spec.js`) flags every instance as a **critical** `label` violation (WCAG
4.1.2, RGAA 11.1.1) in both themes.

There is no template-level fix: Hugo's Goldmark render hooks cover `heading`, `link`,
`image`, `codeblock`, `blockquote`, `passthrough`, and `table` — not list items — so a
`<label>` cannot be injected without raw HTML in the Markdown, which `unsafe = false`
deliberately blocks (see `docs/cahier-des-charges.md` and the "à trancher" note in #78
for `details`/`kbd`/`abbr`). Fixing it would mean either flipping `unsafe` to `true`
sitewide, or adding a scoped `a11y.spec.js` exception to accept the violation as a known
limitation — the same pattern already used for the header overflow tracked in #72.

We rejected both: `unsafe = true` is a sitewide security-relevant change disproportionate
to one demo checkbox, and a standing a11y exception risks becoming precedent for
tolerating future violations. The task-list section was removed from `cas-max.md`
instead. Consequence: `tasklist` styling (bullet + checkbox layout) stays untested by the
reference page and is deferred until Goldmark or Hugo ships an accessible task-list
render path.
