/** Lays the look's pictures out on one labelled sheet per figure, for a person or an agent
 *  to read in one go. The sheet is a small HTML page screenshotted by the same browser. */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export async function writeSheet(browser, outPng, fig, shots, lines) {
  const cells = shots
    .map((s) => `<figure><img src="data:image/png;base64,${s.png.toString('base64')}"><figcaption>${esc(s.label)}</figcaption></figure>`)
    .join('');
  const rows = lines.map((l) => `<li class="${l.level}">${esc(l.text)}</li>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;padding:24px;background:#000;color:#ccc;font:13px/1.5 ui-monospace,monospace}
    h1{font:600 18px system-ui;color:#fff;margin:0 0 4px} p{margin:0 0 16px;color:#999}
    .shots{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}
    figure{margin:0} img{display:block;border:1px solid #333} figcaption{padding-top:6px;color:#aaa}
    ul{list-style:none;padding:0;margin:20px 0 0} li.fail{color:#ff6b6b} li.warn{color:#e0b44c} li.ok{color:#6bd3b0}
  </style><h1>${esc(fig.id)}</h1><p>${esc(fig.style)} · ${esc(fig.motion)} · answers ${fig.answers ? 'yes' : 'no'}${fig.bleed ? ' · bleeds' : ''}</p>
  <div class="shots">${cells}</div><ul>${rows}</ul>`;
  const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });
  await page.setContent(html);
  await page.screenshot({ path: outPng, fullPage: true });
  await page.close();
}
