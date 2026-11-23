import { TOKEN_EXPORT } from '../data/token-export';
import { readTokens, toDtcg } from './tokens';

/** The site's token files, read at build time. */
const files = import.meta.glob<string>(['/src/styles/tokens/*.css', '!/src/styles/tokens/index.css'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

export const SITE_TOKENS = readTokens(files);
export const SITE_DTCG = toDtcg(SITE_TOKENS, TOKEN_EXPORT);

/** The published DTCG files, by name under /tokens/. */
export const DTCG_FILES = SITE_DTCG.files;
