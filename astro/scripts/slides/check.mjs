import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
import {auditIcon,fingerprint,manifest,selftest} from './audit.mjs';

const server=await createServer({server:{middlewareMode:true,ws:false},appType:'custom',logLevel:'error'});
try {
  const {SLIDE_ICONS}=await server.ssrLoadModule('/src/data/slide-icons.ts');
  const {slideDrawing}=await server.ssrLoadModule('/src/figures/kit/slides/models.ts');
  const {slideSvg,slideSprite,slidePalette}=await server.ssrLoadModule('/src/figures/kit/slides/svg.ts');
  const definitions=JSON.parse(readFileSync('src/figures/kit/slides/definitions.json'));
  const reviews=JSON.parse(readFileSync('vendor/slide-icons/reviews.json'));
  const options=['night','paper'].flatMap(tone=>[true,false].map(accent=>({tone,accent})));
  assert.equal(SLIDE_ICONS.length,48);
  assert.equal(new Set(SLIDE_ICONS.map(i=>i.id)).size,48);
  assert.deepEqual(SLIDE_ICONS.map(i=>i.id),manifest.icons.map(i=>i.id));
  selftest(definitions);
  const variants=new Set();
  for(const icon of manifest.icons){
    assert.deepEqual(auditIcon(icon,definitions[icon.id]).failures,[],icon.id);
    const digest=fingerprint(icon,options.map(o=>slideSvg(icon.id,o)));
    assert.equal(reviews[icon.id]?.fingerprint,digest,`${icon.id}: review is missing or stale`);
    assert.ok(reviews[icon.id].notes.length>35&&reviews[icon.id].sizes.join(',')==='32,64');
    assert.notEqual(fingerprint(icon,options.map(o=>slideSvg(icon.id,o)+' ')),digest,'Changed export must invalidate the visual review');
    for(const o of options){
      const look=`${o.tone}/${o.accent?'accent':'mono'}`,drawing=slideDrawing(icon.id,o.accent),svg=slideSvg(icon.id,o);
      assert.equal(drawing.filter(n=>n.role==='signal').length,o.accent?1:0);
      assert.equal(svg,readFileSync(`public/downloads/slide-icons/${look}/${icon.id}.svg`,'utf8'));
      assert.ok(!/NaN|Infinity|<script|<image|<text|href=|foreignObject|filter=|style=|rgba\(/.test(svg));
      assert.match(svg,/<svg[^>]*viewBox="0 0 24 24"[^>]*fill="none"[^>]*stroke-width="1"/);
      assert.match(svg,/<title>[^<]+<\/title><metadata>[^<]+<\/metadata>/);
      const colors=new Set([...svg.matchAll(/stroke="([^"]+)"/g)].map(m=>m[1]));
      assert.equal(colors.size,o.accent?2:1);
      assert.ok(svg.includes(slidePalette(o).line));
      variants.add(svg);
    }
  }
  for(const o of options)assert.equal([...slideSprite(o).matchAll(/<symbol id="slide-[^"]+"/g)].length,48);
  assert.equal(variants.size,192);
  console.log('Slide icons: all 48 geometry contracts, review fingerprints, 192 portable exports and four sprites passed.');
}finally{await server.close();}
