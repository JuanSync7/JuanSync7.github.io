import type { DtcgOptions } from '../lib/tokens';

/** The names the site's DTCG export carries: the files at /tokens/ (juansync.tokens.json and the
 *  rest), the resolver's name and description, and the $extensions key that leads a token back to
 *  its CSS. Read by the export (src/lib/site-tokens.ts) and by standards:check, so both check the
 *  same files. */
export const TOKEN_EXPORT: DtcgOptions = {
  name: 'juansync.dev',
  prefix: 'juansync',
  namespace: 'dev.juansync',
  description: 'The paper system on a light page or a dark one. Generated from the CSS tokens.',
};
