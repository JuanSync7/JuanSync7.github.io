import { GRAD, PALETTE } from '../cockpit-palette';

export function drawCodeActivity(canvas: HTMLCanvasElement | null): void {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const wks = [120, 85, 140, 95, 160, 110, 180, 130, 200, 90, 150, 175];

  ctx.strokeStyle = PALETTE.track;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 4; i++) {
    const y = h * (i / 3);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.inkMuted;
  ctx.font = '9px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('200', w - 4, 10);
  ctx.fillText('100', w - 4, h / 2);
  ctx.fillText('0', w - 4, h - 2);

  const barW = Math.floor(w / wks.length);
  wks.forEach((v, i) => {
    const barH = (v / 220) * h;
    const grad = ctx.createLinearGradient(0, h, 0, h - barH);
    grad.addColorStop(0, GRAD.greenYellow[0]);
    grad.addColorStop(1, GRAD.greenYellow[1]);
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.5 + (v / 220) * 0.5;
    ctx.fillRect(i * barW, h - barH, barW - 2, barH);
  });
  ctx.globalAlpha = 1;
}
