import assert from 'node:assert/strict';
import { join } from 'node:path';

const position = (page, top) => page.evaluate((target) => window.scrollTo({ top: target, behavior: 'instant' }), top);

async function settled(page, selector) {
  await page.locator(selector).first().evaluate((element) => new Promise((resolve, reject) => {
    let previous = '';
    let stable = 0;
    const started = performance.now();
    const sample = () => {
      const transform = getComputedStyle(element).transform;
      stable = transform === previous ? stable + 1 : 0;
      previous = transform;
      if (stable >= 5) return resolve();
      if (performance.now() - started > 5000) return reject(new Error('Scroll transform did not settle'));
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
}

export async function checkScrollJourney(page, output, widths) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 960 });
    await position(page, 0);
    await page.waitForFunction(() => {
      const stack = document.querySelector('[data-scroll-stack]');
      return stack && Math.abs(new DOMMatrix(getComputedStyle(stack).transform).m42) < 0.2;
    });
    assert.equal(await page.locator('[data-presentation]').getAttribute('data-scroll-journey'), 'ready');
    const cardTravel = await page.locator('[data-scroll-card]').first().evaluate((card) => new DOMMatrix(getComputedStyle(card).transform).m42);
    await page.screenshot({ path: join(output, `scroll-${width}-start.png`) });

    const target = await page.locator('#overview').evaluate((hero) => Math.min(innerHeight, hero.offsetHeight) / 3);
    await position(page, target);
    await page.waitForFunction(() => new DOMMatrix(getComputedStyle(document.querySelector('[data-scroll-stack]')).transform).m42 < -1);
    await settled(page, '[data-scroll-stack]');
    assert(Math.abs(await page.evaluate(() => scrollY) - target) < 2, 'GSAP must not intercept native scrolling');
    await page.screenshot({ path: join(output, `scroll-${width}-hero.png`) });

    const explore = await page.locator('#explore').evaluate((section) => section.getBoundingClientRect().top + scrollY
      - parseFloat(getComputedStyle(document.querySelector('[data-presentation]')).getPropertyValue('--pr-scroll-inset')));
    await position(page, explore);
    await page.waitForFunction(() => Number(document.querySelector('[data-presentation]').dataset.scrollFraction) > 0);
    await page.waitForFunction((initial) => new DOMMatrix(getComputedStyle(document.querySelector('[data-scroll-card]')).transform).m42 < initial / 2, cardTravel);
    await settled(page, '[data-scroll-card]');
    const bar = await page.locator('[data-scroll-chapters]').boundingBox();
    const header = await page.locator('body > header.nav').boundingBox();
    assert(bar && header && Math.abs(bar.y - header.height) < 2, 'Chapter navigation stays below the site header');
    const progress = await page.locator('[data-scroll-progress]').evaluate((line) => new DOMMatrix(getComputedStyle(line).transform).m11);
    assert(progress > 0 && progress < 1, 'The chapter rail reflects actual reading progress');
    await page.screenshot({ path: join(output, `scroll-${width}-explore.png`) });

    await page.locator('[data-scroll-chapters] a[href="#purpose"]').click();
    await page.waitForFunction(() => {
      const section = document.querySelector('#purpose');
      const inset = parseFloat(getComputedStyle(document.querySelector('[data-presentation]')).getPropertyValue('--pr-scroll-inset'));
      return Math.abs(section.getBoundingClientRect().top - inset) < 2;
    });
    const heading = await page.locator('#purpose h2').boundingBox();
    const chapters = await page.locator('[data-scroll-chapters]').boundingBox();
    assert(heading && chapters && heading.y >= chapters.y + chapters.height, 'Anchor navigation keeps the heading clear of sticky chrome');

    await position(page, 0);
    await page.waitForFunction(() => {
      const stack = document.querySelector('[data-scroll-stack]');
      return Math.abs(new DOMMatrix(getComputedStyle(stack).transform).m42) < 0.2;
    });
    assert(Number(await page.locator('[data-presentation]').getAttribute('data-scroll-fraction')) < 0.001, 'Progress resets when scrolling back');
    await page.locator('.vault-stack-stage').scrollIntoViewIfNeeded();
    assert(await page.locator('[data-scroll-stack]').evaluate((stack) => {
      const label = stack.querySelector('strong');
      const box = label.getBoundingClientRect();
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return Boolean(hit && label.closest('a').contains(hit));
    }), 'The hero remains clickable after reverse scrolling');
  }
  await page.setViewportSize({ width: widths[0], height: 960 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('[data-presentation]').dataset.presentationMotion === 'reduced');
  assert.equal(await page.locator('[data-presentation]').getAttribute('data-scroll-journey'), null);
  assert.equal(await page.locator('[data-scroll-stack]').evaluate((stack) => getComputedStyle(stack).transform), 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => document.querySelector('[data-presentation]').dataset.scrollJourney === 'ready');
  await position(page, 0);
  console.log('Scroll journey: native position, reversible parallax, sticky progress, anchor clearance and live reduced-motion teardown pass.');
}
