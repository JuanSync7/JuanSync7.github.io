import { defineCanvasFigure } from './define';
import { mulberry32, type Rng } from './kit/rng';
import type { CanvasEnv, CanvasFrame, Figure, FigureMeta } from './types';

/** Templates: figures that are drawn from a seed. Three things make each instance:
 *
 *  - the **seed**, which the grammar turns into discrete choices (which object, how many
 *    layers, which camera, which way it moves);
 *  - **noise**, seeded the same way, for smooth variation in space and over time;
 *  - the **grammar** itself: the template's rules for which choices go together, so every
 *    seed is a deliberate picture rather than a random one.
 *
 *  An instance is named `<template>~<seed>` and works anywhere a figure id does. */

export interface TemplateEnv<P> extends CanvasEnv {
  params: P;
}

export interface TemplateFrame<P, S> extends CanvasFrame<S> {
  params: P;
}

export interface TemplateSpec<P, S> extends Omit<FigureMeta, 'group' | 'seed' | 'alt' | 'title'> {
  title: string;
  /** Seed → the instance's structure. Draw every discrete choice here, from `rng`. */
  grammar(rng: Rng): P;
  /** One to three words naming the variant ("car", "spiral vortex"), shown in the catalog. */
  name(params: P): string;
  /** What a screen-reader user should know this instance shows. */
  alt(params: P): string;
  setup(env: TemplateEnv<P>): S;
  draw(frame: TemplateFrame<P, S>): string | void;
}

export interface Instance extends Figure {
  template: string;
  variant: string;
}

export interface Template extends Omit<FigureMeta, 'group' | 'seed' | 'alt'> {
  kind: 'template';
  instance(seed: number): Instance;
}

/** The grammar's own stream, salted so its choices don't mirror the drawing's rng. */
const GRAMMAR_SALT = 0x9e3779b9;

export function defineTemplate<P, S>(spec: TemplateSpec<P, S>): Template {
  const { grammar, name, alt, setup, draw, ...meta } = spec;
  return {
    ...meta,
    kind: 'template',
    instance(seed: number): Instance {
      const s = Math.abs(Math.trunc(seed)) >>> 0;
      const params = grammar(mulberry32((s ^ GRAMMAR_SALT) >>> 0));
      const variant = name(params);
      const figure = defineCanvasFigure<S>({
        ...meta,
        id: `${spec.id}~${s}`,
        title: `${spec.title} · ${variant}`,
        alt: alt(params),
        group: 'template',
        seed: s,
        setup: (env) => setup({ ...env, params }),
        draw: (frame) => draw({ ...frame, params }),
      });
      return { ...figure, template: spec.id, variant };
    },
  };
}

/** Splits `<template>~<seed>`; null for a plain figure id. */
export function parseInstanceId(id: string): { template: string; seed: number } | null {
  const m = /^([a-z0-9]+(?:-[a-z0-9]+)*)~(0|[1-9]\d{0,8})$/.exec(id);
  return m && m[1] && m[2] ? { template: m[1], seed: Number(m[2]) } : null;
}
