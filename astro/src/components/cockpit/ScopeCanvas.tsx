import { useEffect, useRef } from 'react';
import { PALETTE } from './cockpit-palette';

export default function ScopeCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const offsetRef = useRef(0);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const w = c.width;
    const h = c.height;
    const hi = 15;
    const lo = h - 15;
    const period = 80;
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = PALETTE.track;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 4; i++) {
        const y = h * (i / 3);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      const off = offsetRef.current;
      ctx.beginPath();
      ctx.strokeStyle = PALETTE.asic;
      ctx.lineWidth = 2;
      for (let x = 0; x < w; x++) {
        const pos = (x + off) % period;
        const y = pos < period / 2 ? hi : lo;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = PALETTE.asic;
      ctx.lineWidth = 6;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const pos = (x + off) % period;
        const y = pos < period / 2 ? hi : lo;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      offsetRef.current += 0.8;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="cp-scope">
      <canvas ref={ref} width={720} height={90} className="cp-scope-canvas" />
    </div>
  );
}
