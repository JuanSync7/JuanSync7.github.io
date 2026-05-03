import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  minAlpha: number;
  period: number;
  offset: number;
}

interface Shooter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  tailLen: number;
}

interface Props {
  density?: number;
  shootMinMs?: number;
  shootMaxMs?: number;
}

export default function StarfieldStage({
  density = 0.0004,
  shootMinMs = 1500,
  shootMaxMs = 4000,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function measure(): [number, number] {
      const r = canvas!.getBoundingClientRect();
      return [Math.max(1, Math.round(r.width)), Math.max(1, Math.round(r.height))];
    }
    let [W, H] = measure();
    canvas.width = W;
    canvas.height = H;

    function makeStars(): Star[] {
      const count = Math.max(40, Math.floor(W * H * density));
      const out: Star[] = [];
      for (let i = 0; i < count; i++) {
        const sizeFrac = Math.pow(Math.random(), 2.5);
        const r = 0.3 + sizeFrac * 1.8;
        const sizeInfluence = 0.2 + sizeFrac * 0.6;
        const variance = 0.5 + Math.random() * 1.0;
        const baseAlpha = Math.min(sizeInfluence * variance, 0.95);
        const minAlpha = baseAlpha * (0.15 + Math.random() * 0.15);
        out.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r,
          baseAlpha,
          minAlpha,
          period: 1.5 + Math.random() * 2.5,
          offset: Math.random() * Math.PI * 2,
        });
      }
      return out;
    }

    let stars = makeStars();
    const shooters: Shooter[] = [];
    let nextShoot = performance.now() + shootMinMs + Math.random() * (shootMaxMs - shootMinMs);
    let frame = 0;

    function spawnShooter(time: number) {
      const angle = ((15 + Math.random() * 40) * Math.PI) / 180;
      const speed = 120 + Math.random() * 140;
      const flip = Math.random() > 0.5 ? -1 : 1;
      shooters.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.6,
        vx: Math.cos(angle) * speed * flip,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 1.0 + Math.random() * 1.2,
        tailLen: 50 + Math.random() * 60,
      });
      nextShoot = time + shootMinMs + Math.random() * (shootMaxMs - shootMinMs);
    }

    function draw(time: number) {
      const t = time * 0.001;
      ctx!.clearRect(0, 0, W, H);

      for (const s of stars) {
        const phase = ((t + s.offset) % s.period) / s.period;
        const tri = phase < 0.5 ? phase * 2 : 2 - phase * 2;
        const ease = tri * tri * (3 - 2 * tri);
        const alpha = s.minAlpha + (s.baseAlpha - s.minAlpha) * ease;
        if (alpha < 0.015) continue;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx!.fill();
      }

      if (time > nextShoot) spawnShooter(time);

      const dt = 1 / 60;
      for (let i = shooters.length - 1; i >= 0; i--) {
        const s = shooters[i];
        s.life += dt;
        if (s.life > s.maxLife) { shooters.splice(i, 1); continue; }
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        const p = s.life / s.maxLife;
        const alpha = p < 0.15 ? p / 0.15 : 1 - Math.pow((p - 0.15) / 0.85, 2);
        const mag = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
        const tx = (-s.vx / mag) * s.tailLen;
        const ty = (-s.vy / mag) * s.tailLen;

        const grad = ctx!.createLinearGradient(s.x, s.y, s.x + tx, s.y + ty);
        grad.addColorStop(0, `rgba(255,255,255,${(alpha * 0.9).toFixed(2)})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx!.beginPath();
        ctx!.moveTo(s.x, s.y);
        ctx!.lineTo(s.x + tx, s.y + ty);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1.5;
        ctx!.stroke();

        ctx!.beginPath();
        ctx!.arc(s.x, s.y, 1.2, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,255,255,${(alpha * 0.95).toFixed(2)})`;
        ctx!.fill();
      }

      frame = requestAnimationFrame(draw);
    }

    frame = requestAnimationFrame(draw);

    const resizeObs = new ResizeObserver(() => {
      const [nw, nh] = measure();
      if (nw === W && nh === H) return;
      W = nw; H = nh;
      canvas.width = W; canvas.height = H;
      stars = makeStars();
    });
    resizeObs.observe(canvas);

    return () => {
      cancelAnimationFrame(frame);
      resizeObs.disconnect();
    };
  }, [density, shootMinMs, shootMaxMs]);

  return <canvas ref={canvasRef} className="hf-starfield-stage" />;
}
