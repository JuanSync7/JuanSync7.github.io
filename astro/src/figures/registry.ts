import type { Figure } from './types';

/** Every file directly in this folder (other than the support files listed below) is a
 *  figure, loaded only when a page shows it. A figure's id is its file name, which the
 *  audit checks, so there is no hand-kept list to drift. */

const SUPPORT = new Set(['types', 'define', 'defineThree', 'registry']);

type Loader = () => Promise<{ default: Figure }>;

const modules = import.meta.glob<{ default: Figure }>('./*.ts');
const fixtureModules = import.meta.glob<{ default: Figure }>('./fixtures/*.ts');

function byId(mods: Record<string, Loader>): Map<string, Loader> {
  const out = new Map<string, Loader>();
  for (const [path, load] of Object.entries(mods)) {
    const id = path.replace(/^.*\//, '').replace(/\.ts$/, '');
    if (!SUPPORT.has(id)) out.set(id, load);
  }
  return out;
}

const FIGURES = byId(modules);
const FIXTURES = byId(fixtureModules);

export function figureIds(): string[] {
  return [...FIGURES.keys()].sort();
}

export function fixtureIds(): string[] {
  return [...FIXTURES.keys()].sort();
}

/** Loads one figure by id. Fixtures (deliberately broken figures for the audit's
 *  self-test) are only found when asked for. */
export async function loadFigure(id: string, withFixtures = false): Promise<Figure> {
  const load = FIGURES.get(id) ?? (withFixtures ? FIXTURES.get(id) : undefined);
  if (!load) throw new Error(`no figure called "${id}"`);
  const mod = await load();
  return mod.default;
}
