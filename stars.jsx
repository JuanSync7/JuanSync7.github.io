// Starfield — twinkling stars + shooting stars in document space.
// Canvas is position:absolute covering the full document height,
// so it scrolls with the page natively (GPU-composited, no jitter).
// Opaque section backgrounds in #root sit on top via z-index.
// Only stars visible in the viewport are drawn each frame.

function GlobalStarfield() {
  const canvasRef = React.useRef(null);
  const frameRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = window.innerWidth;
    let H = window.innerHeight;
    let docH = document.documentElement.scrollHeight;

    canvas.width = W;
    canvas.height = docH;

    const DENSITY = 0.00006; // stars per px²

    // Build all stars in document-space
    function buildStars() {
      docH = document.documentElement.scrollHeight;
      canvas.height = docH;
      const count = Math.min(2000, Math.max(200, Math.floor(W * docH * DENSITY)));
      const stars = [];
      for (let i = 0; i < count; i++) {
        const sizeFrac = Math.pow(Math.random(), 2.5);
        const r = 0.3 + sizeFrac * 2.5;
        const sizeInfluence = 0.15 + sizeFrac * 0.55;
        const variance = 0.5 + Math.random() * 1.0;
        const baseAlpha = Math.min(sizeInfluence * variance, 0.9);
        const minAlpha = baseAlpha * (0.15 + Math.random() * 0.15);
        const period = 1.5 + Math.random() * 2.5;
        stars.push({
          x: Math.random() * W,
          y: Math.random() * docH,
          r,
          baseAlpha,
          minAlpha,
          period,
          offset: Math.random() * Math.PI * 2,
        });
      }
      // Sort by y so we can binary-search for visible range
      stars.sort((a, b) => a.y - b.y);
      return stars;
    }

    let stars = buildStars();

    // Binary search: find first star with y >= val
    function lowerBound(arr, val) {
      let lo = 0, hi = arr.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (arr[mid].y < val) lo = mid + 1; else hi = mid;
      }
      return lo;
    }

    // ── Shooting stars (document-space, drawn on the main canvas) ──
    // Spawned relative to current viewport, but coordinates are in document space
    // so they stay put when the user scrolls (just like static stars).
    const shooters = [];
    let nextShoot = 2000 + Math.random() * 4000;

    function spawnShooter(time) {
      const scrollY = window.scrollY;
      const angle = (15 + Math.random() * 40) * Math.PI / 180;
      const speed = 80 + Math.random() * 120;
      const flip = Math.random() > 0.5 ? -1 : 1;
      shooters.push({
        x: Math.random() * W,
        y: scrollY + Math.random() * H * 0.6,  // document-space Y
        vx: Math.cos(angle) * speed * flip,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 1.2 + Math.random() * 1.5,
        tailLen: 60 + Math.random() * 80,
      });
      nextShoot = time + 2000 + Math.random() * 4000;
    }

    function drawShooters(viewTop, viewBot) {
      const dt = 1 / 60;
      for (let i = shooters.length - 1; i >= 0; i--) {
        const s = shooters[i];
        s.life += dt;
        if (s.life > s.maxLife) { shooters.splice(i, 1); continue; }

        s.x += s.vx * dt;
        s.y += s.vy * dt;

        // Skip if entirely outside viewport (with tail margin)
        if (s.y < viewTop - s.tailLen - 20 || s.y > viewBot + s.tailLen + 20) continue;

        const p = s.life / s.maxLife;
        const alpha = p < 0.15 ? p / 0.15 : 1 - Math.pow((p - 0.15) / 0.85, 2);

        const mag = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
        const tx = -s.vx / mag * s.tailLen;
        const ty = -s.vy / mag * s.tailLen;

        const grad = ctx.createLinearGradient(s.x, s.y, s.x + tx, s.y + ty);
        grad.addColorStop(0, `rgba(255,255,255,${(alpha * 0.9).toFixed(2)})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + tx, s.y + ty);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${(alpha * 0.95).toFixed(2)})`;
        ctx.fill();
      }
    }

    // ── Main draw loop ──
    // Only clear & redraw the visible viewport region of the document canvas
    function draw(time) {
      const scrollY = window.scrollY;
      const viewTop = scrollY;
      const viewBot = scrollY + H;
      const t = time * 0.001;

      // Clear only the visible strip
      ctx.clearRect(0, viewTop, W, H);

      // Find visible stars via binary search
      const startIdx = lowerBound(stars, viewTop - 4);
      for (let i = startIdx; i < stars.length; i++) {
        const s = stars[i];
        if (s.y > viewBot + 4) break;

        const phase = ((t + s.offset) % s.period) / s.period;
        const tri = phase < 0.5 ? phase * 2 : 2 - phase * 2;
        const ease = tri * tri * (3 - 2 * tri);
        const alpha = s.minAlpha + (s.baseAlpha - s.minAlpha) * ease;
        if (alpha < 0.015) continue;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.fill();
      }

      // Shooting stars on the same document-space canvas
      if (time > nextShoot) spawnShooter(time);
      drawShooters(viewTop, viewBot);

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);

    // Watch for document height changes (React rendering, dynamic content)
    let resizeTimer = null;
    const resizeObs = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newDocH = document.documentElement.scrollHeight;
        if (newDocH !== docH || window.innerWidth !== W) {
          W = window.innerWidth;
          H = window.innerHeight;
          stars = buildStars();
        }
      }, 200);
    });
    resizeObs.observe(document.documentElement);

    function onResize() {
      W = window.innerWidth;
      H = window.innerHeight;
      stars = buildStars();
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', onResize);
      resizeObs.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="hf-starfield" />;
}

window.GlobalStarfield = GlobalStarfield;
