import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { decode, measure, diff } from './pixels.mjs';

export async function checkRoomCamera(page, fallback, thresholds) {
  const shots = [],
    canvas = page.locator('.lab-main canvas'),
    slider = page.getByRole('slider', { name: 'View angle' });
  const angle = async (value) => {
    await slider.evaluate((input, next) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (!setter) throw new Error('Native range setter missing');
      setter.call(input, String(next));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
    await page.waitForFunction((n) => document.querySelector('.room-orbit output')?.textContent === `${n}°`, value);
  };
  const shot = async () => {
    await canvas.evaluate((c) => c.scrollIntoView({ block: 'center' }));
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await canvas.getAttribute('data-error'), null);
    const png = await canvas.screenshot(),
      m = measure(decode(png), thresholds);
    writeFileSync('figures-out/room-current.png', png);
    assert(
      m.coverage >= thresholds.coverageMin && m.coverage <= thresholds.coverageMax,
      `Bad room framing/coverage ${m.coverage}`,
    );
    assert(m.offPalette <= thresholds.offPaletteMax, `Off-palette room: ${m.offPalette}`);
    return png;
  };
  for (const mode of ['Eye level', 'Isometric']) {
    await page.getByRole('button', { name: mode, exact: true }).click();
    await page.waitForFunction(
      (n) => document.querySelector('.room-orbit output')?.textContent === `${n}°`,
      mode === 'Isometric' ? 135 : 90,
    );
    for (const value of mode === 'Isometric' ? [0, 90, 135, 180] : [0, 90, 180]) {
      await angle(value);
      const png = await shot();
      const label = `${mode} · ${value}° · ${fallback ? 'fallback' : 'WebGL'}`;
      writeFileSync(
        `figures-out/room-${fallback ? 'fallback' : 'webgl'}-${mode === 'Isometric' ? 'iso' : 'eye'}-${value}.png`,
        png,
      );
      shots.push({ label, png });
    }
  }
  assert(diff(decode(shots[0].png), decode(shots[2].png)) > 0.01, '180-degree sweep did not move');
  assert(diff(decode(shots[1].png), decode(shots[4].png)) > 0.01, 'Isometric projection did not change');
  await page.getByRole('button', { name: 'Eye level', exact: true }).click();
  await slider.focus();
  await slider.press('End');
  await page.waitForFunction(() => document.querySelector('.room-orbit output')?.textContent === '180°');
  await slider.press('Home');
  await page.waitForFunction(() => document.querySelector('.room-orbit output')?.textContent === '0°');
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  await page.locator('.room-stage').focus();
  await page.locator('.room-stage').press('ArrowRight');
  await page.waitForFunction(() => document.querySelector('.room-orbit output')?.textContent === '95°');
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  await canvas.evaluate((c) => c.scrollIntoView({ block: 'center' }));
  const box = await canvas.boundingBox();
  assert(box);
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5, { steps: 6 });
  await page.mouse.up();
  assert(Number(await slider.inputValue()) < 70, 'Drag did not orbit the room');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  assert.equal(await canvas.getAttribute('data-error'), null);
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  return shots;
}

export async function checkRoomTouch(page) {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await page.getByRole('button', { name: 'Eye level', exact: true }).click();
  const stage = page.locator('.room-stage');
  await stage.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  const box = await stage.boundingBox();
  assert(box);
  const x = box.x + box.width * 0.35,
    y = box.y + box.height * 0.5;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 6; i++)
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x + box.width * 0.05 * i, y }],
    });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForFunction(() => Number(document.querySelector('.room-orbit input')?.value) < 60);
  const before = await page.getByRole('slider', { name: 'View angle' }).inputValue();
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 6; i++)
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - i * 12 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.equal(
    await page.getByRole('slider', { name: 'View angle' }).inputValue(),
    before,
    'Vertical scrolling should not orbit',
  );
  await session.detach();
}
