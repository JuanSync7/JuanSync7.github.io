import type { NightKey } from '../../styles/tokens/palette.ts';

/** The site's LEGO pieces take their colours from the night palette (recoloured by the page
 *  filter): the catalogue's `Tones`, which a project names, are its keys. */
declare module './legoset.ts' {
  // The merge itself is the point: the interface takes its members from the palette.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Tones extends Record<NightKey, true> {}
}
