/** The audits measure the figures as drawn, in the night palette. The paper system recolours
 *  figures on the page (--pp-figure-filter), so audits that load site pages switch that off. */
export async function nightInk(target) {
  await target.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = ':root { --pp-figure-filter: none !important; --pp-figure-blend: normal !important; }';
      document.head.append(style);
    });
  });
  return target;
}
