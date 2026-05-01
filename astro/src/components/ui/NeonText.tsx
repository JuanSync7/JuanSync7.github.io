import { useEffect, useState, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function NeonText({ children }: Props) {
  const [flicker, setFlicker] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const set = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timers.push(t);
    };

    const loop = () => {
      set(() => {
        setFlicker(true);
        const dur = 50 + Math.random() * 150;
        set(() => {
          setFlicker(false);
          if (Math.random() > 0.5) {
            set(() => {
              setFlicker(true);
              set(() => {
                setFlicker(false);
                loop();
              }, 40 + Math.random() * 80);
            }, 60);
          } else {
            loop();
          }
        }, dur);
      }, 2000 + Math.random() * 4000);
    };
    loop();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  return <span className={`hf-neon ${flicker ? 'hf-neon-off' : ''}`}>{children}</span>;
}
