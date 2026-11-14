/** Hand-drawn sticker art for the home page's hobbies board, in the hand of a teenager who can
 *  draw: a bold confident outline round each object, thinner ink inside, flat fills with a
 *  cel-shaded side, a white gloss streak, hatching in the shadows and doodles in the margin
 *  (sparkles, motion lines, notes, a paper plane). Each is SVG markup on a 100 x 100 grid drawn
 *  with seven classes so every colour and weight comes from the sticker tokens:
 *  `o` bold outline, `i` ink line, `t` thin hatching, `h` gloss highlight, `f` paper fill,
 *  `g` shade fill, `a` the signal, `k` solid ink. `Sticker.astro` adds the wobble and the
 *  die-cut border. No brand, logo or lettering is drawn. */
export type StickerKind = 'frisbee' | 'badminton' | 'swimming' | 'piano' | 'travelling';

/** A four-point sparkle centred on (x, y), r long. */
const spark = (x: number, y: number, r: number): string => {
  const q = r * 0.28;
  return `<path class="k" d="M${x} ${y - r}Q${x + q} ${y - q} ${x + r} ${y}Q${x + q} ${y + q} ${x} ${y + r}Q${x - q} ${y + q} ${x - r} ${y}Q${x - q} ${y - q} ${x} ${y - r}z"/>`;
};

export const STICKERS: Record<StickerKind, { label: string; art: string }> = {
  // A 175 g ultimate disc in flight: deep rim, flat flight plate, the raised flight rings near the
  // edge, a domed shoulder catching the light; motion lines and a spin mark behind it.
  frisbee: {
    label: 'ultimate frisbee',
    art: `<g transform="rotate(-14 52 52)">
<path class="o g" d="M8 50v6c0 9 20 15 44 15s44-6 44-15V50"/>
<path class="t" d="M15 60l1.5 4M24 63.5l1 4M34 65.5l.6 4M44 66.6l.3 4M54 66.8v4M64 66l-.4 4M74 64.3l-.8 4M83 61.5l-1.2 3.6"/>
<ellipse class="o a" cx="52" cy="50" rx="44" ry="15"/>
<ellipse class="i" cx="52" cy="50" rx="37" ry="12.2"/><ellipse class="t" cx="52" cy="50" rx="33.5" ry="11"/>
<path class="h" d="M22 45q14-9 36-9M66 37q8 1 12 4"/><path class="h" d="M80 57q6-2 8-5"/></g>
<path class="i" d="M2 30q7-4 13-2M0 42q8-3 12 0M3 54q6-2 9 1"/><path class="i" d="M60 14q14-8 26 2m0 0l-1-6m1 6l-6 1"/>
${spark(90, 82, 6)}${spark(16, 86, 4)}`,
  },
  // A feather shuttlecock rushing cork first: sixteen feathers on their shafts, two threads, the
  // band where they meet the cork, a shaded cork with a shine, speed lines in its wake.
  badminton: {
    label: 'badminton',
    art: `<g transform="rotate(-32 50 52)">
<path class="o f" d="M27 14L41 64H59L73 14z"/><path class="t" d="M62 22l4 3M60 30l5 3M59 38l4 3M57 46l4 2M56 54l3 2"/>
<ellipse class="o g" cx="50" cy="14" rx="23" ry="6"/><path class="i" d="M30 13q3-5 6-1t6 0 6 0 6 0 6 0 6 0 6 1"/>
<path class="i" d="M33 17l10 47M39 19l6 45M45 20l3 44M50 20v44M55 20l-3 44M61 19l-6 45M67 17l-10 47"/>
<path class="i" d="M33 34q17 5 34 0M37 49q13 4 26 0"/>
<path class="o a" d="M40 63h20v6H40z"/><path class="o f" d="M40 69h20c2 20-22 20-20 0z"/><path class="g" d="M54 70h5c1 9-4 14-9 15 5-4 5-9 4-15z"/>
<path class="h" d="M44 73q0 5 3 8"/></g>
<path class="i" d="M6 20q8 2 14 8M2 32q8 1 13 6M10 8q6 4 9 9"/>${spark(88, 20, 6)}${spark(80, 90, 4)}`,
  },
  // Front crawl, swimming left and turning to breathe: capped head with goggles, mouth open, one
  // arm swinging over the head into the water ahead, a curling wave, splashes off the hand.
  swimming: {
    label: 'swimming',
    art: `<path class="o g" d="M0 68q10-8 20 0t20 0 20 0 20 0 20 0V100H0z"/>
<path class="o f" d="M52 70L36 24Q40 14 48 20L66 70z"/><path class="o f" d="M36 16Q44 14 46 24L22 46L14 40z"/>
<path class="o f" d="M22 46C16 54 6 50 8 42C8 36 12 34 16 38L14 32C17 30 19 33 18 36z"/>
<path class="h" d="M56 56L44 24"/><path class="t" d="M58 40l4-1M60 48l4-1M28 36l2 3"/>
<circle class="o f" cx="44" cy="58" r="15"/><path class="o a" d="M29 56A15 15 0 0 1 59 54Q44 62 29 56z"/>
<path class="i" d="M32 62q12 2 26-2"/><circle class="o f" cx="33" cy="61" r="4.6"/><circle class="k" cx="32" cy="61" r="1.8"/><ellipse class="k" cx="37" cy="70" rx="3" ry="2.4"/>
<path class="o f" d="M0 78q8-6 16-2t14 0 16-2c6 0 10-5 18-5 10 0 14 7 22 7s10-3 14-3V100H0z"/>
<path class="i" d="M62 75c4-7 14-7 16-1-4-3-8-2-9 3"/><path class="t" d="M8 88h10M30 92h14M58 88h12M80 93h10"/>
<path class="h" d="M4 83q6-4 12-2"/><path class="i" d="M72 56h12M76 63h16"/><circle class="i" cx="88" cy="48" r="2"/><circle class="i" cx="82" cy="42" r="1.3"/>
<path class="o f" d="M6 18q4 6 0 9q-4-3 0-9z"/><path class="o f" d="M20 8q3 5 0 7q-3-2 0-7z"/><circle class="i" cx="26" cy="72" r="1.6"/><circle class="i" cx="22" cy="66" r="1.1"/>
${spark(86, 22, 6)}${spark(72, 10, 3.5)}`,
  },
  // A grand piano with the lid propped open: fallboard and music desk, white and black keys, a
  // shaded rim on three legs, pedals in the signal, notes floating off.
  piano: {
    label: 'piano',
    art: `<path class="o f" d="M34 42L76 10C88 4 98 10 94 22L90 42z"/><path class="h" d="M44 36L74 14"/><path class="i" d="M74 42l8-24"/>
<path class="o g" d="M8 42H86C98 42 100 58 88 60H8z"/><path class="t" d="M70 46l-3 10M76 46l-3 12M82 46l-3 12M88 47l-3 10"/>
<path class="o f" d="M10 24l22-4v10l-22 4z"/><path class="t" d="M14 27l14-2.6M14 30.6l14-2.6"/>
<path class="o f" d="M2 34h38v9H2z"/><path class="i" d="M7 34v9M12 34v9M17 34v9M22 34v9M27 34v9M32 34v9M37 34v9"/>
<path class="k" d="M5.5 34h3v5h-3zM10.5 34h3v5h-3zM20.5 34h3v5h-3zM25.5 34h3v5h-3zM30.5 34h3v5h-3z"/>
<path class="o g" d="M12 60h8l-2 26h-5zM76 60h8l-2 26h-5zM46 60h7l-2 20h-4z"/><path class="o a" d="M25 68h12v5H25z"/><path class="i" d="M28 73v6M34 73v6"/>
<ellipse class="k" cx="62" cy="84" rx="4.4" ry="3.2" transform="rotate(-20 62 84)"/><path class="i" d="M66 82.6V66q7 2 7 9"/>
<ellipse class="o a" cx="88" cy="74" rx="3.6" ry="2.6" transform="rotate(-20 88 74)"/><path class="i" d="M91.2 72.8V60"/>
${spark(8, 10, 5)}${spark(10, 92, 4)}`,
  },
  // A hard-shell cabin case: telescoping handle, ribbed shell with a shaded side and a shine, a
  // strap in the signal, two wheels, a luggage tag, and a paper plane looping away.
  travelling: {
    label: 'travelling',
    art: `<path class="o" d="M40 30V12h20v18"/><path class="o f" d="M36 6h28v7H36z"/>
<rect class="o f" x="20" y="30" width="58" height="56" rx="10"/><path class="g" d="M66 31.4h2a8.6 8.6 0 0 1 8.6 8.6v36a8.6 8.6 0 0 1-8.6 8.6h-2c3-18 3-35 0-53z"/>
<path class="i" d="M34 33q-2 25 0 50M49 33v50M64 33q2 25 0 50"/><path class="t" d="M70 40l4-2M70 48l4-2M70 70l4-2M70 78l4-2"/>
<path class="h" d="M26 38v14M26 58v4"/>
<path class="o a" d="M20 55h58v9H20z"/><path class="o g" d="M45 53h8v13h-8z"/>
<circle class="o k" cx="31" cy="90" r="5"/><circle class="o k" cx="67" cy="90" r="5"/><circle class="h" cx="30" cy="89" r=".6"/>
<path class="i" d="M78 40q9 0 10 9"/><path class="o f" d="M82 49l10-2 2 13-10 2z"/><circle class="i" cx="87" cy="52" r="1.3"/>
<path class="i" d="M68 22q8-12 18-10" stroke-dasharray="2 4"/><path class="o f" d="M84 14l14-8-5 15-4-5z"/>
${spark(10, 20, 5)}${spark(12, 70, 3.5)}`,
  },
};
