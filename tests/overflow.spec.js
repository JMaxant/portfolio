import { test, expect } from '@playwright/test';
import { PAGES } from './pages.js';

const WIDTHS = [320, 560, 561, 576, 577, 768, 769, 2560];

for (const width of WIDTHS) {
  test.describe(`${width}px`, () => {
    for (const [name, path] of PAGES) {
      test(`${name} fits the viewport`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);

        const result = await page.evaluate(() => {
          const vw = window.innerWidth;
          const offenders = [];

          for (const el of document.querySelectorAll('body *')) {
            const r = el.getBoundingClientRect();

            if (r.width === 0 && r.height === 0) {
              continue;
            }

            // Only a right-side overhang grows scrollWidth in LTR. The skip link parked
            // at left: -9990px sticks far out of the viewport and is not a defect.
            const over = r.right - vw;
            if (over <= 0.5) {
              continue;
            }

            // An element inside a scrolling ancestor is contained, not overflowing. A
            // `pre.chroma` in overflow-x: auto legitimately holds a 1500px line and its
            // descendants all exceed the viewport without moving the page one pixel.
            // Without this filter every page carrying code reports dozens of false
            // positives and the suite becomes noise.
            let contained = false;
            for (let p = el.parentElement; p; p = p.parentElement) {
              const overflowX = getComputedStyle(p).overflowX;
              if (overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'hidden') {
                contained = true;
                break;
              }
            }
            if (contained) {
              continue;
            }

            const describe = (node) => {
              const cls = typeof node.className === 'string' ? node.className.trim() : '';
              return node.tagName.toLowerCase() + (cls ? '.' + cls.split(/\s+/).join('.') : '');
            };

            const chain = [];
            for (let p = el; p && p !== document.documentElement; p = p.parentElement) {
              chain.unshift(describe(p));
            }

            offenders.push({
              selector: describe(el),
              chain: chain.join(' > '),
              left: Math.round(r.left * 10) / 10,
              right: Math.round(r.right * 10) / 10,
              over: Math.round(over * 10) / 10,
            });
          }

          return {
            scrollWidth: document.scrollingElement.scrollWidth,
            innerWidth: vw,
            overflow: document.scrollingElement.scrollWidth - vw,

            // Guards against the suite passing for the wrong reason. The stylesheet is
            // fingerprinted and carries an SRI `integrity` hash: if it 404s or the hash
            // mismatches, the browser drops it and renders an unstyled page — which
            // almost never overflows. Every geometric assertion would go green while
            // measuring nothing. A resolved custom property proves the CSS applied.
            styled: getComputedStyle(document.documentElement)
              .getPropertyValue('--color-surface')
              .trim() !== '',

            // Widest overhang first: the outermost box is usually the cause and its
            // descendants are only dragged along.
            culprits: offenders.sort((a, b) => b.over - a.over),
          };
        });

        const message = result.culprits
          .map((c) => `${c.selector} overflows by ${c.over}px at ${width}px\n  ${c.chain}`)
          .join('\n\n');
        expect(result.culprits, message).toEqual([]);
      });
    }
  });
}
