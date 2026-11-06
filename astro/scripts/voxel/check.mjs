import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const result = await build({ entryPoints: ['src/figures/kit/voxel-world/generate.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const testDirectory = mkdtempSync(join(tmpdir(), 'voxel-check-'));
const modulePath = join(testDirectory, 'generator.mjs');
writeFileSync(modulePath, result.outputFiles[0].text);
process.on('exit', () => rmSync(testDirectory, {recursive:true,force:true}));
const { generateWorld } = await import(pathToFileURL(modulePath));
const biomes = ['woodland', 'mushroom', 'snow', 'volcanic', 'oasis', 'village'];
const key = (x, y, z) => `${x},${y},${z}`;
const summary = {};
let worlds = 0;
for (const biome of biomes) {
  let minProps = Infinity, maxProps = 0;
  for (let seed = 0; seed < 80; seed++) {
    const spec = { biome, radius: 17 + seed % 4, stretch: 0.86 + (seed % 11) * 0.02, turn: seed, density: (seed % 10) / 10, anchor: seed % 5 - 2 };
    const world = generateWorld(spec, seed === 79 ? 999999999 : seed);
    const label = `${biome}/${seed}`;
    assert(world.props.some(p => p.kind === 'cottage'), `${label}: missing cottage`);
    assert(world.props.length >= 8, `${label}: sparse world`);
    assert(world.blocks.length < 40000, `${label}: unbounded geometry`);
    const occupied = new Set();
    for (const b of world.blocks) {
      const k = key(b.x, b.y, b.z);
      assert(!occupied.has(k), `${label}: solid overlap at ${k}`);
      occupied.add(k);
    }
    for (const p of world.props) {
      for (const b of p.blocks) {
        assert(Math.abs(b.x) <= p.rx && Math.abs(b.z) <= p.rz, `${label}: underestimated footprint`);
        const ground = world.heights.get(`${p.x + b.x},${p.z + b.z}`);
        assert(ground !== undefined && p.y + b.y > ground, `${label}: prop intersects terrain`);
        if (b.y === 0) assert.equal(p.y - 1, ground, `${label}: floating foundation`);
      }
    }
    for (let i = 0; i < world.props.length; i++) for (let j = i + 1; j < world.props.length; j++) {
      const a = world.props[i], b = world.props[j];
      assert(Math.abs(a.x - b.x) > a.rx + b.rx + 1 || Math.abs(a.z - b.z) > a.rz + b.rz + 1, `${label}: no gap between ${a.kind} and ${b.kind}`);
    }
    const cottage = world.props[0];
    for (const p of world.props.slice(1)) {
      assert(!(p.x - p.rx <= cottage.x + 1 && p.x + p.rx >= cottage.x - 1 && p.z + p.rz >= cottage.z + 7), `${label}: blocked primary approach`);
    }
    const elevations = [...world.heights.values()];
    const relief = Math.max(...elevations) - Math.min(...elevations);
    assert(relief >= (biome === 'snow' || biome === 'volcanic' ? 10 : 6), `${label}: flat biome terrain (${relief})`);
    assert(world.landmarks.some(l => l.kind.endsWith('ridge')), `${label}: missing terrain landmark`);
    if(biome === 'volcanic') assert([...world.liquids.values()].some(l => l.kind === 'lava' && l.level > 0), `${label}: missing crater lava`);
    if(biome === 'woodland' || biome === 'mushroom') assert(world.landmarks.some(l => l.kind === 'waterfall'), `${label}: missing waterfall`);
    for(const [k, liquid] of world.liquids) {
      const floor = world.heights.get(k) ?? world.seabed.get(k);
      assert(floor !== undefined && liquid.bottom === floor + 1 && liquid.level >= liquid.bottom, `${label}: unsupported liquid ${k}`);
      for(const p of world.props) assert(!(Math.abs(p.x - Number(k.split(',')[0])) <= p.rx && Math.abs(p.z - Number(k.split(',')[1])) <= p.rz), `${label}: prop in water`);
    }
    assert(world.boats.length >= 1 && world.boats.length <= 2, `${label}: missing boats`);
    for(const boat of world.boats) {
      for(let dx=-boat.rx-1;dx<=boat.rx+1;dx++) for(let dz=-boat.rz-1;dz<=boat.rz+1;dz++) {
        const k = `${boat.x+dx},${boat.z+dz}`, liquid = world.liquids.get(k);
        assert(liquid?.level === 0 && liquid.kind === 'water' && !world.heights.has(k), `${label}: unsafe boat clearance`);
      }
      for(const b of boat.blocks) assert(Math.abs(b.x) <= boat.rx && Math.abs(b.z) <= boat.rz, `${label}: underestimated sail envelope`);
    }
    for(const s of world.structures) {
      assert(s.kind === 'pier', `${label}: unknown harbour structure`);
      for(const b of s.blocks) if(b.y === 2) assert(world.liquids.has(`${s.x+b.x},${s.z+b.z}`), `${label}: pier off water`);
      for(const b of world.boats) assert(Math.abs(s.x-b.x)>s.rx+b.rx+2 || Math.abs(s.z-b.z)>s.rz+b.rz+2, `${label}: boat hits pier`);
    }
    if(world.boats.length===2) { const [a,b]=world.boats; assert(Math.abs(a.x-b.x)>a.rx+b.rx+3 || Math.abs(a.z-b.z)>a.rz+b.rz+3, `${label}: boat overlap`); }
    const visited = new Set(['0,0']), queue = [[0,0]];
    for (let i = 0; i < queue.length; i++) {
      const [x,z] = queue[i];
      for (const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const k = `${x+dx},${z+dz}`;
        if(world.heights.has(k) && !visited.has(k)) { visited.add(k); queue.push([x+dx,z+dz]); }
      }
    }
    assert.equal(visited.size, world.heights.size, `${label}: disconnected land`);
    if(seed % 20 === 0) assert.deepEqual(world, generateWorld(spec, seed), `${label}: non-deterministic`);
    minProps = Math.min(minProps, world.props.length); maxProps = Math.max(maxProps, world.props.length); worlds++;
  }
  summary[biome] = { minProps, maxProps };
}
console.log(JSON.stringify({ worlds, checks: ['solid collisions', 'footprint clearance', 'terrain support', 'connected land', 'clear approach', 'determinism', 'geometry budget', 'biome elevation', 'liquid support', 'boat clearance', 'terrain landmarks'], biomes: summary }, null, 2));
