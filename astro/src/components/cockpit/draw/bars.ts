import { PALETTE } from '../cockpit-palette';

export function drawBars(
  canvas: HTMLCanvasElement | null,
  data: number[],
  colorBot: string,
  colorTop: string,
  maxVal: number,
): void {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = PALETTE.track;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 5; i++) {
    const y = h * (i / 4);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const grad = ctx.createLinearGradient(0, h, 0, 0);
  grad.addColorStop(0, colorBot);
  grad.addColorStop(0.5, colorTop);
  grad.addColorStop(1, colorTop);

  const barW = Math.floor(w / data.length);
  for (let i = 0; i < data.length; i++) {
    const val = Math.max(0, Math.min(maxVal, data[i]));
    const barH = (val / maxVal) * h;
    ctx.globalAlpha = 0.55 + (val / maxVal) * 0.45;
    ctx.fillStyle = grad;
    ctx.fillRect(i * barW, h - barH, barW - 1, barH);
  }
  ctx.globalAlpha = 1;

  const last = data[data.length - 1];
  ctx.fillStyle = PALETTE.inkMuted;
  ctx.font = '9px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(String(Math.round(maxVal)), w - 4, 10);
  ctx.fillText(String(Math.round(maxVal / 2)), w - 4, h / 2 + 3);
  ctx.fillText('0', w - 4, h - 2);
  ctx.textAlign = 'left';
  ctx.fillText('now', 4, h - 2);

  ctx.fillStyle = colorTop;
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(String(Math.round(last)), w - 4, h - (last / maxVal) * h - 6);
}
