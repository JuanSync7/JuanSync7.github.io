import { useEffect, useState } from 'react';

interface Props {
  color?: string;
}

export default function ReadingProgress({ color = '#05d9e8' }: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handler = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, height: 3, background: '#0a0a0a' }}>
      <div
        style={{
          height: '100%', width: `${progress}%`,
          background: `linear-gradient(90deg, ${color}, #ff2a6d)`,
          boxShadow: `0 0 8px ${color}66`, transition: 'width 0.1s linear',
        }}
      />
    </div>
  );
}
