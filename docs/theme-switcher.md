---
title: Light / dark switch
version: 2.0.0
date_published: 2026-08-03
date_modified: 2026-08-16
---

# Light / dark switch

Ref: issues #9 and #72, phase 2 of the [cahier des charges](cahier-des-charges.md)
(section 6). Translated from French as part of #73.

## Principle

Three states: light, dark, system (the default). An explicit choice is remembered in
`localStorage` and wins over the system preference; with no choice recorded, the theme
follows `prefers-color-scheme`.

Storage (`localStorage`, key `theme`):

- `"light"` or `"dark"` — an explicit choice.
- key absent — no explicit choice, the theme follows the system.

Anything else is treated as absent. Both scripts validate the stored value against that
whitelist before using it, so a stale key from an earlier design cannot end up in
`data-theme` and leave the page matching no rule at all.

An explicit choice is reflected by the `data-theme` attribute on `<html>`
(`data-theme="light"` / `data-theme="dark"`); the attribute is absent when the user follows
the system.

## Files

| File | Role |
|------|------|
| `layouts/partials/theme-switcher.html` | Icon trigger + a group of 3 radios (light/dark/system), included from `nav.html` |
| `assets/scripts/inline/theme-init.js` | Anti-flash: sets `data-theme` before the first paint, and marks `<html class="js">` |
| `assets/scripts/00-disclosure.js` | Disclosure behaviour shared with the burger menu |
| `assets/scripts/theme-toggle.js` | Opens and closes the panel (desktop only, refs #72) |
| `assets/scripts/theme.js` | Applies the choice, keeps the radios and the trigger's label in sync |
| `assets/styles/01-tokens.css` | Primitives (`--light-*`, `--dark-*`) and semantic tokens (`--color-*`) |
| `assets/styles/03-theme.css` | Switching rules (`@media`, `[data-theme]`) and the switcher's layout |

## How it works

1. **Page load** — `theme-init.js` is inlined at the top of `<head>` (through
   `resources.Get` + `safeJS`, not deferred): it reads `localStorage` and, if an explicit
   value exists, sets `data-theme` on `<html>` **before** the first paint, so the wrong
   theme never flashes. It also adds the `js` class to `<html>`, which is what lets the CSS
   hide controls that only JavaScript can operate — see [Without JavaScript](#without-javascript).
2. **Rendering the `<fieldset>`** — the "System" radio is `checked` in the HTML (the default
   state, correct with no JS at all). `theme.js`, deferred through the
   `resources.Match "scripts/*.js"` bundle, then checks the radio matching the stored choice
   if there is one.
3. **Changing the choice** — on a radio's `change`, `theme.js` updates `localStorage` and
   `data-theme`: both removed for "System", written otherwise. It also updates the trigger's
   hidden label so its accessible name always states the current theme.
4. **Other tabs** — `theme.js` listens for `storage`, so a choice made in one tab is applied
   in every other tab of the same origin without waiting for a reload.
5. **CSS** — `01-tokens.css` declares the primitive colours of both palettes once and assigns
   the semantic tokens (`--color-bg`, `--color-text`, `--color-link`…) to the light values by
   default. `03-theme.css` reassigns those same semantic tokens in three contexts:
   `@media (prefers-color-scheme: dark)` (system), `:root[data-theme="dark"]` and
   `:root[data-theme="light"]` (explicit choice). The `:root[data-theme=…]` selectors are
   more specific than `:root` alone, so an explicit choice always beats the system
   preference, whatever the order of the rules in the file.

The three palettes are written out twice on purpose. `light-dark()` would collapse them into
one, but it needs Chrome 123 / Safari 17.5 and the `browserslist` floor in `package.json` is
Chrome 105 / Safari 16. Revisit when that floor moves.

## Panel display (refs #72)

The radio group is rendered once by `theme-switcher.html`, but behaves differently on either
side of the 768px breakpoint (see [css-tokens.md](css-tokens.md#breakpoints)) — driven by
`03-theme.css`, not by two separate templates:

- **Above 768px** — hidden by default (`display: none`), revealed as a popover anchored under
  the sun icon (`.theme-switcher__toggle`) on click. `theme-toggle.js` handles
  `aria-expanded`/`aria-controls`, moves focus to the checked radio on open (the DSFR/RGAA
  "select" pattern — the panel is usable straight from the keyboard, with no intermediate
  Tab), and closes on `Escape`, on an outside click, and when focus leaves the widget.
- **Below 768px** — the icon trigger is hidden and the panel is **always visible**, at the end
  of the full-screen burger menu (see `docs/components.md#navhtml`). No second disclosure to
  operate: opening the menu is enough.

Selecting a theme does **not** close the panel. In a radio group the arrow keys are the
navigation mechanism and they fire `change`, so closing on selection committed a theme and
dismissed the panel on the very first keystroke, making the group impossible to traverse with
the keyboard.

Crossing the breakpoint downwards while the popover is open resets it: `theme-toggle.js`
watches `matchMedia('(max-width: 768px)')` and clears `.is-open` and `aria-expanded`, which
would otherwise describe a trigger the user can no longer see. The mobile rules in
`03-theme.css` also state `position: static` for both `.theme-switcher__panel` and
`.theme-switcher__panel.is-open`: a media query adds no specificity, so without the second
selector the popover's `.is-open` rules would outrank them and the panel would stay
absolutely positioned inside the burger menu.

## Without JavaScript

Above 768px the panel only ever opens through JavaScript, so the trigger would otherwise be a
button that announces `aria-expanded` and can never do anything. `03-theme.css` hides it with
`:root:not(.js)`, and `theme-init.js` adds that class before the first paint, so nothing
flashes. Below the breakpoint the trigger is hidden anyway and the panel stands on its own,
with "System" checked in the markup.

Storage that throws — Safari with "block all cookies", some enterprise policies, certain
webviews — is caught rather than allowed to propagate. The choice then applies to the current
page view only instead of killing the script before it can attach a single listener.

## Accessibility

A group of 3 radios rather than a single cycling button (`<fieldset>` + `<legend>`): the
current state is visible without having to click to discover it. On desktop the icon trigger
exposes its state through `aria-expanded`, never in contradiction with what is displayed —
which is exactly why it is hidden, rather than left inert, once the panel is permanently open
on mobile. Its accessible name also carries the current theme, so a collapsed popover still
announces which theme is active.

The focus ring on an option is `2px dashed currentcolor`, which covers both states with one
declaration: `--color-text` on the panel for an unselected option, `--color-bg` on the fill
for the selected one. A fixed colour reads at 1.05:1 in one of the two.

Selection is carried by a background fill, which `forced-colors` overrides; a
`@media (forced-colors: active)` block restores it with `Highlight`/`HighlightText` so the
selected option stays distinguishable in Windows High Contrast, where the radios themselves
(`appearance: none`) offer no native indicator to fall back on.

Palette and contrast: see section 6 of the cahier des charges. `tests/theme-switcher.spec.js`
covers persistence, keyboard traversal, the breakpoint reset, storage failure and the no-JS
rendering.
