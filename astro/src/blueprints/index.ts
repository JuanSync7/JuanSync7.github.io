import { BLOG_POST } from './blog-post';
import { HOME } from './home';
import { LAB } from './lab';
import { LEARN_ARTICLE } from './learn-article';
import { LEARN_INDEX } from './learn-index';
import { PAPER_ACTION } from './paper-action';
import { PAPER_FOOTER } from './paper-footer';
import { PAPER_NAV } from './paper-nav';
import { PIXEL_BUTTON } from './pixel-button';
import { PRESENTATION } from './presentation';
import { SECTION_HEAD } from './section-head';
import { STICKER } from './sticker';
import { TRACKER } from './tracker';
import { VAULT_GUIDE } from './vault-guide';
import { WRITING_INDEX } from './writing-index';
import type { Blueprint } from './types';

/** Every blueprint: shared components, the page chrome, then page templates. Add a spec file and
 *  list it here; `npm run blueprint:check` measures it and /lab/blueprints/ shows it. */
export const ALL: Blueprint[] = [
  PAPER_ACTION,
  PIXEL_BUTTON,
  SECTION_HEAD,
  STICKER,
  PAPER_NAV,
  PAPER_FOOTER,
  HOME,
  BLOG_POST,
  LEARN_ARTICLE,
  WRITING_INDEX,
  LEARN_INDEX,
  PRESENTATION,
  VAULT_GUIDE,
  TRACKER,
  LAB,
];
export const BLUEPRINTS: Record<string, Blueprint> = Object.fromEntries(ALL.map((b) => [b.id, b]));
export type { Blueprint, Measure, Part, Size, Sizing } from './types';
