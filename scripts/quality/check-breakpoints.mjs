// Checks every width media query in assets/styles/ against the --bp-* tokens of
// base/tokens.css.
//
// Custom properties are illegal in a media condition, so a threshold cannot be read from a
// token — it is repeated as a literal in each file. The tokens are therefore purely
// declarative, and without this check they drift: 560px lived in two stylesheets for months
// with no token of its own, and the project's only min-width query made 768px match both
// layouts at once. See docs/css-tokens.md#breakpoints.

import {readdirSync, readFileSync} from "node:fs";
import {join, relative} from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const STYLES_DIR = join(ROOT, "assets/styles");
const TOKENS_PATH = join(STYLES_DIR, "base/tokens.css");

// The agreed syntax is `@media screen and (width <= Npx)`: desktop-first, one direction per
// threshold. `max-width: Npx` is the same query and is accepted; anything opening upwards is
// not, because at exactly N both branches match.
const RE_TOKEN = /--bp-([a-z0-9-]+)\s*:\s*(\d+)px\s*;/g;
const RE_MEDIA = /@media([^{]*)\{/g;
const RE_RANGE = /width\s*(<=|>=|<|>)\s*(\d+)px/g;
const RE_LEGACY = /(min|max)-width\s*:\s*(\d+)px/g;
const RE_COMMENT = /\/\*[\s\S]*?\*\//g;

function cssFiles(dir) {
  return readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return cssFiles(path);
    }
    return entry.name.endsWith(".css") ? [path] : [];
  });
}

// Comments are blanked rather than dropped so the offsets below still point at the right
// line — and so the `width >= 768px` quoted in components/card.css is not read as a query.
function blankComments(css) {
  return css.replace(RE_COMMENT, (match) => match.replace(/[^\n]/g, " "));
}

function lineOf(css, index) {
  return css.slice(0, index).split("\n").length;
}

const tokens = new Map();
for (const [, name, value] of readFileSync(TOKENS_PATH, "utf8").matchAll(RE_TOKEN)) {
  tokens.set(Number(value), `--bp-${name}`);
}

const failures = [];
const used = new Set();
let queries = 0;

for (const path of cssFiles(STYLES_DIR)) {
  const css = blankComments(readFileSync(path, "utf8"));
  const where = relative(ROOT, path);

  for (const media of css.matchAll(RE_MEDIA)) {
    const [, prelude] = media;
    const line = lineOf(css, media.index);

    const features = [
      ...[...prelude.matchAll(RE_RANGE)].map(([, operator, value]) => ({operator, value})),
      ...[...prelude.matchAll(RE_LEGACY)].map(([, bound, value]) => ({
        operator: bound === "max" ? "<=" : ">=",
        value,
      })),
    ];

    for (const {operator, value} of features) {
      queries += 1;
      const width = Number(value);

      if (operator !== "<=") {
        failures.push(
          `${where}:${line}: opens upwards (${operator} ${width}px). Breakpoints are ` +
            `desktop-first — at exactly ${width}px both layouts would match.`
        );
        continue;
      }
      if (!tokens.has(width)) {
        failures.push(
          `${where}:${line}: ${width}px matches no --bp-* token. Reuse an existing ` +
            `threshold (${[...tokens].map(([w, n]) => `${n} ${w}px`).join(", ")}) or declare ` +
            `one in base/tokens.css.`
        );
        continue;
      }
      used.add(width);
    }
  }
}

// A token no query uses is the same failure in reverse: it reads as a source of truth while
// describing nothing.
for (const [width, name] of tokens) {
  if (!used.has(width)) {
    failures.push(
      `${name} (${width}px) is used by no media query: drop it, or point a breakpoint at it.`
    );
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(failure);
  }
  process.exit(1);
}

console.log(
  `breakpoints ok: ${queries} width queries over ${tokens.size} tokens ` +
    `(${[...tokens].map(([width, name]) => `${name} ${width}px`).join(", ")})`
);
