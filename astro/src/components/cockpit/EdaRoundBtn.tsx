import { useEffect, useRef } from 'react';
import { PALETTE } from './cockpit-palette';
import type { EdaSkill } from './cockpit-data';

interface Props {
  skill: EdaSkill;
  color: string;
  color2?: string;
}

export default function EdaRoundBtn({ skill, color, color2 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const c2 = color2 || color;
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 64, 64);
    ctx.beginPath();
    ctx.arc(32, 32, 26, 0, Math.PI * 2);
    ctx.strokeStyle = PALETTE.track;
    ctx.lineWidth = 5;
    ctx.stroke();
    const frac = Math.min(skill.val / 100, 0.995);
    const grad = ctx.createLinearGradient(6, 58, 58, 6);
    grad.addColorStop(0, color);
    grad.addColorStop(1, c2);
    ctx.beginPath();
    ctx.arc(32, 32, 26, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.fillStyle = c2;
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${skill.val}%`, 32, 32);
  }, [skill.val, color, c2]);
  return (
    <a className="cp-rnd-btn" href={skill.url} target="_blank" rel="noopener noreferrer">
      <canvas ref={ref} width={64} height={64} />
      <div className="cp-rnd-lbl">{skill.name}</div>
    </a>
  );
}
