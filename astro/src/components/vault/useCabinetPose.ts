import { useEffect, useRef, useState, type RefObject } from 'react';
import type { gsap } from 'gsap';
import { DEFAULT_CABINET_POSE, type CabinetPose } from '../../figures/vault-cabinet';
import { readMotionToken } from '../presentation/motion-values';

interface MovingPose { drawer: number; selected: number; lift0: number; lift1: number; lift2: number }

export function useCabinetPose(root: RefObject<HTMLDivElement>) {
  const [pose, setPose] = useState<CabinetPose>(DEFAULT_CABINET_POSE);
  const [reduced, setReduced] = useState(false);
  const choose = useRef<(index: number | null) => void>(() => {});
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const style = getComputedStyle(element);
    const duration = readMotionToken(style, '--vc-folder-duration', ['ms', 's']);
    const restingLift = readMotionToken(style, '--vc-story-lift', ['%']) / 100;
    const moving: MovingPose = { drawer: DEFAULT_CABINET_POSE.drawer, selected: 1, lift0: 0, lift1: 0, lift2: 0 };
    let engine: typeof gsap | undefined;
    let context: gsap.Context | undefined;
    let disposed = false;
    let manual: number | null = null;
    let progress = Math.max(0, Math.min(1, Number(element.dataset.cabinetProgress) || 0));
    let story = Math.min(2, Math.floor(progress * 3));
    const emit = () => {
      if (disposed) return;
      const next = { drawer: moving.drawer, selected: moving.selected, lifts: [moving.lift0, moving.lift1, moving.lift2] };
      setPose(next);
      element.dataset.cabinetFolder = String(next.selected);
      element.dataset.cabinetDrawer = next.drawer.toFixed(3);
      element.dataset.cabinetLift = Math.max(...next.lifts).toFixed(3);
    };
    const select = (index: number) => {
      moving.selected = index;
      const height = manual === null ? restingLift : 1;
      const target = { lift0: index === 0 ? height : 0, lift1: index === 1 ? height : 0, lift2: index === 2 ? height : 0 };
      if (engine && context) context.add(() => {
        engine?.to(moving, { ...target, duration: preference.matches ? 0 : duration, ease: 'power3.out', overwrite: 'auto', onUpdate: emit });
      });
      else { Object.assign(moving, target); emit(); }
      emit();
    };
    choose.current = (index) => { manual = index; select(index ?? story); };
    const scroll = (event: Event) => {
      if (!(event instanceof CustomEvent) || typeof event.detail !== 'number') return;
      progress = Math.max(0, Math.min(1, event.detail));
      moving.drawer = preference.matches ? 1 : DEFAULT_CABINET_POSE.drawer + (1 - DEFAULT_CABINET_POSE.drawer) * progress;
      const next = Math.min(2, Math.floor(progress * 3));
      if (next !== story) { story = next; if (manual === null) select(story); }
      emit();
    };
    const changed = () => {
      setReduced(preference.matches);
      moving.drawer = preference.matches ? 1 : DEFAULT_CABINET_POSE.drawer + (1 - DEFAULT_CABINET_POSE.drawer) * progress;
      select(manual ?? story);
    };
    changed();
    element.addEventListener('vault:cabinet-progress', scroll);
    preference.addEventListener('change', changed);
    void import('gsap').then(({ gsap: loaded }) => {
      if (disposed) return;
      engine = loaded;
      context = loaded.context(() => {}, element);
      select(manual ?? story);
    });
    return () => {
      disposed = true;
      context?.revert();
      element.removeEventListener('vault:cabinet-progress', scroll);
      preference.removeEventListener('change', changed);
      choose.current = () => {};
    };
  }, [root]);
  return { pose, reduced, choose: (index: number | null) => choose.current(index) };
}
