/** Hand-inked sticker art for the home page's off-hours board: each is SVG markup on a
 *  100 x 100 grid, drawn with three classes only (`i` ink line, `f` paper fill, `g` second
 *  fill, `a` the signal) so the colours come from the sticker tokens. `Sticker.astro` adds the
 *  wobble and the die-cut border. */
export type StickerKind = 'frisbee' | 'badminton' | 'swimming' | 'piano' | 'travelling';

export const STICKERS: Record<StickerKind, { label: string; art: string }> = {
  frisbee: {
    label: 'ultimate frisbee',
    art: `<ellipse class="i g" cx="50" cy="56" rx="38" ry="15"/><ellipse class="i f" cx="50" cy="50" rx="38" ry="15"/>
<ellipse class="i a" cx="50" cy="50" rx="25" ry="8"/><ellipse class="i" cx="50" cy="50" rx="14" ry="4"/>
<path class="i" d="M12 50c0 6 8 12 20 14M88 50c0 6-8 12-20 14"/><path class="i" d="M8 22l16 4M4 34l14 2M12 12l12 6"/>`,
  },
  badminton: {
    label: 'badminton',
    art: `<path class="i f" d="M50 62L28 14l10-4 12 30 12-30 10 4z"/><path class="i" d="M38 12l12 30M62 12L50 42M45 12l5 30M55 12l-5 30M33 30h34M39 46h22"/>
<path class="i a" d="M26 16h48"/><path class="i g" d="M34 62c0-8 32-8 32 0 0 10-6 22-16 22S34 72 34 62z"/><path class="i" d="M40 68h20M42 76h16"/>`,
  },
  swimming: {
    label: 'swimming',
    art: `<path class="i" d="M10 40C28 22 72 22 90 40"/><circle class="i f" cx="34" cy="52" r="16"/><circle class="i f" cx="66" cy="52" r="16"/>
<circle class="i a" cx="34" cy="52" r="9"/><circle class="i a" cx="66" cy="52" r="9"/><path class="i" d="M50 50v4M18 48l-8 4M82 48l8 4"/>
<path class="i" d="M8 78q8-8 16 0t16 0 16 0 16 0 16 0"/><path class="i" d="M16 90q8-8 16 0t16 0 16 0 16 0"/>`,
  },
  piano: {
    label: 'piano',
    art: `<rect class="i g" x="8" y="22" width="84" height="56" rx="5"/><rect class="i f" x="12" y="34" width="76" height="40"/>
<path class="i" d="M24 34v40M36 34v40M48 34v40M60 34v40M72 34v40"/><rect class="i" x="20" y="34" width="8" height="24"/><rect class="i" x="32" y="34" width="8" height="24"/>
<rect class="i" x="56" y="34" width="8" height="24"/><rect class="i" x="68" y="34" width="8" height="24"/><rect class="i a" x="42" y="34" width="8" height="24"/><path class="i" d="M20 28h60"/>`,
  },
  travelling: {
    label: 'travelling',
    art: `<path class="i" d="M38 28v-8h24v8"/><rect class="i f" x="12" y="28" width="76" height="56" rx="8"/><path class="i" d="M32 28v56M68 28v56"/>
<path class="i a" d="M12 44h76"/><circle class="i g" cx="50" cy="62" r="11"/><path class="i" d="M44 62l12-4M50 51v22M24 90v-6M76 90v-6"/>`,
  },
};
