// Checks that assets/styles/ holds no hardcoded design value: every colour, size, duration
// and stacking order comes from a token in base/tokens.css.
//
// The rule is in CLAUDE.md and was widely bypassed — 38 literals over 7 files, among them a
// focus ring copied by hand into four of them. What makes the check usable is the exception
// list: some values are idioms rather than design decisions (the visually-hidden 1px, the
// reduced-motion 0.01ms), and a check that shouted at those would be turned off within a
// week. An exception is declared where it lives, with its reason:
//
//   width: 1px; /* token-exception: the visually-hidden idiom, not a size */
//
// Breakpoint literals are out of scope: a media condition cannot read a custom property, so
// check-breakpoints.mjs matches those against the --bp-* tokens instead.
// See docs/css-tokens.md#no-hardcoded-value.

import {readdirSync, readFileSync} from "node:fs";
import {join, relative} from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const STYLES_DIR = join(ROOT, "assets/styles");
const TOKENS_PATH = join(STYLES_DIR, "base/tokens.css");

const RE_COMMENT = /\/\*[\s\S]*?\*\//g;
// Absolute and font-relative lengths, times, and hex or functional colours. Percentages,
// `fr`, `ch`, `deg` and unitless numbers are ratios or geometry, not design values.
const RE_LITERAL = /(?<![\w#-])-?\d*\.?\d+(px|rem|em|ms|s)(?![\w%-])|#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?)\(/g;
const RE_ZINDEX = /z-index\s*:\s*-?\d+/g;
const RE_EXCEPTION = /\/\*\s*token-exception:\s*\S[^*]*\*\//;

function cssFiles(dir) {
  return readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return cssFiles(path);
    }
    return entry.name.endsWith(".css") ? [path] : [];
  });
}

// Comments are blanked, not dropped, so a literal quoted in prose is not read as code while
// the line numbers still match the file on disk.
function blankComments(css) {
  return css.replace(RE_COMMENT, (match) => match.replace(/[^\n]/g, " "));
}

const failures = [];
let exceptions = 0;
let checked = 0;

for (const path of cssFiles(STYLES_DIR)) {
  if (path === TOKENS_PATH) {
    continue;
  }

  const where = relative(ROOT, path);
  const source = readFileSync(path, "utf8").split("\n");
  const code = blankComments(readFileSync(path, "utf8")).split("\n");

  for (const [index, line] of code.entries()) {
    // A media condition repeats its breakpoint as a literal by necessity.
    if (line.includes("@media")) {
      continue;
    }

    const literals = [
      ...[...line.matchAll(RE_LITERAL)].map(([match]) => match),
      ...[...line.matchAll(RE_ZINDEX)].map(([match]) => match),
    ];
    if (literals.length === 0) {
      continue;
    }

    checked += literals.length;
    if (RE_EXCEPTION.test(source[index])) {
      exceptions += literals.length;
      continue;
    }

    failures.push(
      `${where}:${index + 1}: hardcoded ${literals.join(", ")}. Use a token from ` +
        `base/tokens.css, or accept it with a ` +
        `\`/* token-exception: <reason> */\` comment on the line.`
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
  `tokens ok: ${checked} literal${checked === 1 ? "" : "s"} outside base/tokens.css, ` +
    `all ${exceptions} accepted with a reason`
);
