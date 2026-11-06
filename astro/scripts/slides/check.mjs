import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';

const server=await createServer({server:{middlewareMode:true,ws:false},appType:'custom',logLevel:'error'});
try {
  const {SLIDE_ICONS}=await server.ssrLoadModule('/src/data/slide-icons.ts');
  const {slideDrawing}=await server.ssrLoadModule('/src/figures/kit/slides/models.ts');
  const {slideSvg,slideSprite,slidePalette}=await server.ssrLoadModule('/src/figures/kit/slides/svg.ts');
  assert.equal(SLIDE_ICONS.length,24);
  assert.equal(new Set(SLIDE_ICONS.map(icon=>icon.id)).size,24);
  const variants=new Set();
  for(const tone of ['night','paper'])for(const accent of [true,false]) {
    const options={tone,accent},look=`${tone}/${accent?'accent':'mono'}`;
    for(const icon of SLIDE_ICONS) {
      const drawing=slideDrawing(icon.id);
      assert.equal(drawing.filter(p=>p.role==='signal').length,1,`${icon.id}: one deliberate highlight`);
      assert.ok(drawing.length<=16,`${icon.id}: small, legible marks rather than engineering textures`);
      const svg=slideSvg(icon.id,options);
      assert.equal(svg,readFileSync(`public/downloads/slide-icons/${look}/${icon.id}.svg`,'utf8'));
      assert.ok(!/NaN|Infinity|<script|<image|<text|href=|foreignObject|filter=|style=|rgba\(/.test(svg));
      assert.match(svg,/<svg[^>]*viewBox="0 0 64 64"[^>]*fill="none"[^>]*stroke-width="1.25"/);
      assert.match(svg,/<title>[^<]+<\/title>/);
      assert.ok(drawing.every(p=>p.d.length>0&&!/[<>&]/.test(p.d)));
      if(!accent)assert.equal(new Set([...svg.matchAll(/stroke="([^"]+)"/g)].map(m=>m[1])).size,1);
      const paint=slidePalette(options);
      assert.ok(svg.includes(paint.line));
      variants.add(svg);
    }
    assert.equal([...slideSprite(options).matchAll(/<symbol id="slide-[^"]+"/g)].length,24);
  }
  assert.equal(variants.size,96,'Four distinct treatments for every mark');
  console.log('Slide icons: 24 distinct marks, 96 portable variants, one highlight each and four complete sprites passed.');
}finally{await server.close();}
