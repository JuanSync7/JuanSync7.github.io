import { createElement, useEffect, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';
import type { GlitchIntensity } from '../types';

interface Props {
  children: ReactNode;
  style?: CSSProperties;
  as?: ElementType;
  intensity?: GlitchIntensity;
}

export default function GlitchText({ children, style = {}, as = 'span', intensity = 'medium' }: Props) {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const p = intensity === 'high' ? 0.15 : intensity === 'medium' ? 0.08 : 0.03;
      if (Math.random() < p) {
        setGlitching(true);
        setTimeout(() => setGlitching(false), 150 + Math.random() * 200);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [intensity]);

  const glitchStyle: CSSProperties = glitching
    ? {
        textShadow: '2px 0 #ff2a6d, -2px 0 #05d9e8, 0 0 8px rgba(5,217,232,0.5)',
        animation: 'glitchShake 0.1s linear infinite',
        filter: 'blur(0.3px)',
      }
    : {};

  return createElement(
    as,
    {
      style: { ...style, ...glitchStyle, transition: 'text-shadow 0.05s' },
      'data-text': typeof children === 'string' ? children : '',
    },
    children,
  );
}
