---
title: CSS tokens and breakpoints
version: 1.1.0
date_published: 2026-08-08
date_modified: 2026-08-08
---

# CSS tokens and breakpoints

Ref: issues #49, #63, #69. Describes the contents of `assets/styles/01-tokens.css` and the
breakpoint convention. For browser compatibility and the respective roles of `css.Build`
and Stylelint, see [css-compat.md](css-compat.md).

## Principle

Every token is a custom property declared on `:root` in a single file, `01-tokens.css`. No
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
`03-theme.css`. A component consuming `--color-surface` follows the theme without knowing
anything about the palettes. A component consuming `--light-surface` would break in dark
mode: that is the mistake to avoid.

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

Two pairs are easy to forget because the roles are inverted: `.cta` and the checked state of
the theme switcher paint `--color-bg` **on** `--color-link`. Both clear 7:1 (7.61 light,
8.11 dark), and they follow `--color-link`, so they move whenever it does.

Borders are out of scope for this target. `--*-border` and `--*-border-strong` sit between
1.2:1 and 2.0:1 against their backgrounds, below the 3:1 of WCAG 1.4.11 — which applies to
visual information *required* to identify a component or its state. The borders here are
decorative: a tag, a card and a switcher are all identifiable without them. If a border ever
becomes the sole carrier of a state, it needs 3:1 and this paragraph stops being true.

## Scales

| Family | Tokens | Notes |
|--------|--------|-------|
| Spacing | `--spacing-2xs` … `--spacing-2xl` | 0.4rem to 6.4rem |
| Text sizes | `--text-xs` … `--text-hero` | `--text-base` is the body text size |
| Font weights | `--font-weight-light`, `--font-weight-normal`, `--font-weight-bold` | |
| Line heights | `--line-height-heading`, `--line-height-base` | |
| Container widths | `--container-wide`, `--container-default`, `--container-reading` | `--container-reading` is in `ch`, not px |
| Misc | `--border-radius`, `--border-thin`, `--transition` | `--border-thin` composes `--color-border`, so it follows the theme |

## Breakpoints

Two thresholds are used across the project:

| Value | Locations | Purpose |
|-------|-----------|---------|
| `768px` | `04-header.css` | Header stacks vertically (title, navigation, theme switcher) |
| `576px` | `05-footer.css`, `08-home.css` | Footer stacks vertically; the title in the latest-activity list moves to its own line |

Agreed syntax, used consistently: `@media screen and (width <= Npx)`. The range syntax is
transpiled by `css.Build` down to `max-width` (see [css-compat.md](css-compat.md)).

### Why the values are hardcoded

`01-tokens.css` declares `--bp-tablet: 768px` and `--bp-mobile: 576px`, but **those tokens
are referenced nowhere**, and they cannot be: custom properties are not allowed in media
query conditions. The specification requires a literal value, evaluated before the cascade
applies.

```css
/* Does not work — the condition is ignored */
@media screen and (width <= var(--bp-mobile)) { … }
```

There is no workaround in plain CSS. The alternatives (`@custom-media`, preprocessor
variables) assume tooling the project does not have and does not want, the rule being plain
CSS.

Practical consequence: **changing a threshold means changing it in every file concerned**.
The table above is the reference list to work through.

### Pending decision

The fate of the `--bp-tablet` / `--bp-mobile` tokens is undecided: keep them as a statement
of intent, or drop them because they suggest a single source of truth that does not exist.
To be settled alongside the CSS tree reorganisation (#69).

## Rules

- Never write a colour, spacing or size literal inside a component.
- Never consume a raw palette (`--light-*`, `--dark-*`) outside `03-theme.css`.
- Add tokens to `01-tokens.css` only, never to a component file.
- Adding a breakpoint means updating the table above.
- Changing any colour token means re-measuring against AAA, including the backgrounds:
  the text colours were solved against `surface-alt` and have no headroom.
