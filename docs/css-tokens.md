---
title: CSS tokens and breakpoints
version: 1.16.0
date_published: 2026-08-08
date_modified: 2026-08-18
---

# CSS tokens and breakpoints

Ref: issues #49, #57, #63, #69, #77. Describes the contents of `assets/styles/base/tokens.css` and the
breakpoint convention. For browser compatibility and the respective roles of `css.Build`
and Stylelint, see [css-compat.md](css-compat.md).

## Tree

Ref: issue #69. Stylesheets are grouped by nature, not by a numeric prefix encoding the
cascade order:

```text
assets/styles/
  main.css            the only file carrying @import; holds the cascade order
  base/
    reset.css         normalisation
    tokens.css        raw palettes, semantic tokens, theme switching, scales
    elements.css      bare element styles (h1…h4, p, a, table, blockquote…)
  components/         theme-switcher, menu, card, entry-list, tag, cta, code
  layout/             header, footer, page, home, content-grid, single, parcours, error
  utils.css           .container, .visually-hidden, .meta
```

Adding a component means creating one file and adding one line to `main.css` — no
renumbering. Two constraints that the tree does not make visible on its own:

- **The import list is ordered, not alphabetical.** The reset comes first, the tokens before
  anything reading them, and `utils.css` last (see [Utilities](#utilities)). `main.css`
  carries a comment per section stating what each ordering constraint is for.
- **An `@import` is only inlined when it precedes every rule in its file.** Written after a
  rule, esbuild leaves it verbatim in the built CSS, where it becomes a runtime request for
  a path that does not exist in `public/`. Hugo emits no warning and
  `scripts/quality/check-hugo-build.sh` does not catch it. This is why the imports are
  concentrated in `main.css` and no file re-exports its neighbours.

## Principle

Every token is a custom property declared on `:root` in a single file, `base/tokens.css`. No
raw value — colour, spacing, font size — may appear anywhere else in the stylesheets.

## Base unit: 1rem = 10px

`:root` carries `font-size: 62.5%`, which brings `1rem` down to 10px instead of the default
16px. That is what makes the scales readable: `--spacing-md: 1.6rem` reads as "16px".

The `body` font size is then restored to a readable value through `--text-base`. Without
that, all text would inherit the 10px set on `:root`.

## Colours: two levels of indirection

Colours go through two stages, deliberately:

1. **Raw palettes** — `--light-*` and `--dark-*`. These hold the hexadecimal values,
   declared once, and are never consumed directly by a component.
2. **Semantic tokens** — `--color-bg`, `--color-text`, `--color-text-soft`, `--color-link`,
   `--color-surface`, `--color-border`… These, and only these, are what components use.

Switching theme means reassigning the semantic tokens to the other palette, in
`base/tokens.css`. A component consuming `--color-surface` follows the theme without knowing
anything about the palettes. A component consuming `--light-surface` would break in dark
mode: that is the mistake to avoid.

**Two colours sit outside both stages**, and outside the token file: the `#fff` on `#000`
of `.skip-link`, in `base/elements.css`. The skip link paints over whatever the page puts
under it and must stay legible in both themes, so it follows neither. Tokens would have
named a pair nothing else can consume, so they stay literal with a
[`token-exception`](#no-hardcoded-value) each.

See [theme-switcher.md](theme-switcher.md) for the switching mechanism.

## Contrast target: WCAG AAA (7:1)

Every text colour in the palette clears **7:1** against every background it can land on, in
both themes. That is the AAA threshold for normal-size text — deliberately stricter than AA
(4.5:1), because the smallest text on the site (`--text-xs`, 12px, used by `.tag`) is well
under the size that would let a lower ratio qualify.

The constraint that matters is the **worst background of each theme**, which is
`--*-surface-alt` in both: it is the darkest of the light backgrounds and the lightest of
the dark ones. A colour that clears 7:1 there clears it on `bg` and `surface` too, so that
is the only pair worth solving.

Tightest pairs, all measured against `surface-alt`:

| Theme | Token | Ratio |
|-------|-------|-------|
| light | `--light-link` | 7.03 |
| light | `--light-text-alt` | 7.04 |
| light | `--light-link-visited` | 7.06 |
| dark | `--dark-link` | 7.00 |
| dark | `--dark-link-visited` | 7.01 |
| dark | `--dark-text-alt` | 7.02 |

**The margin is thin by construction**: these six values were derived by moving lightness
only — hue and saturation untouched — until they just cleared the threshold, so the visual
change stayed minimal. The flip side is that *any* change to a `surface-alt` token drops
them below AAA. Re-measure before touching a background.

Nothing here is measured by hand any more: `scripts/quality/check-contrast.mjs` reads the
hex values straight out of `base/tokens.css`, checks every pair below, and runs in pre-commit
and CI (issue #57). The 7:1 above is what it enforces for text — deliberately stricter than
RGAA 3.2's 4.5:1, because at 4.5 the palette could lose two full points with the check still
green. It also **fails on any colour token that appears in no pair**, so a token added later
cannot slip through unmeasured; put it in a pair, or in the script's `DECORATIVE` map with a
reason.

Two pairs are easy to forget because the roles are inverted: `.cta` and the checked state of
the theme switcher paint `--color-bg` **on** `--color-link`. Both clear 7:1 (7.61 light,
8.11 dark), and they follow `--color-link`, so they move whenever it does.

Borders are out of scope for the 7:1 target, but they split into two cases under WCAG
1.4.11, which requires 3:1 for visual information *required* to identify a component or its
state.

`--*-border` is decorative and stays out of scope: it draws `hr` and the `--border-thin` /
`--border-thick` rules, and sits around 1.3:1 against its backgrounds. A tag or a card is
identifiable without it.

`--*-border-strong` **is** in scope, and clears 3:1 as of #57. The theme switcher's hover
state is the reason: its background tint is only 1.08:1 against the page, so the border is
the sole carrier of the state (`components/theme-switcher.css`). The token also bounds the switcher panel and
the `.parcours` separator. Same method as the text colours — lightness moved, hue and
saturation untouched — against the same worst-case background:

| Theme | Token | Value | Ratio vs `surface-alt` |
|-------|-------|-------|------------------------|
| light | `--light-border-strong` | `#7c87a0` | 3.16 |
| dark | `--dark-border-strong` | `#637191` | 3.14 |

## Scales

| Family | Tokens | Notes |
|--------|--------|-------|
| Spacing | `--spacing-2xs` … `--spacing-2xl` | 0.4rem to 6.4rem |
| Text sizes | `--text-xs` … `--text-hero` | `--text-base` is the body text size |
| Font weights | `--font-weight-thin`, `--font-weight-light`, `--font-weight-normal`, `--font-weight-bold` | 200, 300, 400, 600 — matches the Alexandria variants imported in `main.css` |
| Line heights | `--line-height-heading`, `--line-height-base` | |
| Letter spacing | `--letter-spacing-wide` | `0.05em`, uppercase labels only (`layout/parcours.css`) — without the extra tracking the caps run into each other |
| Container widths | `--container-wide`, `--container-default`, `--container-reading` | `--container-reading` is in `ch`, not px, and is consumed by the article grid rather than by a utility — see [Article layout grid](#article-layout-grid) |
| List columns | `--size-col-date`, `--size-col-date-compact`, `--size-col-type`, `--size-date-nudge` | The date column of `entry-list`, at its two widths, plus the type column of the compact variant. `--size-date-nudge` is the optical `0.2rem` that lines a date up with a bigger title |
| Focus ring | `--focus-ring-width`, `--focus-ring-offset`, `--focus-ring-offset-inset` | `2px` / `2px`, an RGAA 10.7 decision. The inset offset (`-3px`) pulls the ring inside a filled control, where the outward one would land outside its container |
| Controls | `--size-touch-target`, `--size-icon`, `--size-icon-sm` | `--size-touch-target` is 4.4rem = 44px, the WCAG 2.5.5 (AAA) target size. It is an accessibility constant, not a look — do not shrink it to fit a layout |
| Stacking | `--z-nav-panel`, `--z-header`, `--z-popover`, `--z-skip-link` | 1 / 2 / 10 / 100000. The whole ordering of the header, in one place. `.site-header__bar` needs `--z-header` above the panel's `--z-nav-panel` because the two are siblings — see [components.md](components.md#navhtml) |
| Misc | `--border-radius`, `--border-width-thin`, `--border-thin`, `--transition`, `--transition-duration`, `--transition-easing` | `--border-thin` composes `--border-width-thin` and `--color-border`, so it follows the theme; the width alone is for the borders that need another colour (a transparent one, `--color-border-strong`, a dashed style). `--transition` is the `all` shorthand; components that must not animate `all` compose the two parts instead |

### `--header-height`

Declared in `base/tokens.css` but not a token in the usual sense: `nav-toggle.js` overwrites it
on `:root` with the header's measured height, because the title wraps and the value is not a
constant. What the file holds is only the fallback for the window before the deferred script
runs.

Keep that fallback close to reality. It read `8rem` when the header measures 127px at every
width the site supports, so any paint before the script landed put the first nav link 47px
under the header. If the header's design changes, re-measure and update it.

## Syntax highlighting

Chroma is configured with `noClasses = false` (`config/_default/hugo.toml`), so it emits
class names instead of inline styles. That single setting is what makes code blocks
themeable at all: inline styles cannot be overridden from a stylesheet, and the default
`monokai` background is hardcoded dark regardless of the active theme.

The palette follows the same two-stage indirection as every other colour — raw values in
`base/tokens.css`, where the semantic assignment lives too:

| Semantic token | Role |
|----------------|------|
| `--color-code-comment` | Comments, preprocessor directives |
| `--color-code-keyword` | Keywords, word operators, deleted diff lines |
| `--color-code-type` | Types, builtins, classes, namespaces |
| `--color-code-function` | Function names, attributes, tags, constants |
| `--color-code-string` | String literals, inserted diff lines |
| `--color-code-number` | Numeric literals |

`components/code.css` maps Chroma's class names onto these six, and nothing else in the project may
reference them. Token groups that are not mapped — punctuation, operators, whitespace —
fall back to `--color-text`: an uncoloured token is a degradation, not a defect.

**The generated stylesheet is deliberately not used.** `hugo gen chromastyles` emits about
75 rules and sixty-odd hex literals per theme, none of them measured for contrast, and it
would have to be hand-wrapped for the three theme states. Six hand-picked tokens cover the
languages this site actually publishes.

### Contrast

Every syntax colour clears **AAA (7:1) against `--color-surface-alt`**, which is the code
block background, in both themes. The measured ratio sits in a comment next to each value
in `base/tokens.css` — the tightest is 7.06:1, so there is no headroom. Re-measure before
changing any of them.

The AAA target is what shapes the palette: on a light background it forces dark, saturated
hues, and on a dark one it forces pastels. Anything more vivid fails.

## Utilities

Utilities live in `utils.css`, and `main.css` imports it **last**. That position is
load-bearing, not tidiness: a utility and a component class often have the same specificity
— `.meta` and `.card__body` are both (0,1,0) — and only source order separates them. Move
the import up and utilities silently stop applying wherever a component declares the same
property.

| Utility | Role |
|---------|------|
| `.container`, `.container--wide` | Page width and inline padding |
| `.visually-hidden` | Readable by assistive technology only |
| `.cta` | Call-to-action button |
| `.meta` | Secondary text: metadata, bylines, summaries |

`.meta` is the single source of truth for the "small and soft" pairing
(`--text-sm` + `--color-text-soft`). It was extracted from five components that each
declared it identically. A component must not re-declare that pair — apply the class in the
template instead.

Two consequences worth knowing before using it:

- **Applying the class is not enough where the component selector is more specific.** A
  nested `.entry-list p` is (0,1,1) and beats `.meta`. Adopting the utility means deleting
  the component declarations, not layering a class on top of them — a half-migration leaves
  the utility inert and looks correct until the token changes.
- **A different size is not a `.meta` case.** `.tag` (`--text-xs` + soft) and
  `.home--hero p` (`--text-md` + soft) are soft-coloured but sized differently. Forcing them
  into `.meta` would mean overriding `font-size` right after, which defeats the point.

## Article layout grid

Ref: issue #77. `.container-content-grid` (`layout/content-grid.css`) is a grid with named columns, and
**it is the source of the reading measure** — there is no `.container--reading` utility any
more. The
reason is the unit: `--container-reading` is `70ch`, measured in the font of the element that
declares it. In `--font-sans` a `ch` is about 8.8px, in `--font-mono` about 9.6px, so the
measure is worth roughly 64 characters of code, not 70. A code block of 64 signs overflowed
before its `padding` was even counted.

A negative margin was the previous answer, and it had to read `100vw` — which includes the
scrollbar width. Grid columns size against the *container* instead, so nothing has to guess
the viewport.

### The three widths

| Column | Width | Used by |
|--------|-------|---------|
| `content` | `min(var(--container-reading), 100% - 2 * var(--gutter))` | Every direct child by default |
| `wide` | `content` plus up to `--breakout` (`--spacing-2xl`) a side | `.highlight`, the code block wrapper |
| `full` | Edge to edge, gutters included | Nothing yet — reserved for a full-bleed medium |

The two breakout tracks are `minmax(0, var(--breakout))`: they collapse to zero when the
room runs out, which reproduces the floor of the old `clamp` without a media query. Placing a
child is one declaration, `grid-column: wide` or `grid-column: full`.

Only **direct** children are grid items. A block nested inside a `blockquote` or an `li`
cannot be placed in another column.

### Invariants

Four rules hold the width math together. **This document is the only place they are
written** — breaking one brings back horizontal overflow on the whole page.

- **Never declare `gap` or `column-gap` on the grid.** The five tracks are calculated to
  total `100%`; a column gap adds four times its value. At 320px: 16 + 0 + 288 + 0 + 16 + 96
  = 416px.
- **Never set a track minimum to `auto`.** Every minimum is a fixed length, which resolves
  `min-width: auto` to `0` on every item: an unbreakable word overflows its own box without
  widening the page. One `auto` minimum and the page scrolls sideways.
- **Never add `padding-inline` to the grid.** The `100%` in `grid-template-columns` resolves
  against the content box, so an inline padding would count the gutter twice. `padding-block`
  is safe and is what the grid uses.
- **Keep the `100% - 2 * var(--gutter)` ceiling in step with the outer tracks' minimum.** It
  is what keeps the content column inside the page below 70ch.

`--gutter` and `--breakout` are declared on `.container-content-grid`, not on `:root`. A custom property is substituted at the point of use, so a `ch` length resolves in
the consuming element's font — a token holding the measure would be wrong inside a `pre`.

`.post-nav` sits outside the article, so it resolves the same `min()` expression on its own
`width` to stay aligned with the content column. It therefore repeats `--gutter` in
`layout/single.css` — the two declarations move together. It does not repeat `--breakout`,
which only the grid tracks consume.

### Vertical rhythm: bottom margins only

`display: grid` removes margin collapsing between children. A bottom margin no longer merges
into the next element's top margin — the two add up. The rhythm is therefore declared **on
the bottom side only**, so that no two siblings can ever contribute to the same gap:

| Rule | Declaration | Effect |
|------|-------------|--------|
| `.container-content-grid > *` | `margin-block-end: var(--spacing-md)` | The step below every direct child |
| `.container-content-grid h2, h3, h4, h5` | `margin-block: 0 var(--spacing-md)` | Headings drop the top margin they carry in `base/elements.css` |

The result is a flat **`--spacing-md` (16px) between every pair of blocks**, headings
included — measured end to end on a page exercising headings, lists, a blockquote, a table,
an `hr` and code.

`row-gap` is deliberately not used: it would be a second source of vertical space, added to
the margins rather than replacing them, and the invariant above forbids `gap` on this grid
anyway.

Three consequences worth knowing:

- **The grid overrides the element rhythm of `base/elements.css` by specificity.**
  `.container-content-grid > *` is (0,1,0) and beats `p` (0,0,1), so the 24px of
  `--spacing-lg` becomes 16px inside an article. `.container-content-grid h3` is (0,1,1) and
  beats `h3` (0,0,1), so `margin-block: 40px 12px` becomes `0 16px`. Reading `base/elements.css`
  alone gives the wrong numbers for anything inside the grid.
- **Only the bottom side may carry the rhythm.** A top margin on a direct child adds to the
  bottom margin of the one before it instead of collapsing into it.
- **The heading rule is a descendant selector, the step rule is a child selector.** Headings
  nested in a `blockquote` or an `li` are reset too; other nested blocks keep the margins of
  `base/elements.css`, which is what makes a paragraph inside a blockquote behave normally.

A new element type needs no rule unless it wants something other than the step. A new heading
level does — add it to the heading list. That is what #78 has to do for `h6`.

## Breakpoints

Two thresholds are used across the project, and both are declared in `base/tokens.css`:

| Token | Value | Locations | Purpose |
|-------|-------|-----------|---------|
| `--bp-tablet` | `768px` | `layout/header.css`, `components/menu.css`, `components/theme-switcher.css`, `components/card.css`, `base/elements.css` | Header stacks vertically (title bar, navigation, theme switcher); navigation collapses behind the menu toggle; the card grid drops from two fixed columns to an `auto-fit` track; `hr` goes full width instead of 75% centred |
| `--bp-mobile` | `576px` | `layout/footer.css`, `layout/single.css`, `components/entry-list.css`, `base/elements.css` | Footer stacks vertically; post navigation stacks; the entry date moves above the title instead of sitting in its own column, and in `entry-list--compact` the title moves to its own line; definition lists stack instead of using a `max-content` term column |

Agreed syntax, used consistently: `@media screen and (width <= Npx)` — every breakpoint is
written desktop-first, as a max-width. The range syntax is transpiled by `css.Build` down to
`max-width` (see [css-compat.md](css-compat.md)).

**A third threshold needs a token first.** `--bp-*` is the list; a query on a width absent
from it fails `task qa`. The entry list and the definition lists used to break at `560px`,
16px from `--bp-mobile` and covered by no token — two near-identical list layouts collapsing
at two different widths, for no reason anyone could name. They were aligned on `576px` in #69,
which changes nothing structural: measured on `/blog/` at 561px, the two-column item was 529px
wide with a 385px body and no overflow, so collapsing 16px earlier costs nothing.

**Never mix in a min-width.** `components/card.css` used to carry the project's only
`width >= 768px`, and at exactly 768px both branches matched: mobile header and navigation
with desktop card spacing. One direction per threshold, or the boundary belongs to both.

### Why the values are hardcoded

A threshold cannot be read from its token: custom properties are not allowed in media query
conditions. The specification requires a literal value, evaluated before the cascade applies.

```css
/* Does not work — the condition is ignored */
@media screen and (width <= var(--bp-mobile)) { … }
```

There is no workaround in plain CSS. The alternatives (`@custom-media`, preprocessor
variables) assume tooling the project does not have and does not want, the rule being plain
CSS.

So `--bp-tablet` and `--bp-mobile` are **declarative**: they name the thresholds and give the
list somewhere to live, but every query repeats the literal, and changing a threshold means
changing it in every file concerned. The table above is the reference list to work through.

### The check that makes them true

Declarative on its own is decorative — that is how `560px` appeared and stayed. Enforced by
`scripts/quality/check-breakpoints.mjs`, run by the `breakpoints` job on any staged `.css`
(see [qa-ci.md](qa-ci.md)). It scans every `@media` prelude under `assets/styles/` and fails on:

- a width matching no `--bp-*` token;
- a query opening upwards (`min-width`, `width >=`), for the reason above;
- a `--bp-*` token no query uses — the same failure in reverse, a name describing nothing.

Comments are blanked before scanning, so prose quoting a query is not read as one.

### Overriding inside a media query

A media query adds **no specificity**. An override written there must match or beat the
specificity of the rule it replaces, or it is dead — and the failure is silent, since nothing
in the toolchain flags it.

`components/entry-list.css` hit this: the base rule is `.entry-list .entry-list__item`
(0,2,0) and the override was written `.entry-list li` (0,1,1). The grid never collapsed.
Worse, the neighbouring `.entry-list__body` override *was* (0,2,0), so it applied and moved
the entry body into a date column that had never been collapsed — 120px of text in a 288px
item at 320px wide. Half-applied is worse than not applied at all.

When narrowing a nested block, repeat the class the base rule uses, not the tag underneath
it. `tests/breakpoints.spec.js` locks this one.


## No hardcoded value

`scripts/quality/check-tokens.mjs` enforces the first rule below. It scans everything under
`assets/styles/` except `base/tokens.css`, and fails on a colour (hex, `rgb()`, `hsl()`), a
length (`px`, `rem`, `em`), a duration (`s`, `ms`) or a numeric `z-index` written literally.
Percentages, `fr`, `ch` and `deg` are out: those are ratios and geometry, not design values.
Media conditions are out too — a query cannot read a custom property, so those literals are
[checked against the `--bp-*` tokens](#breakpoints) instead.

Some values are idioms rather than decisions, and a check that shouted at them would be
switched off within a week. Those are accepted **where they live**, with their reason:

```css
.visually-hidden {
  width: 1px; /* token-exception: the visually-hidden idiom, not a size */
}
```

The fifteen exceptions currently accepted: the `1px` / `-1px` of `.visually-hidden`, the
`-999rem` parking, off-scale padding and out-of-theme `#fff` / `#000` of `.skip-link`, the
`280px` reflow bound of the card grid, the `0.01ms` of the reduced-motion block, and the two
seed values of the [burger geometry](#component-local-custom-properties). Anything else is a
token.

The audit that produced this check (#108) found 38 literals over 7 files, among them a focus
ring copied by hand into four of them and a `z-index: 100000` that no stacking token knew
about. The rule had been written in `CLAUDE.md` since the beginning; what it lacked was
something that fails.

### Component-local custom properties

A value used by one component only, several times, does not become a global token: it stays
a custom property declared on the component's own root. `--gutter` and `--breakout` in
`layout/content-grid.css` did it first; the burger geometry of `components/menu.css` follows.

```css
.menu-toggle__icon {
  --burger-height: 1.4rem; /* token-exception: burger geometry, local to this component */
  --burger-bar: 2px; /* token-exception: burger geometry, local to this component */
  --burger-center: calc((var(--burger-height) - var(--burger-bar)) / 2);
}
```

What is bought here is the derivation, not the naming: the three bars of the closed and open
states are computed from two values instead of being four literals that have to agree. A
global token would have promised reuse that cannot happen — no other file can consume a
burger's geometry. The two seed values are literals like any other and carry their exception.

The line is the one in `CLAUDE.md`: a value repeated **across two files** is a token. Inside
one file, it is a local property.

## Rules

- Never write a colour, spacing or size literal inside a component. `check-tokens.mjs` fails
  on one — see [No hardcoded value](#no-hardcoded-value) for the accepted idioms.
- Never re-declare `--text-sm` + `--color-text-soft` in a component: apply `.meta`.
- Never consume a raw palette (`--light-*`, `--dark-*`) outside `base/tokens.css`.
- Add tokens to `base/tokens.css` only, never to a component file. A value one component
  repeats internally is not a token: it is a
  [local custom property](#component-local-custom-properties) on that component.
- A value the CSS reads but JavaScript writes still gets declared in `base/tokens.css`, with
  the static fallback as its value — see [`--header-height`](#--header-height). An
  undeclared custom property is invisible to anyone reading the stylesheet.
- Reuse an existing breakpoint. A new threshold means a new `--bp-*` token, the table
  above updated, and `check-breakpoints.mjs` green — it fails on a width with no token.
- Changing any colour token means re-measuring against AAA, including the backgrounds:
  the text colours were solved against `surface-alt` and have no headroom.
- Never reference a `--color-code-*` token outside `components/code.css`.
- Never break one of the four [article grid invariants](#invariants); never declare a top
  margin on a direct child of `.container-content-grid` — the rhythm is the bottom side.
