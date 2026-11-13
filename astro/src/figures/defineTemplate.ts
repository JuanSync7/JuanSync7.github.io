import { defineCanvasFigure } from './define';
import type { defineThreeFigure, ThreeEnv, ThreeFrame } from './defineThree';
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

interface TemplateMeta<P> extends Omit<FigureMeta, 'group' | 'seed' | 'alt' | 'title'> {
  title: string;
  /** Seed → the instance's structure. Draw every discrete choice here, from `rng`. */
  grammar(rng: Rng): P;
  /** One to three words naming the variant ("car", "spiral vortex"), shown in the catalog. */
  name(params: P): string;
  /** What a screen-reader user should know this instance shows. */
  alt(params: P): string;
}

export interface TemplateSpec<P, S, T = S> extends TemplateMeta<P> {
  setup(env: TemplateEnv<P>): S;
  draw(frame: TemplateFrame<P, S>): string | void;
  /** GPU templates supply their renderer so canvas templates keep a light bundle. */
  three?: {
    renderer: typeof defineThreeFigure;
    build(env: ThreeEnv & { params: P }): T;
    update(frame: ThreeFrame<T> & { params: P }): string | void;
  };
}

export interface ThreeTemplateSpec<P, S> extends TemplateMeta<P> {
  style: 'three';
  /** Supplied by the 3D template so canvas templates do not download Three.js. */
  renderer: typeof defineThreeFigure;
  build(env: ThreeEnv & { params: P }): S;
  update(frame: ThreeFrame<S> & { params: P }): string | void;
  fallback(frame: CanvasFrame<null> & { params: P }): string | void;
}

export interface Instance extends Figure {
  template: string;
  variant: string;
  /** Seeded grammar output for inspectable/replayable template diagnostics. */
  params: unknown;
}

export interface Template extends Omit<FigureMeta, 'group' | 'seed' | 'alt'> {
  kind: 'template';
  instance(seed: number): Instance;
}

/** The grammar's own stream, salted so its choices don't mirror the drawing's rng. */
const GRAMMAR_SALT = 0x9e3779b9;

export function defineTemplate<P, S>(spec: ThreeTemplateSpec<P, S>): Template;
export function defineTemplate<P, S, T = S>(spec: TemplateSpec<P, S, T>): Template;
export function defineTemplate<P, S, T = S>(spec: TemplateSpec<P, S, T> | ThreeTemplateSpec<P, S>): Template {
  const { grammar, name, alt, ...rest } = spec;
  // Keep renderer callbacks off the catalog metadata for either kind of template.
  const { id, title, idea, style, motion, answers, aspect, bleed } = rest;
  const meta = { id, title, idea, style, motion, answers, aspect, bleed };
  return {
    ...meta,
    kind: 'template',
    instance(seed: number): Instance {
      const s = Math.abs(Math.trunc(seed)) >>> 0;
      const params = grammar(mulberry32((s ^ GRAMMAR_SALT) >>> 0));
      const variant = name(params);
      const instanceMeta: FigureMeta = {
        ...meta,
        id: `${spec.id}~${s}`,
        title: `${spec.title} · ${variant}`,
        alt: alt(params),
        group: 'template',
        seed: s,
      };
      let figure: Figure;
      if ('build' in spec) {
        figure = spec.renderer<S>({
          ...instanceMeta,
          build: (env) => spec.build({ ...env, params }),
          update: (frame) => spec.update({ ...frame, params }),
          fallback: (frame) => spec.fallback({ ...frame, params }),
        });
      } else {
        const gpu = spec.three;
        let fallbackState: S | undefined;
        figure = gpu
          ? gpu.renderer<T>({
              ...instanceMeta,
              build: (env) => gpu.build({ ...env, params }),
              update: (frame) => gpu.update({ ...frame, params }),
              fallback: (frame) => {
                fallbackState ??= spec.setup({ ...frame, params });
                return spec.draw({ ...frame, params, state: fallbackState });
              },
            })
          : defineCanvasFigure<S>({
              ...instanceMeta,
              setup: (env) => spec.setup({ ...env, params }),
              draw: (frame) => spec.draw({ ...frame, params }),
            });
      }
      return { ...figure, template: spec.id, variant, params };
    },
  };
}

/** Splits `<template>~<seed>`; null for a plain figure id. */
export function parseInstanceId(id: string): { template: string; seed: number } | null {
  const m = /^([a-z0-9]+(?:-[a-z0-9]+)*)~(0|[1-9]\d{0,8})$/.exec(id);
  return m && m[1] && m[2] ? { template: m[1], seed: Number(m[2]) } : null;
}
