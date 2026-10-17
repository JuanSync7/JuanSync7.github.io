import { useEffect, useRef, useState, type RefObject } from 'react';
import { loadFigure } from '../figures/registry';
import { follow } from '../figures/kit/motion';
import type { Figure, FigureInstance, FrameInput } from '../figures/types';

/** The one clock every figure runs on. It owns time, the pointer, sizing, offscreen sleep
 *  and reduced motion, so figures never touch timers or listeners themselves.
 *
 *  Still mode (reduced motion, or a frozen capture for the audit) simulates the figure from
 *  0 to the rest time in fixed steps and shows that frame, so a still is the same picture
 *  the live figure reaches. The canvas carries data-* attributes the audit reads. */

export const REST_T = 1.2;
const STEP = 1 / 60;
const DPR_CAP = 2;

export interface LoopOptions {
  id: string;
  freezeAt?: number;
  pointerAt?: readonly [number, number];
  fixtures?: boolean;
  onReadout?: (text: string) => void;
  /** Handed to the figure every frame as `data`. Changing it redraws, never remounts. */
  data?: unknown;
}

export function useFigureLoop(ref: RefObject<HTMLCanvasElement>, o: LoopOptions): Figure | null {
  const [figure, setFigure] = useState<Figure | null>(null);
  // Read by the running loop on every frame, so new data reaches the figure without
  // tearing the loop down.
  const dataRef = useRef<unknown>(o.data);
  dataRef.current = o.data;
  const readRef = useRef(o.onReadout);
  readRef.current = o.onReadout;
  const { id, freezeAt, fixtures } = o;
  const px = o.pointerAt?.[0];
  const py = o.pointerAt?.[1];

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    let inst: FigureInstance | null = null;
    let disposed = false;
    let raf = 0;
    let last = 0;
    let t = 0;
    let hover = 0;
    let visible = true;
    let readout = '';
    let frames = 0;
    let sum = 0;
    let max = 0;
    const frozen = freezeAt !== undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const still = frozen || reduced;
    const pointer = { x: px ?? 0.5, y: py ?? 0.5, active: px !== undefined };
    const pulses: { x: number; y: number; born: number }[] = [];
    const cleanups: (() => void)[] = [];
    let size: [number, number, number] | null = null;
    // A figure that throws is stopped, not retried sixty times a second: the error is on the
    // canvas for the audit, and the loop does no more work.
    let broken = false;

    const fail = (err: unknown): void => {
      broken = true;
      canvas.dataset.error = err instanceof Error ? err.message : String(err);
      console.error(`figure ${id}:`, err);
    };
    const input = (dt: number): FrameInput => {
      hover = still ? (pointer.active ? 1 : 0) : follow(hover, pointer.active ? 1 : 0, dt, 6);
      while (pulses.length > 0 && t - (pulses[0]?.born ?? t) > 2) pulses.shift();
      const ps = pulses.map((p) => ({ x: p.x, y: p.y, age: t - p.born }));
      return { t, dt, hover, pointer: { ...pointer }, pulses: ps, still, data: dataRef.current };
    };
    const draw = (dt: number): void => {
      if (!inst || broken) return;
      const s = performance.now();
      let r: string | void;
      try {
        r = inst.frame(input(dt));
      } catch (err) {
        fail(err);
        return;
      }
      const ms = performance.now() - s;
      frames += 1;
      sum += ms;
      max = Math.max(max, ms);
      if (frames % 15 === 0 || still) {
        canvas.dataset.frames = String(frames);
        canvas.dataset.msAvg = (sum / frames).toFixed(2);
        canvas.dataset.msMax = max.toFixed(2);
      }
      if (typeof r === 'string' && r !== readout) {
        readout = r;
        canvas.dataset.readout = r;
        readRef.current?.(r);
      }
    };
    const settle = (): void => {
      // Start from fresh state every time: settle runs on each resize and each time the
      // canvas comes into view, and a figure that accumulates (a scroll, a drift) would
      // otherwise carry the last simulation into this one and the still would not repeat.
      if (size) inst?.resize(size[0], size[1], size[2]);
      t = 0;
      frames = 0;
      sum = 0;
      max = 0;
      const steps = Math.round((freezeAt ?? REST_T) / STEP);
      for (let i = 0; i < steps && !broken; i++) {
        t += STEP;
        draw(STEP);
      }
      canvas.dataset.ready = '1';
    };
    const tick = (now: number): void => {
      if (!visible || disposed) {
        raf = 0;
        return;
      }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : STEP;
      last = now;
      t += dt;
      draw(dt);
      canvas.dataset.ready = '1';
      raf = broken ? 0 : requestAnimationFrame(tick);
    };
    const start = (): void => {
      if (still) settle();
      else if (!raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    const listen = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void): void => {
      canvas.addEventListener(type, fn);
      cleanups.push(() => canvas.removeEventListener(type, fn));
    };

    loadFigure(id, fixtures)
      .then((fig) => {
        if (disposed) return;
        inst = fig.mount(canvas);
        canvas.dataset.kind = fig.kind;
        setFigure(fig);
        const ro = new ResizeObserver(() => {
          const r = canvas.getBoundingClientRect();
          size = [r.width, r.height, Math.min(window.devicePixelRatio || 1, DPR_CAP)];
          inst?.resize(size[0], size[1], size[2]);
          if (still) settle();
        });
        ro.observe(canvas);
        cleanups.push(() => ro.disconnect());
        const io = new IntersectionObserver((es) => {
          visible = es.some((e) => e.isIntersecting);
          if (visible) start();
        });
        io.observe(canvas);
        cleanups.push(() => io.disconnect());
        if (frozen) return;
        const at = (e: PointerEvent): void => {
          const r = canvas.getBoundingClientRect();
          pointer.x = (e.clientX - r.left) / Math.max(1, r.width);
          pointer.y = (e.clientY - r.top) / Math.max(1, r.height);
        };
        listen('pointermove', (e) => {
          at(e);
          pointer.active = true;
          if (reduced) draw(0);
        });
        listen('pointerleave', () => {
          pointer.active = false;
          if (reduced) draw(0);
        });
        listen('pointerdown', (e) => {
          at(e);
          // Under reduced motion time stands still, so a pulse would never age out; there is
          // no animation to show it anyway.
          if (reduced) return;
          pulses.push({ x: pointer.x, y: pointer.y, born: t });
        });
      })
      .catch(fail);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanups.forEach((fn) => fn());
      inst?.dispose();
    };
  }, [ref, id, freezeAt, fixtures, px, py]);

  return figure;
}
