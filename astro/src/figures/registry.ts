import { parseInstanceId, type Template } from './defineTemplate';
import type { Figure } from './types';

/** Every file directly in this folder (other than the support files listed below) is a
 *  figure, and every file in `templates/` is a template, each loaded only when a page shows
 *  it. Ids are file names, which the audit checks, so there is no hand-kept list to drift.
 *  `<template>~<seed>` loads one instance of a template. */

const SUPPORT = new Set(['types', 'define', 'defineThree', 'defineTemplate', 'registry']);

type Loader<T> = () => Promise<{ default: T }>;

const modules = import.meta.glob<{ default: Figure }>('./*.ts');
const fixtureModules = import.meta.glob<{ default: Figure }>('./fixtures/*.ts');
const templateModules = import.meta.glob<{ default: Template }>('./templates/*.ts');
const fixtureTemplateModules = import.meta.glob<{ default: Template }>('./fixtures/templates/*.ts');

function byId<T>(mods: Record<string, Loader<T>>): Map<string, Loader<T>> {
  const out = new Map<string, Loader<T>>();
  for (const [path, load] of Object.entries(mods)) {
    const id = path.replace(/^.*\//, '').replace(/\.ts$/, '');
    if (!SUPPORT.has(id)) out.set(id, load);
  }
  return out;
}

const FIGURES = byId(modules);
const FIXTURES = byId(fixtureModules);
const TEMPLATES = byId(templateModules);
const FIXTURE_TEMPLATES = byId(fixtureTemplateModules);

export function figureIds(): string[] {
  return [...FIGURES.keys()].sort();
}

export function fixtureIds(): string[] {
  return [...FIXTURES.keys()].sort();
}

export function templateIds(): string[] {
  return [...TEMPLATES.keys()].sort();
}

/** Loads one template by id. Fixture templates are only found when asked for. */
export async function loadTemplate(id: string, withFixtures = false): Promise<Template> {
  const load = TEMPLATES.get(id) ?? (withFixtures ? FIXTURE_TEMPLATES.get(id) : undefined);
  if (!load) throw new Error(`no template called "${id}"`);
  return (await load()).default;
}

/** Loads one figure by id, or one template instance by `<template>~<seed>`. Fixtures
 *  (deliberately broken figures for the audit's self-test) are only found when asked for. */
export async function loadFigure(id: string, withFixtures = false): Promise<Figure> {
  const inst = parseInstanceId(id);
  if (inst) return (await loadTemplate(inst.template, withFixtures)).instance(inst.seed);
  const load = FIGURES.get(id) ?? (withFixtures ? FIXTURES.get(id) : undefined);
  if (!load) throw new Error(`no figure called "${id}"`);
  return (await load()).default;
}
