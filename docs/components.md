---
title: Components — partials and integration
version: 1.9.0
date_published: 2026-08-08
date_modified: 2026-08-17
---

# Components — partials and integration

Ref: issues #45, #47, #48, #66, #77. Describes the reusable components from both sides: the **template
contract** (how you call them) and the **CSS contract** (what they expose to integration).
Both live in the same document on purpose — two files indexed on the same components would
drift apart.

For tokens and breakpoints, see [css-tokens.md](css-tokens.md). Partials inherited from the
bear-cub theme and not overridden are out of scope.

## Conventions

### Dictionary-based calls

A reusable partial receives an **explicit dict**, never the current context. The page is
passed under a named key.

```gotemplate
{{ partial "card.html" (dict "page" . "variant" "projet" "title_level" "h3") }}
```

The benefit: the partial becomes callable from any template, its dependency on the page is
visible at a glance, and its options appear on the call line.

The cost: inside the partial, `.` is the dict. Page fields are reached through `.page.Title`,
`.page.RelPermalink`, `.page.Params.status`. **Forgetting the `.page` prefix is the most
common mistake** — it yields an empty value without raising a build error (an empty `href`
on every card, for instance).

Each partial documents its contract at the top of the file, in a Go comment.

### Class naming

BEM, with one distinction to observe strictly:

- `block__element` — a **sub-part** of the component, which does not exist outside it.
  Example: `card__title`, `card__footer`.
- `block block--modifier` — a **variant** of the component, carried by the same element as
  the block. Example: `home home--hero`, `tag tag--light`, `cards cards--grid`.

The test: if both classes sit on the same HTML element, the second is a modifier and takes
`--`. A light tag *is* a tag; a hero section *is* a home section. Neither is a sub-part.

One exception, and only one: **a block may be composed with a layout class**, which is a block
in its own right and takes no `--`. `<article class="single container-content-grid">` is an
article block placed in the content grid; the article *is not* a kind of grid, so the modifier
test does not apply. Read the second class as "put in", not as "variant of". A layout class
owns width, placement and rhythm and nothing else, which is what keeps it composable — the
same pairing existed before with `container--reading single`.

### Where styles live

Four destinations, decided by scope rather than by the template that happens to use the
class first — see [css-tokens.md](css-tokens.md#tree) for the tree itself.

| Destination | What goes there |
|-------------|-----------------|
| `base/elements.css` | Bare element selectors, no class: `h1`, `p`, `a`, `table`, `blockquote` |
| `components/` | A named block reused beyond a single page: `components/card.css`, `components/tag.css`, `components/cta.css` |
| `layout/` | Page chrome and per-template styles: `layout/header.css`, `layout/home.css`, `layout/page.css` |
| `utils.css` | Single-purpose classes composed onto anything: `.container`, `.visually-hidden`, `.meta` |

A class used by one template only still belongs in `layout/`, not in `components/` — the
distinction is reuse, and it is what stops the `.cta`-under-`.home__hero` mistake from
coming back.

## Inventory

### `hero.html`

Home page header.

| Key | Required | Description |
|-----|----------|-------------|
| `baseline` | yes | `<h1>` text |
| `content` | yes | Rendered page content (`.Content`) |

`content` is already rendered HTML (type `template.HTML`): it travels through the dict
without being escaped again.

**Integration** — the partial emits no class of its own; it is styled by the enclosing
section (`.home--hero` in `layout/home.css`), which targets `h1`, `p` and `.cta` directly.

### `card.html`

Content card, used for featured projects.

| Key | Required | Default | Description |
|-----|----------|---------|-------------|
| `page` | yes | — | The page to render |
| `variant` | no | none | Class suffix: `card--<variant>` |
| `title_level` | no | `h3` | Heading level, one of `h2`, `h3`, `h4`, `h5` |

`title_level` exists so the card can sit at the right heading depth for the calling
template, without breaking the heading hierarchy. A value outside the list **fails the
build** through `errorf`; it is not silently ignored.

If `variant` is absent, no extra class is emitted — no empty `card--`.

**Integration** (`components/card.css`):

| Class | Role |
|-------|------|
| `card` | Block: `--color-surface` background, `--border-thin` border, `--border-radius` |
| `card__title` | Title, whatever heading tag was chosen |
| `card__body` | Description, in `--color-text-soft` |
| `card__footer` | Footer: status and tags, inline, wrapping |
| `card--<variant>` | Extension point, unstyled so far |

The block is a **column flexbox** and `card__body` carries `flex-grow: 1`. That is what
keeps the footers of a grid row on the same baseline when the descriptions differ in
length; without it each footer sits right under its own text and the row looks ragged.

`card__body` also carries the `meta` class, which is where its size and colour come from.
`components/card.css` deliberately does not re-declare either — see the note on `.meta` in
`utils.css`.

The component also emits `tag tag--light` (status) and `tag tag--accented` (taxonomy
terms), styled in `components/tag.css`.

**Container** — cards go inside `cards cards--grid`, an `auto-fit` grid using
`minmax(min(280px, 100%), 1fr)`: it reflows without a media query and does not overflow
below 280px.

**Callers** — `layouts/index.html` (featured projects, `title_level: h3` under the section
`h2`), `layouts/projets/list.html` (the whole list, `title_level: h2` under the page `h1`)
and `layouts/parcours/single.html` (skill proofs, `title_level: h5` under the `h4` naming
the skill). The level is not decoration: it is what keeps the heading hierarchy of each page
correct with a single partial.

### `projets-meta.html`

Meta line of a project page, under the title: date, role, status, links to the repository
and to the demo, then taxonomy terms.

| Key | Required | Description |
|-----|----------|-------------|
| `page` | yes | The project page to describe |

Only the date is unconditional; every other entry appears only if the front matter carries
the field (`role`, `status`, `repo`, `demo`, `tags`). A missing `page` fails the build
through `errorf`.

**External links** — `repo` and `demo` leave the site, so they get the same marker as
[`entry-link.html`](#entry-linkhtml) below: `target="_blank" rel="noopener"`, a `↪` glyph
hidden from assistive technology (`aria-hidden`), and a `visually-hidden` text equivalent.
Colour is not the only carrier of the distinction, which is what RGAA 3.3 asks for.
Internal links — the title, the tags — carry none of that. The two partials render the
same marker independently: `entry-link.html` owns the internal/external title link of an
`.entry-list__item`, `projets-meta.html` owns a project's byline, and the two contracts
don't overlap enough to share one partial.

**Integration** — the partial emits `ul.byline.meta`, the same block as the byline of a
blog article (`layout/single.css`). It holds more entries there, hence the `flex-wrap` on
`.byline`. No class of its own: a project meta line *is* a byline, only richer.

### `entry-link.html`

Title link of an `.entry-list__item` entry: an external link built from `.Params.link`, or
a fallback to the page's own permalink when that field is absent.

| Key | Required | Default | Description |
|-----|----------|---------|--------------|
| `page` | yes | — | The entry page to link to |
| `title_class` | no | none | Class added to the `<a>`, e.g. `entry-list__title` |

A missing `page` fails the build through `errorf`. `title_class` is applied to whichever
branch renders — external or internal — so a caller cannot style one branch and not the
other; that split existed by accident in `layouts/tags/term.html` before this partial was
extracted (issue #94) and was not preserved.

**External branch** — when `.Params.link` is set, the `<a>` targets it with
`target="_blank" rel="noopener"`, an optional `hreflang` from `.Params.source_lang`, a `↪`
glyph hidden from assistive technology (`aria-hidden`), and a `visually-hidden` text
equivalent (`i18n "external-link"`). See the note on `projets-meta.html` above for why
that partial repeats the marker instead of calling this one.

**Callers** — `layouts/veille/list.html` and `layouts/tags/term.html` (both pass
`title_class: entry-list__title`), and `layouts/partials/card-taxonomy.html` (no
`title_class`: the compact card layout does not need the larger title size).

### `cta.html`

Call-to-action link.

| Key | Required | Default | Description |
|-----|----------|---------|-------------|
| `url` | yes | — | Link target |
| `label` | yes | — | Visible label |
| `variant` | no | none | Class suffix: `cta--<variant>` |

**Integration** — `.cta` is defined in `components/cta.css`, so it is available everywhere,
including inside an article. `cta--<variant>` is an unstyled extension point so far.

Inside an article the shortcode's output is **not** wrapped in a `<p>` by Hugo, so the `<a>`
becomes a direct child of the article grid and therefore a grid item: blockified, and
stretched over the whole measure by default. `layout/single.css` carries
`.container-content-grid > .cta { justify-self: start }` to restore its intrinsic width. Any
other inline element that can end up as a direct child of `.Content` needs the same guard.

#### `cta` shortcode

`cta.html` is also exposed to Markdown through `layouts/shortcodes/cta.html`, which
validates its parameters then delegates to the partial.

```markdown
{{< cta url="/parcours/" label="Mon parcours" >}}
{{< cta url="/contact/" label="Me contacter" variant="ghost" >}}
```

`url` and `label` are mandatory; a missing one fails the build, reporting the position in
the source file.

Careful with URLs: do not wrap an address in angle brackets (`<…>`). Markdown treats them
as an autolink and they end up percent-encoded as `%3c`/`%3e` in the `href`, breaking the
link.

### `nav.html`

Renders the primary navigation: `menu.html`, the language-switcher links, and
`theme-switcher.html`, wrapped in `<div class="site-nav" id="primary-nav">`. Takes the
current page context, not a dict — called once from `header.html` right after
`.site-header__bar`. `theme-switcher.html` lives here (not in `header.html`) so it ends up
inside the mobile full-screen panel below 768px, rather than needing a second toggle of its
own — see [theme-switcher.md](theme-switcher.md#panel-display-refs-72) for how the
same markup becomes a desktop popover vs. an always-open panel on mobile.

**Integration** (`components/menu.css`, refs #72) — `#primary-nav` is the disclosure panel
controlled by the `.menu-toggle` button rendered in `header.html`. The two are not
adjacent siblings (the button sits inside `.site-header__bar`), so a CSS combinator can't
link them: `nav-toggle.js` toggles both `aria-expanded` on the button and an `.is-open`
class on `.site-nav` from the same call, keeping them in sync from one source of truth in
JS.

| Class | Role |
|-------|------|
| `menu-toggle` | Block: the disclosure button. Hidden above 768px, a fixed square below it |
| `menu-toggle__icon` | Element: the three-bar icon, morphs into a cross via CSS when `aria-expanded="true"` |
| `site-nav` | Block: above 768px, an inline row (menu, language links, theme switcher). Below it, hidden until `.is-open`, then a `position: fixed` panel covering the full viewport |

Below 768px the open panel is `position: fixed; inset: 0`, not a panel confined to the
header's own box — a `max-height` accordion here reads as broken, not subtle, on a phone
screen. `.site-header` carries `background: var(--color-bg)` so it stays opaque against the
panel, but `z-index` alone on `.site-header` is not enough: `.site-nav` is a sibling of
`.site-header__bar` (both children of `.container--wide`), so their stacking order is
decided against each other, not against the ancestor. `.site-header__bar` therefore needs
its own `position: relative; z-index: 2` — one above the panel's `z-index: 1` — so the
title and the toggle button (with its now-a-cross icon) stay visibly on top of, and clip,
the part of the fixed panel that would otherwise paint over them.

Clipping the overlap visually is not enough on its own: the panel's own content still needs
to start below the header, or the first link renders underneath it. `nav-toggle.js` measures
`.site-header`'s real height (title wraps to two lines, so this isn't a constant) and writes
it to `--header-height` on `:root`; `.site-nav.is-open`'s `padding-block-start` reads that
custom property (`calc(var(--header-height, 8rem) + var(--spacing-lg))`) instead of a fixed
token. Re-measured on `resize`.

`body:has(.site-nav.is-open) { overflow: hidden }` stops the page scrolling behind the
panel.

`assets/scripts/nav-toggle.js` (loaded automatically, see `layouts/_default/baseof.html`)
toggles `aria-expanded`, closes on `Escape` (returning focus to the button), and closes
when a nav link is activated. It stays a disclosure widget rather than a dialog: no focus
trap, no `role="dialog"`, no focus restoration beyond `Escape`.

That classification does not settle what happens to the content behind it, though. Below
768px the open panel is `position: fixed; inset: 0` with an opaque background, so it covers
the page instead of pushing it down — a modal in everything but name. Left alone, `Tab`
walked out of the last nav control into a `<main>` the user could not see, with no
indication of where focus had gone (WCAG 2.4.3 Focus Order, and 2.4.11 Focus Not Obscured
in WCAG 2.2). `nav-toggle.js` therefore sets `inert` on `<main>` and `.site-footer` while
the panel is open, guarded on `matchMedia('(max-width: 768px)')` so the desktop row — which
obscures nothing — is untouched. One attribute removes that content from the tab order and
from the accessibility tree at once; `body:has(…) { overflow: hidden }` above only handles
the scroll half of the same problem.

Crossing the breakpoint upwards with the panel open closes it, the same reset
`theme-toggle.js` performs: above 768px the toggle is hidden, so a leftover
`aria-expanded="true"` would describe a control the user can no longer reach — and the
closing pass is what releases `inert`.

The `aria-expanded` toggling, the `.is-open` mirroring and the `Escape` handler are not
written here: they come from `assets/scripts/00-disclosure.js`, shared with the theme
switcher, which is the other disclosure in the header. The `00-` prefix is load-bearing —
`baseof.html` bundles `resources.Match "scripts/*.js"`, which sorts by path, so the helper
has to concatenate before its two consumers. It publishes on `window` because after
concatenation each script is still its own IIFE.

The helper's `onChange` callback fires on every transition, opening and closing alike, and
is what both consumers hook into — `nav-toggle.js` for `inert`, `theme-switcher.html` for
moving focus onto the checked radio. A caller cannot get the same effect by wrapping the
returned `setOpen`, because the helper's own click and `Escape` handlers call the internal
one directly and would bypass the wrapper.

**Without JavaScript** — nothing can add `.is-open`, so a panel left at `display: none`
below 768px means no reachable navigation at all: menu, language links and theme switcher
are all inside `.site-nav`. `components/menu.css` hides `.menu-toggle` under `:root:not(.js)` and
puts `.site-nav` back in flow at the same width, the same treatment
`components/theme-switcher.css` applies
to the theme trigger. `:root:not(.js) .site-nav` is 0-2-0 against the 0-1-0 of the
`display: none` rule, so it wins on specificity without `!important` and without depending
on rule order, and `theme-init.js` adds the class before the first paint so the scripted
case never flashes an expanded nav.

`tests/nav.spec.js` covers the disclosure behaviour, the scroll lock, focus containment,
the breakpoint reset and the no-JS rendering on both sides of the breakpoint.

### `theme-switcher.html`

Icon trigger plus a group of three radios (light / dark / system). **Expected context:
none** — the partial reads nothing from the page, only `i18n`, so it is called with an empty
`dict` from `nav.html`.

Behaviour, storage contract and accessibility rationale live in
[theme-switcher.md](theme-switcher.md); only the CSS contract is repeated here.

| Class | Role |
|-------|------|
| `theme-switcher` | Block: the positioning context (`position: relative`) the popover anchors to. Applied by `nav.html`, not by the partial. Hidden whole by `:root:not(.js)` — see [theme-switcher.md](theme-switcher.md#without-javascript) for why the radios cannot stand on their own |
| `theme-switcher__toggle` | Element: the disclosure button. Hidden below 768px, where the panel is always open |
| `theme-switcher__icon` | Element: the sun glyph, rendered twice — in the trigger, and in the `<legend>` where it only shows below 768px |
| `theme-switcher__panel` | Element: the `<fieldset>`. `display: none` until `.is-open` above 768px, permanently visible below it |
| `theme-switcher__body` | Element: the `clear: both` wrapper that the floated `<legend>` needs |
| `theme-switcher__wrapper` | Element: the segmented row of the three options |
| `theme-switcher__value` | Element: the hidden span carrying the current theme inside the trigger's accessible name, kept in sync by `theme.js` |
| `is-open` | State, on the panel: mirrors the trigger's `aria-expanded`, same pattern as `site-nav` |

The mobile rules state `position: static` for both `.theme-switcher__panel` and
`.theme-switcher__panel.is-open`. That second selector is not redundant: a media query adds
no specificity, so the popover's `.is-open` rules (0-3-0) would otherwise outrank the mobile
block (0-2-0) and leave the panel absolutely positioned inside the burger menu.

### `menu.html`

Renders a `<nav><ul>` from a Hugo menu, looked up dynamically by name.

| Key | Required | Default | Description |
|-----|----------|---------|-------------|
| `menuName` | yes | — | Menu identifier: `main` or `error` |

`menuName` is checked against a whitelist with `errorf` before any output, since Go
templates cannot do dynamic field access (`.Site.Menus.$menuName`) — the menu is fetched
with `index site.Menus .menuName` instead. The resulting class is `menu--<menuName>`.

**Callers** — `nav.html` (`menuName: main`), `layouts/404.html` (`menuName: error`).

### `timeline-item.html`

One entry of the Parcours timeline. The caller normalises the two shapes the entry can take
— a position from `work[]`, a diploma from `education[]` — so the partial sees a single
contract and never has to know which array it came from.

| Key | Required | Default | Description |
|-----|----------|---------|-------------|
| `debut` | yes | — | ISO 8601 start date: `YYYY`, `YYYY-MM` or `YYYY-MM-DD` |
| `titre` | yes | — | Job title or study type |
| `organisation` | yes | — | Employer or school |
| `fin` | no | open-ended | ISO 8601 end date; absent means "until today" |
| `resume` | no | none | One sentence, inline Markdown allowed |
| `tags` | no | none | Technology slugs |

The three required keys are checked with `errorf` before any output. Only the year is
displayed, through `substr`, which is what makes all three date precisions acceptable; the
full value stays in the `datetime` attribute.

`tags` are plain strings from `cv.json`, not taxonomy terms, so each one is looked up with
`site.GetPage`: a tag that some content carries becomes a link, one that nothing carries is
rendered inert. Emitting the link unconditionally would produce a `/tags/<slug>/` that Hugo
never builds, and the link checker would report it.

**Integration** (`layout/parcours.css`):

| Class | Role |
|-------|------|
| `timeline` | Block: the `ol`, unbulleted |
| `timeline__item` | Entry, marked by `--border-thick` on the inline start edge |
| `timeline__period` | Date range, `--color-text-soft`, tabular figures |
| `timeline__title` | Title, `--text-md` |
| `timeline__body` | Description, capped at 62ch |

The inline-start rule reuses the `blockquote` border of `base/elements.css` rather than
introducing a second vertical accent.

**Callers** — `layouts/parcours/single.html` only.

## Article layout (`.container-content-grid`)

Ref: issue #77. Neither class below is a partial, but together they expose a CSS contract,
because what a template puts inside an `<article>` lands directly in a grid.

### Two classes, two jobs

```gotemplate
<article class="single container-content-grid">
```

- **`single`** is the BEM block. It owns the sub-parts — `single__heading`, `single__intro` —
  and carries no layout of its own.
- **`container-content-grid`** is the layout. It is what makes the element a grid with three
  named columns: `content` (the reading measure), `wide` (the measure plus a breakout each
  side, used by code blocks) and `full` (edge to edge, unused so far).

They are two blocks on one element, not a block and a modifier — see
[Class naming](#class-naming). **A template that wants the reading layout has to carry both**:
`single` alone styles the header and the intro but leaves the article full-bleed, with no
measure and no vertical padding.

The full definition, its four invariants and the vertical rhythm model are in
[css-tokens.md](css-tokens.md#article-layout-grid).

### What a template author needs to know

- **Every direct child is a grid item**, placed in `content` by default. `{{ .Content }}`
  emits its top-level blocks flat, so each `p`, `h2`, `ul`, `blockquote` and `div.highlight`
  is an item.
- **Widening a block is one declaration**: `grid-column: wide` or `grid-column: full`, added
  in `layout/single.css`. Do not reach for a negative margin.
- **Only direct children can be placed.** A block nested in a `blockquote` or an `li` cannot
  leave the `content` column.
- **Never declare a top margin on a direct child.** Grid does not collapse margins, so it
  would add to the bottom margin of the element before it. The rhythm is bottom-side only.
- **An inline element that can be a direct child needs `justify-self`**, otherwise it is
  stretched over the whole column — see `.cta` above.

`.post-nav` is a sibling of the article, outside the grid, and resolves the same width
expression on its own so its rule aligns with the header's.

### Where the grid lives

`container-content-grid` is a reusable layout primitive, not a style of the `single` template,
so by [Where styles live](#where-styles-live) it should have its own file. It currently sits
in `layout/single.css`, which no longer describes it. The tree reorganisation (#69) left it
there on purpose: moving it reorders the cascade, which that ticket ruled out. Until a
follow-up moves it, expect to find it there.

## Tables

Markdown tables go through `layouts/_default/_markup/render-table.html`, a render hook that
wraps every one of them in `<div class="table-scroll" role="region" tabindex="0" aria-label>`.
`base/elements.css` gives that wrapper `overflow-x: auto`.

The reason is that a table's **min-content width is not a property of the design**. It depends
on fonts the site does not ship: the widest cell here holds a `<code>` token, and the
`--font-mono` stack (`ui-monospace`, `Cascadia Code`, `monospace`) resolves to whatever the
machine has. The same column measured 80px on one machine, 91px with Liberation Mono, and
about 121px on the CI runner. At 320px the content column is 288px wide and the table's
min-content was 264px — 24px of headroom, which a wider monospace eats entirely.

So no amount of column styling makes a table fit every visitor's font. It scrolls instead.
This is not only a CI concern: a visitor whose default monospace is wide would have pushed the
whole page sideways.

`tabindex="0"` is not decoration. A region that scrolls but cannot take focus is unreachable
without a mouse (WCAG 2.1.1, and axe's `scrollable-region-focusable` rule), which is why the
hook emits it and `.table-scroll` carries a `:focus-visible` ring.

The hook re-emits the table itself rather than wrapping the default output, because Hugo
render hooks replace rather than decorate. Cell alignment is carried as `align-left` /
`align-center` / `align-right` classes rather than a `style` attribute, so the value stays out
of the markup — `base/elements.css` holds the three rules.

`tests/table.spec.js` asserts the wrapping, the keyboard reachability, and that the page does
not overflow at 320px **with an artificially widened font** — testing with the shipped font
only would reproduce exactly the blind spot that let this reach CI.

## Templating pitfalls

### `with` rebinds the context

Inside a `with` block, `.` becomes the tested value. Reusing the key name fails:

```gotemplate
{{ with .variant }} card--{{ .variant }}{{ end }}   {{/* error */}}
```

```text
can't evaluate field variant in type string
```

Two correct forms: `{{ . }}`, which refers to the tested value, or `$.variant`, which goes
back to the partial's top-level context. The second is preferable as soon as the block
contains several values, as in `cta.html` where `$.label` sits next to the URL.

### Dynamic tag names

`html/template` determines the escaping context at parse time, before any data exists. A
tag name that is not known statically prevents that, so an action is forbidden in this
position and `<{{ $level }}>` comes out as escaped text instead of a tag.

The tag has to be built as a string and then marked safe:

```gotemplate
{{ printf `<%s class="card__title">` $level | safeHTML }}
  <a href="{{ .page.RelPermalink }}">{{ .page.Title }}</a>
{{ printf "</%s>" $level | safeHTML }}
```

Since `safeHTML` disables escaping, the value must be validated beforehand. Hence the
whitelist in `card.html`: it is not cosmetic, it closes an injection vector should the
value ever come from front matter.

### Validate before emitting

Parameter validation belongs **before** any output from the partial, not after a tag has
been opened, so that no fragment is emitted ahead of the failure.

## Points to watch

- `card--<variant>` and `cta--<variant>` are emitted on demand but have no CSS. Any variant
  introduced must come with its rule, otherwise it produces a dead class.
- The inventory above only covers existing components. List and taxonomy templates are still
  to be themed (#48, #51).
- `assets/cv.json` is the single source of the Parcours page: it is both read by
  `layouts/parcours/single.html` and republished untouched at `/cv.json`, so the page and
  the machine-readable CV cannot drift. Adding a section to the page means adding it to the
  JSON, not to the template. See [parcours-cv.md](parcours-cv.md) for the content-editing
  guide.
