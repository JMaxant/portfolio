import { test, expect } from '@playwright/test';

// #69: the `datetime` attribute of a <time> must carry the machine date, not the displayed
// one. Two templates passed the i18n format (`02/01/2006`) into the attribute and emitted
// `datetime="28/07/2026"`, which nothing can read — neither assistive technology nor a
// parser. The visible text stays in the i18n format: that is the whole point of the attribute.
//
// No page overflowed and no CSS rule was involved, so neither the overflow suite nor axe
// could see it: axe does not validate the value of a `datetime`.

// The templates that emit a <time>, one per list shape.
const PAGES = [
  ['home', '/'],
  ['blog list', '/blog/'],
  ['veille list', '/veille/'],
  ['tags list', '/tags/'],
  ['tag term', '/tags/hugo/'],
  ['blog single', '/cas-max/'],
  ['parcours', '/parcours/'],
];

// Shapes HTML accepts for a <time>: year, month, date, and date plus time. The Parcours
// timeline emits `2017-01` values, which are valid.
const VALID = /^\d{4}(-\d{2}(-\d{2}(T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})?)?)?)?$/;

for (const [name, path] of PAGES) {
  test(`${name} emits machine-readable datetime attributes`, async ({ page }) => {
    await page.goto(path);

    const values = await page.locator('time[datetime]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('datetime')));

    // A page with no <time> would pass on an empty set and prove nothing: the template may
    // have lost its block without anyone noticing.
    expect(values.length).toBeGreaterThan(0);

    const invalid = values.filter((value) => !VALID.test(value));
    expect(invalid, `unparsable datetime values: ${invalid.join(', ')}`).toEqual([]);
  });
}
