import { deskHexOf } from './ink';

/** What the two screens show over the 12 s loop, drawn as bars (text is never drawn in a
 *  canvas): a chat app on the landscape screen (sidebar, history, the prompt typed into the
 *  composer, the reply streaming in) and an editor on the portrait screen (gutter, code lines
 *  arriving one by one). The signal goes on one thing at a time: the caret, then the reply's
 *  cursor, then the editor's cursor. */

export const SCREEN_LOOP = 12;
const clamp = (x: number): number => Math.min(1, Math.max(0, x));
type Ctx = CanvasRenderingContext2D;

function bar(ctx: Ctx, x: number, y: number, w: number, h: number, colour: string): void {
  if (w <= 0) return;
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
}

const REPLY = [0.92, 0.84, 0.88, 0.6, 0.78];

export function drawChat(ctx: Ctx, w: number, h: number, u: number, signal: string): void {
  const ink = deskHexOf('chatInk');
  const soft = deskHexOf('chatInkSoft');
  ctx.fillStyle = deskHexOf('chatGround');
  ctx.fillRect(0, 0, w, h);
  const side = w * 0.2;
  ctx.fillStyle = deskHexOf('chatSide');
  ctx.fillRect(0, 0, side, h);
  bar(ctx, 14, 16, side * 0.5, 8, ink);
  for (let i = 0; i < 7; i++) bar(ctx, 14, 44 + i * 22, side * (0.45 + ((i * 37) % 30) / 100), 6, soft);
  const x0 = side + w * 0.08;
  const col = w - side - w * 0.16;
  // History: an earlier question and answer, dimmed.
  bar(ctx, x0 + col * 0.55, 18, col * 0.45, 22, deskHexOf('chatSide'));
  for (let i = 0; i < 2; i++) bar(ctx, x0, 52 + i * 14, col * (0.9 - i * 0.3), 6, soft);
  // The composer, with the prompt being typed.
  const cy = h - 54;
  ctx.strokeStyle = soft;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x0, cy, col, 38, 12);
  ctx.stroke();
  const typed = clamp((u - 0.8) / 2.2);
  const sent = u >= 3.2;
  const promptW = col * 0.62 * typed;
  if (!sent) {
    bar(ctx, x0 + 14, cy + 15, promptW, 8, ink);
    if (u < 3.2 && Math.floor(u * 2.5) % 2 === 0) bar(ctx, x0 + 16 + promptW, cy + 9, 3, 20, signal);
  }
  // The sent prompt as a bubble, rising into place.
  if (sent) {
    const k = clamp((u - 3.2) / 0.4);
    const by = 96 + (1 - k) * 60;
    bar(ctx, x0 + col * 0.38, by, col * 0.62, 24, deskHexOf('chatSide'));
    bar(ctx, x0 + col * 0.38 + 12, by + 8, col * 0.62 - 24, 8, ink);
  }
  // The reply, streaming line by line.
  const stream = clamp((u - 5.5) / 3.5) * REPLY.length;
  for (let i = 0; i < REPLY.length; i++) {
    const f = clamp(stream - i);
    if (f <= 0) break;
    const lw = col * (REPLY[i] ?? 0.8) * f;
    const y = 136 + i * 16;
    bar(ctx, x0, y, lw, 8, ink);
    if (f < 1 && u < 9.2) bar(ctx, x0 + lw + 3, y - 2, 6, 12, signal);
  }
  const fade = clamp((u - 11) / 1);
  if (fade > 0) {
    ctx.fillStyle = deskHexOf('chatGround');
    ctx.globalAlpha = fade;
    ctx.fillRect(side, 90, w - side, cy - 92);
    ctx.globalAlpha = 1;
  }
}

/** Indents of the code: a function, a loop and a return, the shape of real code. */
const CODE = [0, 1, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 2, 1, 0];
const LEN = [0.7, 0.55, 0.8, 0.5, 0.62, 0.4, 0.3, 0.45, 0.12, 0.66, 0.74, 0.5, 0.58, 0.36, 0.1];

export function drawCode(ctx: Ctx, w: number, h: number, u: number, signal: string): void {
  ctx.fillStyle = deskHexOf('codeGround');
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = deskHexOf('codeGutter');
  ctx.fillRect(0, 0, w * 0.14, h);
  ctx.fillRect(0, 0, w, 22);
  bar(ctx, w * 0.2, 8, w * 0.22, 6, deskHexOf('codeInkSoft'));
  const ink = deskHexOf('codeInk');
  const soft = deskHexOf('codeInkSoft');
  const line = 22;
  const pre = 6;
  const arrived = u < 7 ? 0 : Math.min(CODE.length, Math.floor(((u - 7) / 3.5) * CODE.length) + 1);
  const total = pre + arrived;
  const room = Math.floor((h - 40) / line);
  const first = Math.max(0, total - room);
  for (let n = first; n < total; n++) {
    const y = 36 + (n - first) * line;
    bar(ctx, w * 0.04, y, w * 0.06, 6, soft);
    const fresh = n >= pre;
    const i = fresh ? n - pre : n + 4;
    const indent = (CODE[i % CODE.length] ?? 0) * w * 0.07;
    const len = (LEN[i % LEN.length] ?? 0.5) * w * 0.7;
    bar(ctx, w * 0.2 + indent, y, len * 0.3, 7, fresh ? ink : soft);
    bar(ctx, w * 0.2 + indent + len * 0.34, y, len * 0.66, 7, fresh ? soft : deskHexOf('codeGutter'));
    if (fresh && n === total - 1 && u < 10.8) bar(ctx, w * 0.22 + indent + len, y - 3, 4, 13, signal);
  }
}
