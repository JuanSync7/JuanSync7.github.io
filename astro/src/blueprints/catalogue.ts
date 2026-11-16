import type { Blueprint, Measure } from './types';

/** The translator's index: one row per size of every blueprint, saying in plain words which part
 *  and which measure it is, the one token that sets it, where that token is defined (file and
 *  line), what it resolves through, and who else reads it (the blast radius of a change). A
 *  request like "make part 3's gap smaller" resolves to exactly one row, or the agent asks.
 *  Pure: it takes file texts, so the lab page (at build) and `npm run blueprint:index` share it. */

export interface Row {
  blueprint: string;
  title: string;
  part: number;
  partName: string;
  aliases: string[];
  measure: Measure;
  token: string;
  /** Where the token is defined, e.g. 'src/styles/tokens/paper.css:132'. */
  defined: string;
  /** The token's value and what it resolves through: ['var(--hf-space-5)', '20px']. */
  chain: string[];
  /** Other blueprints that size something with the same token. */
  sharedWith: string[];
  /** Source files (outside tokens) that read the token. */
  readBy: string[];
}

export const MEASURE_WORDS: Record<Measure, string> = {
  width: 'width',
  'max-width': 'widest width',
  height: 'height',
  'min-height': 'least height',
  'padding-x': 'padding across',
  'padding-y': 'padding down',
  gap: 'gap',
  border: 'line width',
  radius: 'corner radius',
  'edge-x': 'printed edge across',
  'edge-y': 'printed edge down',
  'font-size': 'type size',
};

interface Def {
  file: string;
  line: number;
  value: string;
}

/** The first definition of each token in the token files (the root value, not a theme override). */
export function definitions(files: Record<string, string>): Map<string, Def> {
  const defs = new Map<string, Def>();
  for (const [file, text] of Object.entries(files)) {
    text.split('\n').forEach((l, i) => {
      for (const m of l.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
        const [name, value] = [m[1] ?? '', (m[2] ?? '').trim()];
        if (!defs.has(name)) defs.set(name, { file, line: i + 1, value });
      }
    });
  }
  return defs;
}

function chain(token: string, defs: Map<string, Def>): string[] {
  const out: string[] = [];
  let at = defs.get(token)?.value;
  for (let i = 0; at !== undefined && i < 6; i++) {
    out.push(at);
    const next = /^var\((--[\w-]+)\)$/.exec(at)?.[1];
    at = next ? defs.get(next)?.value : undefined;
  }
  return out;
}

export function catalogue(
  specs: Blueprint[],
  tokenFiles: Record<string, string>,
  sources: Record<string, string>,
): Row[] {
  const defs = definitions(tokenFiles);
  return specs.flatMap((b) =>
    b.sizes.map((s) => {
      const part = b.parts.find((p) => p.id === s.part);
      const def = defs.get(s.token);
      const read = new RegExp(`var\\(${s.token}[,)]`);
      return {
        blueprint: b.id,
        title: b.title,
        part: s.part,
        partName: part?.name ?? `${s.part}`,
        aliases: part?.aliases ?? [],
        measure: s.measure,
        token: s.token,
        defined: def ? `${def.file}:${def.line}` : 'not defined in the token files',
        chain: chain(s.token, defs),
        sharedWith: specs.filter((o) => o.id !== b.id && o.sizes.some((x) => x.token === s.token)).map((o) => o.id),
        readBy: Object.entries(sources)
          .filter(([, text]) => read.test(text))
          .map(([f]) => f),
      };
    }),
  );
}
