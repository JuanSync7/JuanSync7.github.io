import { catalogue, type Row } from './catalogue';
import { ALL } from './index';

/** The translator's index for this site, built when the page builds (Vite reads the files). */
const strip = (r: Record<string, string>): Record<string, string> => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.slice(1), v])); // prettier-ignore
const tokenFiles = import.meta.glob<string>('/src/styles/tokens/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const sources = import.meta.glob<string>(
  ['/src/components/**/*.{css,astro,tsx}', '/src/styles/*.css', '/src/layouts/*.astro', '/src/pages/**/*.astro'],
  { query: '?raw', import: 'default', eager: true },
);
const specs = import.meta.glob<string>('/src/blueprints/*.ts', { query: '?raw', import: 'default', eager: true });

export const ROWS: Row[] = catalogue(ALL, strip(tokenFiles), strip(sources));
export const specSource = (id: string): string =>
  Object.entries(specs).find(([, text]) => text.includes(`id: '${id}'`))?.[1] ?? '';
export const specFile = (id: string): string => (Object.entries(specs).find(([, text]) => text.includes(`id: '${id}'`))?.[0] ?? '').slice(1); // prettier-ignore
