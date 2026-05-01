import { useEffect, useRef } from 'react';
import type { Line, ScriptStep } from './terminal-data';

export function useAutoTyping(
  visible: boolean,
  script: ScriptStep[],
  setLines: (updater: (prev: Line[]) => Line[]) => void,
  onComplete: () => void,
) {
  const hasTyped = useRef(false);

  useEffect(() => {
    if (!visible || hasTyped.current) return;
    hasTyped.current = true;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timers.push(t);
    };

    let lineIdx = 0;
    let charIdx = 0;
    const current: Line[] = [];

    const typeNext = () => {
      if (lineIdx >= script.length) {
        onComplete();
        return;
      }
      const item = script[lineIdx];
      if (item.type === 'cmd') {
        const cmd = item.text;
        charIdx = 0;
        const typeChar = () => {
          charIdx++;
          const partial = cmd.substring(0, charIdx);
          setLines(() => [...current, { type: 'cmd-typing', text: partial }]);
          if (charIdx < cmd.length) {
            schedule(typeChar, 30 + Math.random() * 50);
          } else {
            current.push({ type: 'cmd', text: cmd });
            setLines(() => [...current]);
            lineIdx++;
            schedule(typeNext, 200);
          }
        };
        schedule(typeChar, 400);
      } else {
        current.push(item);
        setLines(() => [...current]);
        lineIdx++;
        schedule(typeNext, 300);
      }
    };
    schedule(typeNext, 600);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [visible, script, setLines, onComplete]);
}
