import { PALETTE } from '../cockpit-palette';

export function drawSpeedometer(
  canvas: HTMLCanvasElement | null,
  value: number,
  colorBot: string,
  colorTop: string,
): void {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h - 20;
  const r = Math.min(cx - 20, cy - 10);
  const startA = Math.PI;
  const endA = 2 * Math.PI;

  ctx.beginPath();
  ctx.arc(cx, cy, r, startA, endA);
  ctx.strokeStyle = PALETTE.track;
  ctx.lineWidth = 18;
  ctx.lineCap = 'butt';
  ctx.stroke();

  const frac = Math.max(0, Math.min(1, value / 100));
  const valA = startA + frac * Math.PI;
  const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
  grad.addColorStop(0, colorBot);
  grad.addColorStop(1, colorTop);
  ctx.beginPath();
  ctx.arc(cx, cy, r, startA, valA);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.stroke();

  for (let i = 0; i <= 10; i++) {
    const a = startA + (i / 10) * Math.PI;
    const isMajor = i % 5 === 0;
    const inner = r - (isMajor ? 28 : 24);
    const outer = r - 14;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    ctx.strokeStyle = isMajor ? PALETTE.inkSoft : PALETTE.panel2;
    ctx.lineWidth = isMajor ? 1.5 : 1;
    ctx.stroke();
  }

  const needleA = startA + frac * Math.PI;
  const needleLen = r - 24;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(needleA) * needleLen, cy + Math.sin(needleA) * needleLen);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.ink;
  ctx.fill();

  ctx.fillStyle = colorTop;
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(value)}%`, cx, cy - 16);

  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('0', cx - r - 4, cy + 14);
  ctx.textAlign = 'center';
  ctx.fillText('50', cx, cy - r - 8);
  ctx.textAlign = 'right';
  ctx.fillText('100', cx + r + 4, cy + 14);
}
