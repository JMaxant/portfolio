import { test, expect } from '@playwright/test';

// #69 : l'attribut `datetime` d'un <time> doit porter la date machine, pas la date
// affichée. Deux gabarits passaient le format i18n (`02/01/2006`) dans l'attribut et
// émettaient `datetime="28/07/2026"`, que rien ne sait lire — ni les AT, ni un parseur.
// Le texte visible, lui, reste au format i18n : c'est tout l'intérêt de l'attribut.
//
// Aucune page ne débordait et aucune règle CSS n'était en cause, donc ni la suite overflow
// ni axe ne pouvaient le voir : axe ne valide pas la valeur d'un `datetime`.

// Les gabarits qui émettent un <time>, un par forme de liste.
const PAGES = [
  ['home', '/'],
  ['blog list', '/blog/'],
  ['veille list', '/veille/'],
  ['tags list', '/tags/'],
  ['tag term', '/tags/hugo/'],
  ['blog single', '/cas-max/'],
  ['parcours', '/parcours/'],
];

// Formes acceptées par HTML pour un <time> : année, mois, date, et date+heure. La timeline
// du parcours émet des `2017-01`, qui sont valides.
const VALID = /^\d{4}(-\d{2}(-\d{2}(T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})?)?)?)?$/;

for (const [name, path] of PAGES) {
  test(`${name} emits machine-readable datetime attributes`, async ({ page }) => {
    await page.goto(path);

    const values = await page.locator('time[datetime]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('datetime')));

    // Une page sans <time> passerait à vide et ne prouverait rien : le gabarit a pu perdre
    // son bloc sans que personne ne le voie.
    expect(values.length).toBeGreaterThan(0);

    const invalid = values.filter((value) => !VALID.test(value));
    expect(invalid, `datetime non parsables : ${invalid.join(', ')}`).toEqual([]);
  });
}
