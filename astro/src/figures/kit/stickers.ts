/** Hand-inked sticker art for the home page's off-hours board: each is SVG markup on a
 *  100 x 100 grid, drawn with four classes only (`i` ink line, `f` paper fill, `g` second
 *  fill, `a` the signal) so the colours come from the sticker tokens. `Sticker.astro` adds the
 *  wobble and the die-cut border. */
export type StickerKind = 'frisbee' | 'badminton' | 'swimming' | 'piano' | 'travelling';

export const STICKERS: Record<StickerKind, { label: string; art: string }> = {
  frisbee: {
    label: 'ultimate frisbee',
    art: `<path class="i" d="M2 20h24M0 30q18-8 34 0q8 4 0 10M8 42h20"/><path class="i" d="M2 20q0-6 6-4"/><path class="i" d="M62 24q12-12 28-6" stroke-dasharray="1 5"/>
<path class="i g" d="M12 58C12 80 88 80 88 58L92 52C92 30 8 30 8 52z"/><ellipse class="i f" cx="50" cy="52" rx="42" ry="17"/>
<ellipse class="i" cx="50" cy="52" rx="33" ry="12"/><ellipse class="i a" cx="50" cy="52" rx="21" ry="7.5"/><ellipse class="i f" cx="50" cy="52" rx="10" ry="3.2"/>
<path class="i" d="M22 44q12-8 30-9M62 36q14 2 22 9M16 64q6 8 18 11"/>`,
  },
  badminton: {
    label: 'badminton',
    art: `<path class="i f" d="M36 70L14 18Q50 4 86 18L64 70z"/><path class="i" d="M40 70L26 14M45 70L36 10M50 70V8M55 70L64 10M60 70L74 14"/>
<path class="i a" d="M15 20Q50 32 85 20"/><path class="i" d="M24 40Q50 48 76 40M30 56Q50 63 70 56"/><path class="i" d="M14 18q6-8 12-2t12-3 12 0 12 3 12 2 12-1"/>
<path class="i g" d="M35 70Q50 64 65 70Q68 90 50 94Q32 90 35 70z"/><path class="i" d="M40 76Q50 80 60 76M42 85Q50 88 58 85"/><path class="i" d="M88 56q6-14 0-28M94 62q8-18 0-40"/>`,
  },
  swimming: {
    label: 'swimming',
    art: `<path class="i g" d="M0 62q8-9 16 0t16 0 16 0 16 0 16 0 16 0V100H0z"/><circle class="i f" cx="28" cy="50" r="10"/>
<path class="i a" d="M18 49a10 10 0 0 1 20 0z"/><path class="i" d="M20 52h16M24 50v3M32 50v3"/><path class="i f" d="M36 58Q52 50 74 56L78 62Q54 64 34 66z"/>
<path class="i f" d="M40 56C46 24 74 20 86 42L80 46C72 32 58 34 52 58z"/><ellipse class="i f" cx="86" cy="44" rx="5" ry="3.4"/>
<path class="i" d="M10 62q8-9 16 0t16 0 16 0 16 0 16 0M0 76q8-9 16 0t16 0 16 0 16 0 16 0 16 0"/><circle class="i" cx="70" cy="22" r="1.8"/><circle class="i" cx="82" cy="26" r="1.8"/><circle class="i" cx="92" cy="34" r="1.6"/>
<path class="i" d="M82 62l6-6M88 64l8-4"/>`,
  },
  piano: {
    label: 'grand piano',
    art: `<path class="i f" d="M36 46L82 12L92 18L88 46z"/><path class="i" d="M72 46L82 24"/>
<path class="i g" d="M10 46H78C98 46 98 62 78 62H10z"/><rect class="i f" x="2" y="40" width="34" height="6"/><path class="i" d="M8 40v6M14 40v6M20 40v6M26 40v6M32 40v6"/>
<rect class="k" x="6" y="40" width="3" height="4"/><rect class="k" x="12" y="40" width="3" height="4"/><rect class="k" x="24" y="40" width="3" height="4"/><rect class="k" x="30" y="40" width="3" height="4"/>
<path class="i f" d="M8 30l22-4v10L8 38z"/><path class="i" d="M12 31l14-3"/>
<path class="i g" d="M12 62h7l-1 24h-5zM70 62h7l-1 24h-5zM42 62h7l-1 20h-5z"/><path class="i" d="M14 70H6M14 78H4"/><rect class="i a" x="22" y="68" width="10" height="5" rx="2"/><path class="i" d="M24 73v8M30 73v8"/>`,
  },
  travelling: {
    label: 'travelling',
    art: `<path class="i" d="M38 30V10M62 30V10M34 10h32"/><rect class="i f" x="20" y="30" width="60" height="54" rx="8"/>
<path class="i" d="M36 30v54M50 30v54M64 30v54"/><rect class="i a" x="20" y="54" width="60" height="9"/><rect class="i g" x="46" y="52" width="8" height="13" rx="2"/>
<path class="i g" d="M20 38l8-8M80 38l-8-8M20 76l8 8M80 76l-8 8"/><circle class="i g" cx="32" cy="90" r="5"/><circle class="i g" cx="68" cy="90" r="5"/>
<path class="i" d="M80 44q10 2 10 12"/><rect class="i f" x="84" y="56" width="10" height="14" rx="2"/><circle class="i" cx="89" cy="60" r="1.6"/>`,
  },
};
