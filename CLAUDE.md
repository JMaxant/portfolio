# CLAUDE.md

Personal portfolio site. Hugo static site, `hugo-bearcub` theme consumed as a Hugo Module
and vendored in `_vendor/`. Plain CSS, no framework, no JS framework.

Work is tracked as GitHub issues grouped into phase milestones. `docs/cahier-des-charges.md`
is the running spec — check it before proposing scope.

## Commands

```sh
task setup   # npm ci + install the lefthook pre-commit hook
task qa      # every quality check on all files — same thing CI runs
task qa:fix  # auto-fix what can be auto-fixed (stylelint, taplo, markdownlint)
task serve   # hugo serve -D
```

`task qa` runs `lefthook run pre-commit --all-files`. `lefthook.yml` is the single source
of truth: `ci.yml` calls the same command, so CI cannot drift from the local hook. Run it
before claiming work is done.

**Lefthook lints the index, not the working tree.** After `task qa:fix` — or any edit to an
already-staged file — re-run `git add` on it, otherwise the hook keeps reporting errors at
line numbers that no longer match what you see on disk. A failure you cannot reproduce by
running the linter directly on the file is this, every time: compare with
`git show :<path>`.

## Build

- **Hugo extended**, version pinned in `.github/actions/setup-hugo/action.yml`. Match that
  version rather than installing latest.
- **A Hugo `WARN` is a failure.** `scripts/quality/check-hugo-build.sh` greps the build log
  and exits non-zero on any warning.
- CSS is bundled by Hugo's native `css.Build` (esbuild), minified and fingerprinted in
  production only. Never add PostCSS or an autoprefixer — `css.Build` handles prefixes and
  down-levelling from the `browserslist` targets.
- Verify rendered output in `public/`, but rebuild with `--cleanDestinationDir` first:
  stale fingerprinted CSS files accumulate and will make you draw false conclusions.
  Note that `--minify` strips quotes around attribute values with no spaces, which breaks
  naive greps for `class="…"`.

## Conventions

### Comments

Keep them **short — a few lines at most**. A comment says what the code cannot: the trap, the
constraint, the reason a value is what it is. The long-form reasoning belongs in `docs/`, and
the comment links to it (`See docs/components.md#navhtml`) rather than restating it.

In JavaScript, use `//` repeated on each line, not a `/* … */` block. CSS has no line comment,
so `/* */` there is unavoidable.

### Commits

`type: short description - refs #N`, types `feat` / `fix` / `docs` / `chore` /
`enhancement`. Always reference the issue.

### Templates

Reusable partials take an **explicit dict**, never the current context — so inside them,
page fields need the `.page.` prefix. Contracts are documented in a Go comment at the top
of each file, and in `docs/components.md`. Read that file before touching a partial; it
records the templating traps this project keeps hitting (`with` rebinding `.`, dynamic tag
names needing `safeHTML`).

Validate parameters with `errorf` against a whitelist, before emitting any output.

### CSS

- Every value comes from a token in `base/tokens.css`. No hardcoded colour, spacing or font
  size in a component. That covers sizes, z-indexes and durations too — a control size, a
  stacking order or a transition duration repeated across two files is a token waiting to be
  named.
- A custom property that JavaScript writes at runtime is still declared in `base/tokens.css`,
  holding its static fallback. Undeclared, it is invisible to anyone reading the stylesheet,
  and its fallback drifts silently (`--header-height` read `8rem` for a 127px header).
- Never consume a raw palette (`--light-*`, `--dark-*`) outside `base/tokens.css`. Components
  use semantic tokens (`--color-surface`, `--color-text-soft`) so theming keeps working.
- BEM: `bloc__element` for a sub-part, `bloc bloc--modifier` for a variant. If both classes
  sit on the same element, the second is a modifier and takes `--`.
- Breakpoints are hardcoded (custom properties are illegal in media query conditions), so
  the `--bp-*` tokens are declarative only. Two values, `768px` and `576px`, always written
  `@media screen and (width <= Npx)` — desktop-first, never a `min-width`. Reuse one:
  `scripts/quality/check-breakpoints.mjs` fails on a width matching no token, and on a token
  no query uses. Values and locations in `docs/css-tokens.md`, update it when adding one.
- `assets/styles/` is split into `base/`, `components/`, `layout/` and `utils.css`.
  `main.css` is the only file carrying `@import`: it holds the cascade order, which is not
  alphabetical, and `utils.css` stays last. An `@import` written after a rule is not
  inlined by esbuild and reaches the built CSS as a 404 — with no Hugo warning.

### Documentation

Lives in `docs/` only. Frontmatter: `title`, `version`, `date_published`, `date_modified`.

**Write documentation in English** — that includes new files, edits to existing ones, and
the README. Code comments and commit messages are English too, `tests/*.spec.js` included,
and so is anything published to GitHub: **issue bodies, pull request titles and
descriptions**. French is for conversation in the chat, nothing else.

Some older files are still in French and are being migrated (#73). Do not read them as the
convention, and do not justify a new French file by the ones next to it — check what the
majority of comparable files actually do before claiming to follow the local style.

## Do not touch

- `_vendor/` — vendored Hugo module, regenerated, never hand-edited.
- `CODE_REVIEW.md` — gitignored local review artifact.
- Do not extend the `ignore` list in `.stylelintrc.json` without proving the case per the
  rules in `docs/css-compat.md`. Entries justified against an older browser baseline go
  stale silently; re-test them when the baseline moves.

## Gotchas

- `.Lastmod` has no reliable source yet (no `enableGitInfo`, no `frontmatter.lastmod`), so
  anything ordered by it reorders on a fresh clone. Tracked by #70.
- Do not wrap a URL in angle brackets in Markdown (`url="<mailto:…>"`): they are treated as
  an autolink and end up percent-encoded in the `href`, breaking the link.
- The bear-cub `_default/list.html` emits no `h1`. List and taxonomy pages currently have
  none — do not assume the theme provides one.
