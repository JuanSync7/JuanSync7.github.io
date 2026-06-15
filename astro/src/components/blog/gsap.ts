export type GsapTarget = Element | ArrayLike<Element> | string | null | undefined;
export type GsapVars = Record<string, unknown>;

export interface GsapTimeline {
  fromTo(target: GsapTarget, from: GsapVars, to: GsapVars, position?: string): GsapTimeline;
  to(target: GsapTarget, vars: GsapVars, position?: string): GsapTimeline;
}
export interface GsapContext {
  revert(): void;
}
export interface GsapApi {
  fromTo(target: GsapTarget, from: GsapVars, to: GsapVars): void;
  to(target: GsapTarget, vars: GsapVars): void;
  timeline(vars?: GsapVars): GsapTimeline;
  registerPlugin(...plugins: unknown[]): void;
  context(fn: () => void, scope?: GsapTarget): GsapContext;
}

declare global {
  interface Window {
    gsap?: GsapApi;
    ScrollTrigger?: unknown;
  }
}

export const getGsap = (): GsapApi | undefined =>
  typeof window !== 'undefined' ? window.gsap : undefined;

export const getScrollTrigger = (): unknown =>
  typeof window !== 'undefined' ? window.ScrollTrigger : undefined;

let registered = false;
export function ensureScrollTrigger(): void {
  if (registered) return;
  const g = getGsap();
  const st = getScrollTrigger();
  if (g && st) {
    g.registerPlugin(st);
    registered = true;
  }
}
