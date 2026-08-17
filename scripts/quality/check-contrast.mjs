// Checks the colour palette in assets/styles/01-tokens.css against WCAG contrast ratios.
//
// The pairs below are declared by suffix and expanded over both themes, so light and dark
// can never drift apart. Values are read from the stylesheet rather than repeated here —
// a copy would go stale silently. See docs/css-tokens.md for the rationale of each
// threshold and the list of tokens deliberately left out.

import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const TOKENS_PATH = fileURLToPath(new URL("../../assets/styles/01-tokens.css", import.meta.url));

// AAA for text, not the AA 4.5:1 of RGAA 3.2: the smallest text on the site is 12px
// (--text-xs, used by .tag). Lowering this to 4.5 would let the palette regress by two
// full points with the check still green, which is the regression it exists to catch.
const TEXT = 7;

// WCAG 1.4.11 / RGAA 3.3, for visual information required to identify a component.
const COMPONENT = 3;

// Backgrounds a foreground colour can land on. --surface-alt is the worst case in both
// themes: darkest of the light backgrounds, lightest of the dark ones.
const BACKGROUNDS = ["bg", "surface", "surface-alt"];

const TEXT_COLORS = ["text", "text-alt", "link", "link-hover", "link-visited"];

// Syntax highlighting only ever sits on the code block background.
const CODE_COLORS = [
  "code-comment",
  "code-keyword",
  "code-type",
  "code-function",
  "code-string",
  "code-number",
];

// Inverted roles: .cta and the checked state of the theme switcher paint --color-bg on
// --color-link. Easy to forget because the background token becomes the foreground.
const INVERTED = [
  ["bg", "link"],
  ["bg", "link-hover"],
];

// --border-strong bounds a component: the theme switcher's hover tint is 1.08:1 against
// the page, so the border is the sole carrier of that state.
const COMPONENT_COLORS = ["border-strong"];

// Colour tokens with no contrast requirement, and why. Anything not listed here and not
// covered by a pair fails the coverage guard below.
const DECORATIVE = new Map([
  ["border", "hr and the --border-thin/--border-thick rules; not a component boundary"],
]);

const BACKGROUND_ROLES = new Set(BACKGROUNDS);

function parseTokens(css) {
  const tokens = new Map();
  for (const [, name, hex] of css.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    tokens.set(name, normalise(hex));
  }
  return tokens;
}

function normalise(hex) {
  const body = hex.slice(1).toLowerCase();
  if (body.length === 3 || body.length === 4) {
    return `#${[...body].slice(0, 3).map((c) => c + c).join("")}`;
  }
  return `#${body.slice(0, 6)}`;
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

// Expands the declarations above into concrete (foreground, background, threshold) triples
// for one theme.
function pairsFor(theme) {
  const pairs = [];
  const add = (fg, bg, min) => pairs.push({theme, fg: `${theme}-${fg}`, bg: `${theme}-${bg}`, min});

  for (const fg of TEXT_COLORS) {
    for (const bg of BACKGROUNDS) {
      add(fg, bg, TEXT);
    }
  }
  for (const fg of CODE_COLORS) {
    add(fg, "surface-alt", TEXT);
  }
  for (const [fg, bg] of INVERTED) {
    add(fg, bg, TEXT);
  }
  for (const fg of COMPONENT_COLORS) {
    for (const bg of BACKGROUNDS) {
      add(fg, bg, COMPONENT);
    }
  }
  return pairs;
}

const tokens = parseTokens(readFileSync(TOKENS_PATH, "utf8"));
const pairs = [...pairsFor("light"), ...pairsFor("dark")];

const failures = [];
let tightest = null;

for (const pair of pairs) {
  const fg = tokens.get(pair.fg);
  const bg = tokens.get(pair.bg);
  if (!fg || !bg) {
    failures.push(`unknown token in pair: --${pair.fg} on --${pair.bg}`);
    continue;
  }
  const measured = ratio(fg, bg);
  if (measured < pair.min) {
    failures.push(
      `--${pair.fg} (${fg}) on --${pair.bg} (${bg}): ${measured.toFixed(2)}:1, needs ${pair.min}:1`
    );
  }
  if (pair.min === TEXT && (tightest === null || measured < tightest.measured)) {
    tightest = {...pair, measured};
  }
}

// Coverage guard. Without it a token added later is simply never measured, and the check
// silently stops covering the palette it is supposed to protect.
const covered = new Set(pairs.flatMap((p) => [p.fg, p.bg]));
for (const name of tokens.keys()) {
  const match = /^(light|dark)-(.+)$/.exec(name);
  if (!match) {
    continue;
  }
  const [, theme, role] = match;
  if (covered.has(name) || DECORATIVE.has(role) || BACKGROUND_ROLES.has(role)) {
    continue;
  }
  failures.push(
    `--${name} is in no pair: add it to check-contrast.mjs, or to DECORATIVE with a reason ` +
      `(theme: ${theme})`
  );
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(failure);
  }
  process.exit(1);
}

console.log(
  `contrast ok: ${pairs.length} pairs, tightest ${tightest.measured.toFixed(2)}:1 ` +
    `(--${tightest.fg} on --${tightest.bg})`
);
