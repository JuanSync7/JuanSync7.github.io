import { Color } from 'three';
import { hexOf } from '../ink';
import { mulberry32 } from '../rng';
import { atmosphereProfile, type AtmosphereInput } from './profile';
import { practicalSources } from './practicals';
import type { AtmosphereWorld } from './types';
import type { NightKey } from '../../../styles/tokens/palette';
type Point = [number, number, number];
const surfaces = new WeakMap<AtmosphereWorld, Map<string, number>>();
const samples = new WeakMap<AtmosphereWorld, { x: number; z: number; phase: number }[]>();
/** The non-WebGL view keeps the same mood and weather; mapped shadows remain a GPU capability. */
export function fallbackAtmosphere(
  world: AtmosphereWorld,
  input: AtmosphereInput,
  t: number,
  project: (p: Point) => [number, number],
  building: (kind: string) => boolean,
) {
  let surface = surfaces.get(world);
  if (!surface) {
    surface = new Map(world.heights);
    for (const b of world.blocks) {
      const key = `${b.x},${b.z}`;
      surface.set(key, Math.max(surface.get(key) ?? -10, b.y));
    }
    surfaces.set(world, surface);
  }
  const profile = atmosphereProfile(world.spec, input),
    sources = practicalSources(world, building);
  const angle = world.spec.sunAngle ?? (world.spec.layoutSeed ?? 1) * 0.001;
  const direction = [Math.cos(angle), Math.sin(profile.elevation) * 1.5, Math.sin(angle)];
  const length = Math.hypot(...direction),
    cache = new Map<string, string>(),
    colour = new Color();
  const fog = new Color(
    hexOf(profile.night ? 'ground' : profile.weather === 'dust' ? 'worldEarth' : 'worldWater'),
  ).lerp(new Color(hexOf('ground')), 0.72);
  function shade(material: NightKey, normal: Point, center: Point, distance: number) {
    const cell = center.map((v, i) => Math.round(v - (normal[i] ?? 0) * 0.5)).join(',');
    const emission = sources.cells.has(cell) || material === 'worldEmber';
    const bucket = Math.round(Math.max(0, Math.min(1, distance)) * 16),
      key = `${material}/${normal}/${bucket}/${emission}`;
    const old = cache.get(key);
    if (old) return old;
    const diffuse = Math.max(0, normal.reduce((sum, n, i) => sum + n * (direction[i] ?? 0), 0) / length);
    colour
      .set(hexOf(material))
      .multiplyScalar(
        profile.fill + profile.sky * 0.65 + profile.key * 0.33 * diffuse + (emission ? profile.emission : 0),
      );
    colour.lerp(fog, Math.min(0.7, bucket / 16 / profile.haze));
    const value = colour.getStyle();
    cache.set(key, value);
    return value;
  }
  function draw(ctx: CanvasRenderingContext2D) {
    let particles = samples.get(world);
    if (!particles) {
      const sites = [...world.heights.keys()],
        rng = mulberry32((world.spec.layoutSeed ?? 1) ^ 773231);
      particles = Array.from({ length: 192 }, () => {
        const [x = 0, z = 0] = (sites[Math.floor(rng() * sites.length)] ?? '0,0').split(',').map(Number);
        return { x, z, phase: rng() };
      });
      samples.set(world, particles);
    }
    ctx.save();
    ctx.fillStyle = hexOf(profile.weather === 'dust' ? 'worldSand' : 'worldSnow');
    ctx.globalAlpha = 0.65;
    if (profile.weather !== 'clear' && profile.weather !== 'mist')
      for (const p of particles) {
        const rain = profile.weather === 'rain',
          phase = (p.phase + t * (rain ? 0.72 : 0.12)) % 1;
        const height = (surface?.get(`${p.x},${p.z}`) ?? 0) + 2 + (1 - phase) * 18;
        const [x, y] = project([p.x, height, p.z]);
        ctx.fillRect(x, y, rain ? 0.7 : 1.5, rain ? 4 : 1.5);
      }
    ctx.globalAlpha = 1;
    for (const p of sources.sources) {
      const [x, y] = project([p.x, p.y, p.z]),
        radius = profile.night ? 9 : 5;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, hexOf(p.magic ? 'signal' : 'worldHoney') + 'a0');
      gradient.addColorStop(1, hexOf(p.magic ? 'signal' : 'worldHoney') + '00');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    ctx.restore();
  }
  return { profile, shade, draw };
}
