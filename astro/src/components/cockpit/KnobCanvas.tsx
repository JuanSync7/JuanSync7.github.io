import { useEffect, useRef } from 'react';
import { PALETTE } from './cockpit-palette';

interface Props {
  fraction: number;
  color: string;
  color2?: string;
}

export default function KnobCanvas({ fraction, color, color2 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const c2 = color2 || color;
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 50, 50);
    ctx.beginPath();
    ctx.arc(25, 25, 18, 0.75 * Math.PI, 2.25 * Math.PI);
    ctx.strokeStyle = PALETTE.track;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
    const ang = 0.75 * Math.PI + fraction * 1.5 * Math.PI;
    const grad = ctx.createLinearGradient(7, 43, 43, 7);
    grad.addColorStop(0, color);
    grad.addColorStop(1, c2);
    ctx.beginPath();
    ctx.arc(25, 25, 18, 0.75 * Math.PI, ang);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
    const nx = 25 + Math.cos(ang) * 12;
    const ny = 25 + Math.sin(ang) * 12;
    ctx.beginPath();
    ctx.arc(nx, ny, 2, 0, Math.PI * 2);
    ctx.fillStyle = c2;
    ctx.fill();
  }, [fraction, color, c2]);
  return <canvas ref={ref} width={50} height={50} />;
}
