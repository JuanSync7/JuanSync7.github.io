import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  delay?: number;
}

export default function StrikeThrough({ children, delay = 2200 }: Props) {
  const [struck, setStruck] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const clear = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setStruck(false);
            clear();
            timer = setTimeout(() => setStruck(true), delay);
          } else {
            clear();
            setStruck(false);
          }
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);

    return () => {
      clear();
      observer.disconnect();
    };
  }, [delay]);

  return (
    <span ref={ref} className={`hf-strike ${struck ? 'hf-struck' : ''}`}>
      {children}
      <span className="hf-strike-line" />
    </span>
  );
}
