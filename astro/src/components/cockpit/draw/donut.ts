import { GRAD, PALETTE } from '../cockpit-palette';
import { SKILL_BREAKDOWN } from '@/data/site';

interface DonutCat {
  l: string;
  v: number;
  c1: string;
  c2: string;
}

export function drawDonut(canvas: HTMLCanvasElement | null): void {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const cats: DonutCat[] = [
    { l: 'ASIC',   v: SKILL_BREAKDOWN.asic,   c1: GRAD.emeraldOrange[0], c2: GRAD.emeraldOrange[1] },
    { l: 'AI',     v: SKILL_BREAKDOWN.ai,     c1: GRAD.coralPurple[0],   c2: GRAD.coralPurple[1] },
    { l: 'EDA',    v: SKILL_BREAKDOWN.eda,    c1: GRAD.cyanMagenta[0],   c2: GRAD.cyanMagenta[1] },
    { l: 'Script', v: SKILL_BREAKDOWN.script, c1: GRAD.yellowRed[0],     c2: GRAD.yellowRed[1] },
  ];
  const total = cats.reduce((s, c) => s + c.v, 0);
  const cx = w / 2;
  const cy = h / 2;
  const outerR = Math.min(cx, cy) - 14;
  const innerR = outerR * 0.58;
  const gap = 0.03;

  let angle = -Math.PI / 2;
  cats.forEach((c) => {
    const sweep = (c.v / total) * Math.PI * 2 - gap;
    const midA = angle + sweep / 2;

    const gx1 = cx + Math.cos(angle) * outerR;
    const gy1 = cy + Math.sin(angle) * outerR;
    const gx2 = cx + Math.cos(angle + sweep) * outerR;
    const gy2 = cy + Math.sin(angle + sweep) * outerR;
    const grad = ctx.createLinearGradient(gx1, gy1, gx2, gy2);
    grad.addColorStop(0, c.c1);
    grad.addColorStop(1, c.c2);

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, angle, angle + sweep);
    ctx.arc(cx, cy, innerR, angle + sweep, angle, true);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;

    const labelR = outerR + 18;
    const lx = cx + Math.cos(midA) * labelR;
    const ly = cy + Math.sin(midA) * labelR;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(midA) * (outerR + 2), cy + Math.sin(midA) * (outerR + 2));
    ctx.lineTo(lx, ly);
    const endX = lx + (Math.cos(midA) > 0 ? 22 : -22);
    ctx.lineTo(endX, ly);
    ctx.strokeStyle = PALETTE.inkMuted;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = c.c2;
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = Math.cos(midA) > 0 ? 'left' : 'right';
    ctx.fillText(c.l, endX + (Math.cos(midA) > 0 ? 6 : -6), ly - 4);
    ctx.fillStyle = PALETTE.inkPale;
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`${c.v} skills`, endX + (Math.cos(midA) > 0 ? 6 : -6), ly + 12);

    angle += sweep + gap;
  });

  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'bold 32px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(String(total), cx, cy + 4);
  ctx.fillStyle = PALETTE.inkPale;
  ctx.font = 'bold 13px monospace';
  ctx.fillText('total skills', cx, cy + 22);
}
