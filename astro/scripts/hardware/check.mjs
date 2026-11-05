import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, ws: false }, appType: 'custom', logLevel: 'error' });
try {
  const { hardwareModel } = await server.ssrLoadModule('/src/figures/kit/hardware/models.ts');
  const { hardwareDrawing, hardwareCamera } = await server.ssrLoadModule('/src/figures/kit/hardware/project.ts');
  const { hardwareSvg, hardwareSprite } = await server.ssrLoadModule('/src/figures/kit/hardware/svg.ts');
  const { HARDWARE_KINDS, DEFAULT_OPTIONS, VIEWS } = await server.ssrLoadModule('/src/figures/kit/hardware/types.ts');
  const { Draft } = await server.ssrLoadModule('/src/figures/kit/hardware/primitives.ts');
  const reversed = new Draft();
  reversed.part('Reversed outline', 'Face normals stay outward for either outline winding.');
  reversed.extrude([[-1,-1],[-1,1],[1,1],[1,-1]],0,1);
  const roof=reversed.parts[0].surfaces.at(-1).points;
  const roofArea=roof.reduce((sum,a,i)=>{const b=roof[(i+1)%roof.length];return sum+a[0]*b[2]-b[0]*a[2];},0);
  assert.ok(roofArea>0,'Custom extrusions keep their top faces visible regardless of outline winding');
  const { orderSolids } = await server.ssrLoadModule('/src/figures/kit/hardware/depth.ts');
  const { mulberry32 } = await server.ssrLoadModule('/src/figures/kit/rng.ts');
  const { default: template } = await server.ssrLoadModule('/src/figures/templates/hardware-atlas.ts');
  let drawings = 0;
  for (const kind of HARDWARE_KINDS) {
    for (const detail of [3, 4, 5]) {
      const model = hardwareModel(kind, detail);
      assert.ok(model.parts.length >= 3, `${kind}: named working assemblies`);
      for (const part of model.parts) {
        assert.ok(part.name && part.note && part.surfaces.length > 0, `${kind}: no empty placeholders`);
        for (const surface of part.surfaces) {
          assert.ok(surface.points.length >= 2 && surface.points.flat().every(Number.isFinite), `${kind}: finite geometry`);
        }
      }
      if (kind === 'board' || kind === 'accelerator') {
        const footprints = (part) => {
          const groups = new Map();
          for (const surface of part.surfaces.filter((s) => s.face)) {
            const points = groups.get(surface.solid) ?? [];
            points.push(...surface.points);
            groups.set(surface.solid, points);
          }
          return [...groups.values()].map((points) => ({
            x0: Math.min(...points.map((p) => p[0])), x1: Math.max(...points.map((p) => p[0])),
            z0: Math.min(...points.map((p) => p[2])), z1: Math.max(...points.map((p) => p[2])),
          }));
        };
        const contains = (box, point) => point[0] >= box.x0 - 0.00001 && point[0] <= box.x1 + 0.00001 && point[2] >= box.z0 - 0.00001 && point[2] <= box.z1 + 0.00001;
        const traces = model.parts.flatMap(part => part.surfaces).filter(surface => surface.connection);
        assert.ok(traces.length > 0);
        for (const trace of traces) {
          const sources = footprints(model.parts.find(part => part.name === trace.connection.from));
          const sinks = footprints(model.parts.find(part => part.name === trace.connection.to));
          assert.ok(sources.some(box => contains(box, trace.points[0])), `${kind}: every trace starts at its source footprint`);
          assert.ok(sinks.some(box => contains(box, trace.points.at(-1))), `${kind}: every trace reaches its destination footprint`);
          for (let i = 1; i < trace.points.length; i++) {
            const a = trace.points[i - 1], b = trace.points[i];
            assert.ok(a[0] === b[0] || a[2] === b[2], `${kind}: traces follow Manhattan routing`);
          }
        }
      }
      for (const fine of [false,true]) for (const mode of ['isometric', 'wireframe']) for (const view of Object.keys(VIEWS)) for (const open of [0, 0.5, 1]) {
        const options = { ...DEFAULT_OPTIONS, mode, view, open, detail: fine };
        for (const [width, height] of [[256, 256], [358, 269], [640, 320]]) {
          const drawing = hardwareDrawing(model, options, width, height);
          assert.ok(drawing.paths.length > 20, `${kind}: recognisable detail`);
          for (const path of drawing.paths) for (const [x, y] of path.points) {
            assert.ok(x >= width * 0.11 && x <= width * 0.89 && y >= height * 0.11 && y <= height * 0.89,
              `${kind}/${mode}/${view}: the whole assembly stays in frame at every opening`);
          }
          const canvas = hardwareDrawing(model, options, width, height, hardwareCamera(view), false);
          assert.deepEqual(canvas.paths.map((p) => p.points), drawing.paths.map((p) => p.points), 'Canvas and SVG use identical projected geometry');
          drawings++;
        }
      }
      for (let part=0;part<model.parts.length;part++) for (const view of Object.keys(VIEWS)) {
        const solo=hardwareDrawing(model,{...DEFAULT_OPTIONS,pick:part,isolate:true,view},640,480);
        assert.ok(solo.paths.length>0, `${kind}: every part can be inspected`);
        assert.ok(solo.paths.every(path=>path.part===part), `${kind}: isolation contains only the selected assembly`);
        for(const path of solo.paths) for(const [x,y] of path.points)
          assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&x>=70&&x<=570&&y>=50&&y<=430, `${kind}: isolated part stays whole in frame`);
      }

    }
    const svg = hardwareSvg(hardwareModel(kind), DEFAULT_OPTIONS);
    assert.ok(!/NaN|Infinity|<script|href=|foreignObject|rgba\(/.test(svg), `${kind}: portable, self-contained SVG 1.1`);
    assert.equal(svg, hardwareSvg(hardwareModel(kind), DEFAULT_OPTIONS), `${kind}: repeat export is deterministic`);
  }
  for (let seed=0;seed<100;seed++) {
    const rng=mulberry32(seed);
    const solids=Array.from({length:24},(_,i)=>({ id:i,lo:[-.5+rng(),i*.08,-.5+rng()],hi:[.7+rng(),i*.08+.07,.7+rng()],depth:rng()*10 }));
    const sorted=orderSolids(solids);
    assert.equal(sorted.length,solids.length,'No solid disappears from depth ordering');
    for(let i=0;i<solids.length;i++) for(let j=i+1;j<solids.length;j++) {
      const a=solids[i],b=solids[j];
      if([0,2].every(axis=>Math.min(a.hi[axis],b.hi[axis])-Math.max(a.lo[axis],b.lo[axis])>.00001))
        assert.ok(sorted.indexOf(a)<sorted.indexOf(b),'A lower overlapping solid never paints over a raised panel');
    }
  }
  const seen = new Set();
  for (let seed = 0; seed < 1000; seed++) {
    const a = template.instance(seed), b = template.instance(seed);
    assert.equal(a.variant, b.variant, 'Seed choices reproduce');
    seen.add(a.variant.split(' ').at(-1));
  }
  assert.deepEqual([...seen].sort(), [...HARDWARE_KINDS].sort(), 'The seeded grammar reaches all twelve objects');
  const sprite = hardwareSprite(DEFAULT_OPTIONS);
  const ids = [...sprite.matchAll(/<symbol id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 24);
  assert.equal(new Set(ids).size, 24, 'No duplicate symbol IDs');
  for (const kind of HARDWARE_KINDS) for (const mode of ['isometric', 'wireframe']) assert.ok(ids.includes(`${kind}-${mode}`));
  console.log(`Hardware atlas: ${drawings} framed views, identical SVG/canvas geometry, 1,000 deterministic seeds and 24 unique symbols passed.`);
} finally { await server.close(); }
