// Fails when a staged edit to an existing content file leaves its `lastmod` untouched.
//
// Hugo reads `lastmod` from front matter only (#70), so a forgotten bump leaves the sitemap
// and the JSON-LD with a stale date. A mechanical change (key rename, typo in a tag) opts out
// with `LEFTHOOK_EXCLUDE=lastmod git commit`. See docs/components.md#dates.
//
// Only the index is inspected: with nothing staged, as on CI, the check passes.

import {execFileSync} from "node:child_process";

const git = (...args) => execFileSync("git", args, {encoding: "utf8"});

// Added files are excluded: a new page has nothing to have updated yet.
const modified = git("diff", "--cached", "--diff-filter=M", "--name-only", "-z", "--", "content/**/*.md")
  .split("\0")
  .filter(Boolean);

const RE_LASTMOD_ADDED = /^\+lastmod\s*=/m;

const stale = modified.filter(
  (file) => !RE_LASTMOD_ADDED.test(git("diff", "--cached", "-U0", "--", file)),
);

if (stale.length) {
  console.error("content modified without bumping `lastmod`:");
  for (const file of stale) {
    console.error(`  ${file}`);
  }
  console.error("Bump it, or for a mechanical change: LEFTHOOK_EXCLUDE=lastmod git commit");
  process.exit(1);
}
