// Fails when one tag is written with two different cases across content/.
//
// Tags are displayed as authored while their URL is a lowercase slug, so `PHP` and `php` share
// a term page and Hugo picks its title from whichever page it reads first. See
// docs/archetypes.md#tags.

import {readdirSync, readFileSync} from "node:fs";
import {join, relative} from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const CONTENT_DIR = join(ROOT, "content");

// Front matter: `tags = ['a', "b"]` on one line. Shortcodes: `tags="a, b"`.
const RE_FRONT_MATTER = /^tags\s*=\s*(.*)$/gm;
const RE_SHORTCODE = /\btags="([^"]*)"/g;
const RE_QUOTED = /'([^']*)'|"([^"]*)"/g;

function markdownFiles(dir) {
  return readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return markdownFiles(path);
    }
    return entry.name.endsWith(".md") ? [path] : [];
  });
}

const forms = new Map();
const unparsed = [];

function record(tag, file) {
  const key = tag.toLowerCase();
  const variants = forms.get(key) ?? new Map();
  variants.set(tag, [...(variants.get(tag) ?? []), file]);
  forms.set(key, variants);
}

for (const path of markdownFiles(CONTENT_DIR)) {
  const file = relative(ROOT, path);
  const source = readFileSync(path, "utf8");

  for (const [, value] of source.matchAll(RE_FRONT_MATTER)) {
    const list = value.trim().match(/^\[(.*)\]$/);
    if (!list) {
      unparsed.push(`${file}: tags must be a single-line array`);
      continue;
    }
    for (const [, single, double] of list[1].matchAll(RE_QUOTED)) {
      record((single ?? double).trim(), file);
    }
  }

  for (const [, value] of source.matchAll(RE_SHORTCODE)) {
    for (const tag of value.split(",")) {
      if (tag.trim()) {
        record(tag.trim(), file);
      }
    }
  }
}

const conflicts = [...forms.values()].filter((variants) => variants.size > 1);

for (const message of unparsed) {
  console.error(message);
}
for (const variants of conflicts) {
  console.error(`tag written in ${variants.size} cases:`);
  for (const [tag, files] of variants) {
    console.error(`  ${tag}  ${[...new Set(files)].join(", ")}`);
  }
}

if (unparsed.length || conflicts.length) {
  process.exit(1);
}
