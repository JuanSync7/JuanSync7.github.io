import { fbm, noise2 } from '../noise';
import { cell, type Biome, type Landmark, type Liquid, type WorldSpec } from './types';
import { stream, integer } from './seeds';
import { climate } from './climate';
import { biomeHeight, landscapeHeight } from './profiles';
import { addWaterFeatures } from './water-features';
import { mainlandOutline } from './edges';

export function terrain(spec: WorldSpec) {
  const rng = stream(spec.layoutSeed, 'terrain'),
    noise = noise2(rng),
    zones = climate(spec);
  const heights = new Map<string, number>(),
    biomes = new Map<string, Biome>(),
    ceilings = new Map<string, number>();
  const roofs = new Map<string, number>();
  const liquids = new Map<string, Liquid>(),
    seabed = new Map<string, number>(),
    landmarks: Landmark[] = [];
  const r = spec.radius,
    rz = Math.round(r * spec.stretch);
  const cx = integer(rng, -Math.floor(r * 0.25), Math.floor(r * 0.25));
  const cz = integer(rng, -Math.floor(rz * 0.45), 0),
    phase = rng() * 6;
  const islands = Array.from({ length: spec.landform === 'archipelago' ? integer(rng, 2, 4) : 1 }, (_, i) => ({
    x: spec.landform === 'archipelago' ? Math.cos(i * 2.4 + phase) * r * 0.48 : cx * 0.3,
    z: spec.landform === 'archipelago' ? Math.sin(i * 2.4 + phase) * rz * 0.48 : 0,
    radius: spec.landform === 'archipelago' ? r * (0.23 + rng() * 0.13) : r * (0.79 + rng() * 0.1),
  }));
  const ocean = ['island', 'archipelago'].includes(spec.landform);
  const inside = mainlandOutline(spec);
  for (let x = -r; x <= r; x++)
    for (let z = -rz; z <= rz; z++) {
      if (!ocean && !inside(x, z)) continue;
      let coast = 0;
      if (ocean) {
        coast = Math.min(...islands.map((i) => Math.hypot(x - i.x, (z - i.z) / spec.stretch) / i.radius));
        coast += noise(x * 0.09, z * 0.09) * 0.12;
        if (coast > 1) continue;
      }
      const n = fbm(noise, x * 0.055 + 23, z * 0.055, 4),
        blend = zones.weight(x, z);
      const primary = biomeHeight(spec.biome, x, z, n, phase);
      const other = spec.secondary ? biomeHeight(spec.secondary, x, z, n, phase) : primary;
      let height = landscapeHeight(spec, x, z, primary + (other - primary) * blend, n, cx, cz);
      if (spec.biome === 'city' || spec.biome === 'village')
        height = 3 + Math.floor(Math.max(0, height) / (spec.biome === 'city' ? 16 : 8)) * 3;
      if (ocean) height *= Math.min(1, Math.max(0.12, (1 - coast) * 5));
      if (spec.landform === 'cavern') {
        height = 3 + Math.floor(n * 3);
        const wall = 4 + Math.round((noise(x * 0.1 + 7, z * 0.1) + 1) * 2),
          vault = 13 + Math.floor(Math.cos(((x / r) * Math.PI) / 2) * 6 + Math.cos((z / rz) * 2) * 2 + n * 3);
        if (Math.abs(x) >= r - wall || z <= -rz + wall) height = 19 + Math.floor(n * 4);
        else if (z < -rz * 0.1 + Math.sin(x * 0.12) * 4 + noise(x * 0.08, z * 0.08) * 3) {
          const skylight = Math.abs(x) < r * 0.65 && z > -rz * 0.74 && noise(x * 0.12 + 31, z * 0.12 - 19) > 0.34;
          if (!skylight) {
            roofs.set(cell(x, z), vault);
            ceilings.set(cell(x, z), vault - (Math.abs(x * 17 + z * 29 + spec.layoutSeed) % 23 === 0 ? 3 : 0));
          } else if (
            landmarks.filter((l) => l.kind === 'cave skylight').length < 2 &&
            Math.abs(x) % 13 === 0 &&
            Math.abs(z) % 11 === 0
          )
            landmarks.push({ kind: 'cave skylight', x, z, height: height + 1 });
        }
      }
      heights.set(cell(x, z), Math.max(1, Math.min(40, Math.floor(height))));
      biomes.set(cell(x, z), zones.biomeAt(x, z));
    }
  if (ocean)
    for (let x = -r - 6; x <= r + 6; x++)
      for (let z = -rz - 6; z <= rz + 6; z++) {
        if ((Math.abs(x) / (r + 6.5)) ** 8 + (Math.abs(z) / (rz + 6.5)) ** 8 > 1 || heights.has(cell(x, z))) continue;
        const k = cell(x, z),
          floor = -4 + Math.floor(noise(x * 0.1, z * 0.1) * 2);
        seabed.set(k, floor);
        liquids.set(k, {
          level: 0,
          bottom: floor + 1,
          kind: spec.biome === 'frozen' || (spec.biome === 'snow' && z < 0) ? 'ice' : 'water',
        });
      }
  addWaterFeatures(spec, heights, liquids, landmarks, cx, cz);
  const highest = [...heights].reduce((a, b) => (b[1] > a[1] ? b : a));
  const [hx = 0, hz = 0] = highest[0].split(',').map(Number);
  landmarks.push({ kind: spec.landform, x: hx, z: hz, height: highest[1] });
  return { heights, biomes, ceilings, roofs, liquids, seabed, landmarks };
}
