---
title: Components — partials and integration
version: 1.1.0
date_published: 2026-08-08
date_modified: 2026-08-09
---

# Components — partials and integration

Ref: issues #45, #48, #66. Describes the reusable components from both sides: the **template
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

### Where styles live

A component reused beyond a single page gets its own file in `assets/styles/`
(`07-card.css`), imported by `main.css`. Styles specific to one template stay in that
template's file (`08-home.css`). Generic elements reused everywhere — `.tag`, `.tags`,
`.cta` — live in `02-base.css`.

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
section (`.home--hero` in `08-home.css`), which targets `h1`, `p` and `.cta` directly.

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

**Integration** (`07-card.css`):

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
`07-card.css` deliberately does not re-declare either — see the note on `.meta` in
`12-utils.css`.

The component also emits `tag tag--light` (status) and `tag tag--accented` (taxonomy
terms), styled in `02-base.css`.

**Container** — cards go inside `cards cards--grid`, an `auto-fit` grid using
`minmax(min(280px, 100%), 1fr)`: it reflows without a media query and does not overflow
below 280px.

**Callers** — `layouts/index.html` (featured projects, `title_level: h3` under the section
`h2`) and `layouts/projets/list.html` (the whole list, `title_level: h2` under the page
`h1`). The level is not decoration: it is what keeps the heading hierarchy of each page
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

**External links** — `repo` and `demo` leave the site, so they get the marker used in
`layouts/veille/list.html`: `target="_blank" rel="noopener"`, a `↪` glyph hidden from
assistive technology (`aria-hidden`), and a `visually-hidden` text equivalent. Colour is
not the only carrier of the distinction, which is what RGAA 3.3 asks for. Internal links —
the title, the tags — carry none of that.

**Integration** — the partial emits `ul.byline.meta`, the same block as the byline of a
blog article (`10-single.css`). It holds more entries there, hence the `flex-wrap` on
`.byline`. No class of its own: a project meta line *is* a byline, only richer.

### `cta.html`

Call-to-action link.

| Key | Required | Default | Description |
|-----|----------|---------|-------------|
| `url` | yes | — | Link target |
| `label` | yes | — | Visible label |
| `variant` | no | none | Class suffix: `cta--<variant>` |

**Integration** — `.cta` is defined in `02-base.css`, so it is available everywhere,
including inside an article. `cta--<variant>` is an unstyled extension point so far.

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
  to be themed (#47, #48, #51), and the CSS tree reorganisation (#69) may move the files
  referenced here.
