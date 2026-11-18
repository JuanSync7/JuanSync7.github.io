import { readTokens, toDtcg } from './design-tokens';

/** The site's token files, read at build time. */
const files = import.meta.glob<string>(['/src/styles/tokens/*.css', '!/src/styles/tokens/index.css'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

export const SITE_TOKENS = readTokens(files);
export const SITE_DTCG = toDtcg(SITE_TOKENS);

/** The published DTCG files, by name under /tokens/. */
export const DTCG_FILES = {
  'juansync.tokens.json': SITE_DTCG.foundation,
  'juansync.light.tokens.json': SITE_DTCG.light,
  'juansync.dark.tokens.json': SITE_DTCG.dark,
  'juansync.resolver.json': SITE_DTCG.resolver,
} as const;
