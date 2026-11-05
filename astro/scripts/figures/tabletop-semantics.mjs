import assert from 'node:assert/strict';

// Independent expectations describe the use of each table, not the generator's slot data.
const REQUIRED = {
  dining: ['setting', 'setting', 'wineglass', 'wineglass', 'bowl'],
  work: ['laptop', 'notebook', 'penholder', 'files'],
  computer: ['monitor', 'keyboard', 'mouse', 'tower'],
  storage: ['files', 'box', 'box', 'organizer'],
  messy: ['laptop', 'books', 'paper', 'paper', 'paper', 'mug', 'crumple', 'crumple'],
  study: ['openbook', 'notebook', 'books', 'tasklamp'],
  kitchen: ['prepboard', 'pot', 'bottle', 'spicejar'],
  bar: ['bottle', 'bottle', 'shaker', 'wineglass', 'wineglass', 'jigger'],
  lab: ['microscope', 'tuberack', 'flask', 'beaker', 'petridish'],
};
const OPTIONAL = {
  dining: ['candle', 'bottle'],
  work: ['phone', 'mug', 'tasklamp'],
  computer: ['speaker', 'headphones', 'mug', 'plant'],
  storage: ['jar', 'notebook'],
  messy: ['phone', 'penholder'],
  study: ['penholder', 'mug', 'phone'],
  kitchen: ['bowl', 'mug'],
  bar: ['tumbler', 'bowl'],
  lab: ['pipette', 'box'],
};
export function semanticCheck(p) {
  const theme = p.theme.id,
    remaining = [...REQUIRED[theme]],
    allowed = new Set([...remaining, ...OPTIONAL[theme]]);
  for (const it of p.items) {
    assert(allowed.has(it.kind), `${theme} contains an unrelated ${it.kind}`);
    const index = remaining.indexOf(it.kind);
    if (index >= 0) remaining.splice(index, 1);
    assert(
      it.x >= it.zone[0] && it.x <= it.zone[2] && it.z >= it.zone[1] && it.z <= it.zone[3],
      `${theme}/${it.kind} escaped its functional zone`,
    );
  }
  assert.equal(remaining.length, 0, `${theme} lost defining objects: ${remaining}`);
  const one = (kind) => p.items.find((it) => it.kind === kind);
  const all = (kind) => p.items.filter((it) => it.kind === kind);
  if (theme === 'computer') {
    assert(one('keyboard').z > one('monitor').z + 1);
    assert(Math.abs(one('keyboard').x - one('monitor').x) < 0.65);
    assert(Math.abs(one('mouse').x - one('keyboard').x) > 0.8);
    assert(Math.abs(one('mouse').z - one('keyboard').z) < 0.65);
    assert(one('tower').z < 0);
  }
  if (theme === 'dining')
    for (const setting of all('setting'))
      assert(all('wineglass').some((glass) => Math.abs(glass.x - setting.x) < 1 && glass.z < setting.z - 0.8));
  if (theme === 'work') assert(one('notebook').z > one('laptop').z + 1);
  if (theme === 'study') {
    assert(one('openbook').z > one('tasklamp').z + 1);
    assert(Math.abs(one('notebook').x - one('openbook').x) > 1);
  }
  if (theme === 'storage') {
    assert(all('box').every((it) => it.z < 0));
    assert(one('organizer').z > 0.5);
  }
  if (theme === 'messy') assert(all('paper').every((it) => Math.abs(it.turn) <= 0.65));
  if (theme === 'kitchen') assert(one('prepboard').z > 0 && one('pot').z < 0 && one('bottle').z < 0);
  if (theme === 'bar') {
    assert(all('bottle').every((it) => it.z < 0));
    assert(all('wineglass').every((it) => it.z > 0.5));
    assert(one('shaker').z < 0 && one('jigger').z > 0);
  }
  if (theme === 'lab') assert(one('microscope').z < 0 && one('tuberack').z < 0 && one('petridish').z > 0.5);
}
