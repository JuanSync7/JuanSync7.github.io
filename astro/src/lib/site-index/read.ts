/** Reading what a built page says about itself: its title, description and whether it is a tool or
 *  only forwards. The site writes its own HTML, so a plain reading of the head is enough. */

/** The names the site signs its titles with; a title's label is what is left without them. */
const BRANDS = new Set(['juan kok', 'juan.kok', 'juan_kok']);

const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function decode(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] !== '#') return NAMED[code.toLowerCase()] ?? whole;
    const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return Number.isFinite(n) ? String.fromCodePoint(n) : whole;
  });
}

const first = (html: string, pattern: RegExp): string => decode(pattern.exec(html)?.[1]?.trim() ?? '');

export interface PageHead {
  title: string;
  description: string;
  /** <meta name="robots" content="noindex">: a tool, not a page to offer a reader. */
  tool: boolean;
  /** A page that only sends the reader on (an old address); it is not part of the site's shape. */
  forwards: boolean;
}

export function readHead(html: string): PageHead {
  return {
    title: first(html, /<title>([^<]*)<\/title>/i),
    description: first(html, /<meta name="description" content="([^"]*)"/i),
    tool: /<meta name="robots" content="[^"]*noindex/i.test(html),
    forwards: /<meta http-equiv="refresh"/i.test(html),
  };
}

/** The title without the site's name: 'Blueprints · Lab · Juan Kok' reads 'Blueprints'. The home page
 *  is 'Home'; a file is named by its file name. */
export function labelOf(path: string, title: string): string {
  if (path === '/') return 'Home';
  const parts = title
    .split(/\s+[·—]\s+/)
    .map((part) => part.trim())
    .filter((part) => part && !BRANDS.has(part.toLowerCase()));
  return parts[0] ?? path.split('/').filter(Boolean).pop() ?? path;
}
