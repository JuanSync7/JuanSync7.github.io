import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const limits = JSON.parse(readFileSync(new URL('./room-camera-limits.json', import.meta.url), 'utf8'));

/** Opaque zero-black patches are rendering faults, distinct from dark room tokens. */
export function checkEyeImage(image, label) {
  const regions = [
    { name: 'floor', x0: 0.25, x1: 0.75, y0: 0.85, y1: 0.97 },
    { name: 'ceiling', x0: 0.4, x1: 0.6, y0: 0.18, y1: 0.28 },
  ];
  return Object.fromEntries(
    regions.map((region) => {
      let black = 0,
        pixels = 0;
      for (let y = Math.floor(image.height * region.y0); y < image.height * region.y1; y++)
        for (let x = Math.floor(image.width * region.x0); x < image.width * region.x1; x++) {
          const i = (y * image.width + x) * 4;
          if (Math.max(...image.data.subarray(i, i + 3)) <= limits.opaqueBlackComponentMax) black++;
          pixels++;
        }
      assert(
        black / pixels <= limits.opaqueBlackShareMax,
        `${label}: opaque ${region.name} hole (${((black / pixels) * 100).toFixed(1)}%)`,
      );
      return [region.name, { black, pixels }];
    }),
  );
}
