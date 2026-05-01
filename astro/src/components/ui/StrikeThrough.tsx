import { useEffect, useState, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  delay?: number;
}

export default function StrikeThrough({ children, delay = 2200 }: Props) {
  const [struck, setStruck] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStruck(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <span className={`hf-strike ${struck ? 'hf-struck' : ''}`}>
      {children}
      <span className="hf-strike-line" />
    </span>
  );
}
