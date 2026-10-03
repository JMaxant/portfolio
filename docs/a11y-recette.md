---
title: Accessibility acceptance checklist
version: 1.0.0
date_published: 2026-10-03
date_modified: 2026-10-03
---

# Accessibility acceptance checklist

Ref: issue #79, phase 7 of the [cahier des charges](cahier-des-charges.md).

Accessibility was handled piece by piece across earlier issues, each verified in isolation.
This checklist is the one pass done on the **deployed site**, with a real screen reader. It
is what counts as acceptance for #79: the automated checks only find a fraction of the
real problems.

## What is already automated

Do not redo these by hand; they run in the Playwright suite
([tests-layout.md](tests-layout.md)).

| Check | Where |
|-------|-------|
| axe-core, WCAG 2.0 to 2.2 A/AA + `best-practice` (landmark-unique, heading-order), one page per template, light / dark / system | `tests/a11y.spec.js` |
| AAA contrast (`color-contrast-enhanced`) on the same pages | `tests/a11y.spec.js` |
| Skip-link, unique landmark names, keyboard-scrollable code blocks, theme switch by keyboard, focus indicators (home page), `prefers-reduced-motion` | `tests/keyboard.spec.js` |
| Horizontal overflow, including 200% text | `tests/overflow.spec.js` |

Contrast of the syntax highlighting on real content is tracked by #57.

## Setup

- **Required**: Orca with Firefox (Linux). Firefox exposes the accessibility tree to Orca
  without extra flags.
- **Optional, worth it if available**: NVDA with Firefox (Windows), or VoiceOver with
  Safari (macOS / iOS). Orca renders some `aria-label` and list announcements differently
  from the others, so a second reader separates a site problem from a reader quirk.
- Test the **deployed URL**, not `task serve`.
- Record the reader, its version, the browser and the date at the end of the run.

When something sounds wrong, look at the accessibility tree in Firefox DevTools
(Accessibility panel) before filing it. If the tree is right, the quirk is the reader's.

## Orca quick reference

Browse mode (the default on web pages) is assumed.

| Keys | Action |
|------|--------|
| `Insert+F7` | Elements list: landmarks, headings, links, form fields |
| `D` / `Shift+D` | Next / previous landmark |
| `H` / `Shift+H` | Next / previous heading (`1` to `6` for a given level) |
| `L` / `Shift+L` | Next / previous list |
| `K` / `Shift+K` | Next / previous link |
| `Insert+Up` | Read the current line |

`Insert` is the Orca modifier key; it can be Caps Lock depending on the keyboard layout
setting.

## 1. Landmarks and structure

On each template, open the elements list (`Insert+F7`).

- [ ] Landmarks read as `Principale`, `Fil d'Ariane`, `Pied de page` (and `Articles` on an
      article), each followed by the role, without "navigation" spoken twice
- [ ] No two landmarks of the same role share a name
- [ ] Headings form an outline with no skipped level, and there is exactly one `h1`
- [ ] The page title read on load is distinct and descriptive
- [ ] The page is announced in French (correct pronunciation, not an English voice)

## 2. Keyboard, no screen reader

Unplug the mouse. On each template, using `Tab`, `Shift+Tab`, `Enter`, `Space` and arrows
only:

- [ ] Every interactive element is reachable and operable
- [ ] No focus trap, including in the mobile menu panel and the theme popover
- [ ] The focus indicator is visible everywhere, in **light and dark**, notably on the
      theme switch and on tags (the automated check covers the home page only)
- [ ] The skip-link appears on the first `Tab` and `Enter` moves reading to the content
- [ ] Scrollable code blocks and tables take focus and scroll with the arrow keys
- [ ] `Escape` closes the theme popover and the mobile menu, and focus returns to the
      button that opened it

## 3. Screen reader pass

One complete pass on each template: home, blog list, article, project, projects list,
watch list, tags index, tag term, parcours, 404.

- [ ] Reading from the top to the bottom, in order, makes sense without the visual layout
- [ ] Lists with `list-style: none` announce their item count (`role="list"` is doing its
      job)
- [ ] External links on `/veille/` announce that they are external (the `visually-hidden`
      text), and their language when it differs from the page
- [ ] Images have a meaningful `alt`, or are skipped when decorative
- [ ] The theme switch announces its name and the current theme, both collapsed and open,
      and the change is perceptible after selecting
- [ ] The mobile menu button announces expanded / collapsed
- [ ] Tables are announced as tables, with their headers, and the scroll hint is read
- [ ] The breadcrumb ends on the current page (`aria-current`)
- [ ] The reading-time and date elements are understandable out of context

## 4. Visual and rendering

- [ ] Zoom 200%: content reflows, nothing is cut off
- [ ] Zoom 400% (320 CSS px wide): no horizontal scroll on `body`, except inside code
      blocks and tables
- [ ] Windows High Contrast / forced colours: content, focus and the theme switch remain
      usable (Firefox: Settings, Colors, "Override the colors specified by the page")
- [ ] Theme: the system theme, and both forced themes, are legible on the real content,
      including highlighted code
- [ ] Reduced motion (OS setting on): no smooth scroll, no animated menu, nothing moves
      on load

## Recording a run

At the end of a run, add a comment on #79 with the reader and browser, the pages covered
and each finding as its own item. A defect becomes its own issue. A reader quirk with a
correct accessibility tree is noted but does not block acceptance.

Re-run the full checklist when the layout changes (new template, new interactive
component, new theme token), not at every content change.
