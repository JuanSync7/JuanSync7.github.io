/** The reading measure (Juan, 18 Nov 2026): a post or article reads at 70 to 81 characters a line
 *  wherever the screen has room for it, and the article keeps at least --pp-doc-gap from the
 *  panels beside it. Measured on the rendered lines of body paragraphs, not on boxes. */
import assert from 'node:assert/strict';

export const MEASURE = { min: 70, max: 81 };
// Widths where the three columns have room for the full measure (below them the article fills
// what is left, and the contents column folds away under 1180 px).
const WIDTHS = [1440, 1728, 1920];
const PAGES = ['/blog/the-same-drawing-fifty-times/', '/learn/agents-you-can-repeat/'];

export async function checkReadingMeasure(browser, base) {
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    for (const path of PAGES) {
      await page.goto(`${base}${path}`, { waitUntil: 'load' });
      const m = await page.evaluate(() => {
        const ps = [...document.querySelectorAll('.doc-main p')].filter((p) => p.innerText.length > 150).slice(0, 6);
        const counts = [];
        let left = Infinity;
        let right = -Infinity;
        for (const p of ps) {
          const range = document.createRange();
          range.selectNodeContents(p);
          for (const r of range.getClientRects()) if (r.width > 4) [left, right] = [Math.min(left, r.left), Math.max(right, r.right)];
          const lines = new Map();
          const walk = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
          for (let n = walk.nextNode(); n; n = walk.nextNode()) {
            for (let i = 0; i < n.length; i++) {
              const one = document.createRange();
              one.setStart(n, i);
              one.setEnd(n, i + 1);
              const b = one.getBoundingClientRect();
              if (b.width) lines.set(Math.round(b.top), (lines.get(Math.round(b.top)) ?? 0) + 1);
            }
          }
          counts.push(...[...lines.values()].slice(0, -1)); // the last line of a paragraph is short
        }
        counts.sort((a, b) => a - b);
        const edge = (s, side) => document.querySelector(s)?.getBoundingClientRect()[side];
        const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pp-doc-gap'));
        return { chars: counts[Math.floor(counts.length / 2)], lines: counts.length, left, right, pane: edge('.doc-pane', 'right'), toc: edge('.doc-toc', 'left'), gap };
      });
      const tag = `${path} at ${width}px`;
      assert(m.lines >= 6, `${tag}: too few full lines to measure (${m.lines})`);
      assert(m.chars >= MEASURE.min && m.chars <= MEASURE.max, `${tag}: ${m.chars} characters a line, want ${MEASURE.min} to ${MEASURE.max}`);
      if (m.pane) assert(m.left - m.pane >= m.gap - 1, `${tag}: ${Math.round(m.left - m.pane)}px from the pane, want at least ${m.gap}`);
      if (m.toc) assert(m.toc - m.right >= m.gap - 1, `${tag}: ${Math.round(m.toc - m.right)}px to On this page, want at least ${m.gap}`);
    }
    await context.close();
  }
}
