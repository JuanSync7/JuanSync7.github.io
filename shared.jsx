// Shared components: NOT gate dividers, pixel transitions, scene transitions, segmented bars

function NotGateDivider({ label }) {
  return (
    <div className="hf-notgate">
      <svg viewBox="0 0 60 30" className="hf-notgate-svg">
        <polygon points="8,4 42,15 8,26" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="46" cy="15" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="0" y1="15" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="50" y1="15" x2="60" y2="15" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
      <span className="hf-notgate-lbl">{label}</span>
      <svg viewBox="0 0 60 30" className="hf-notgate-svg hf-notgate-flip">
        <polygon points="8,4 42,15 8,26" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="46" cy="15" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="0" y1="15" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="50" y1="15" x2="60" y2="15" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

function PixelTransition({ variant }) {
  return (
    <div className="hf-pixel-trans" data-variant={variant || 0}>
      <div className="hf-pixel-row">
        {Array.from({length: 48}, (_, i) => (
          <span key={i} className="hf-pixel" style={{
            animationDelay: (Math.random() * 0.4) + 's',
          }} />
        ))}
      </div>
    </div>
  );
}

function SceneTransition({ from, to, children }) {
  const gradients = {
    'green-navy': 'linear-gradient(180deg, var(--hf-bg) 0%, #060c14 40%, #020810 100%)',
    'navy-green': 'linear-gradient(180deg, #101828 0%, #0a1218 50%, var(--hf-bg) 100%)',
    'green-purple': 'linear-gradient(180deg, var(--hf-bg) 0%, #0c0c16 30%, #151020 60%, #1a1028 100%)',
    'purple-dark': 'linear-gradient(180deg, #151020 0%, #100c18 50%, var(--hf-bg) 100%)',
  };
  const key = from + '-' + to;
  const dots = React.useMemo(() => Array.from({length: 80}, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    o: Math.random() * 0.35 + 0.05,
    d: Math.random() * 3,
    s: 2 + Math.random() * 2,
  })), []);

  return (
    <div className="hf-scene-trans" style={{ background: gradients[key] || gradients['green-navy'] }}>
      <div className="hf-trans-noise">
        {dots.map((d, i) => (
          <span key={i} className="hf-trans-dot" style={{
            left: d.x + '%', top: d.y + '%',
            opacity: d.o,
            animationDelay: d.d + 's',
            width: d.s + 'px', height: d.s + 'px',
            '--dot-color': to === 'purple' ? '#3a2855' : to === 'navy' ? '#1a3050' : '#1a3020',
          }} />
        ))}
      </div>
      {children && <div className="hf-trans-text">{children}</div>}
    </div>
  );
}

function SegmentedBar({ value, max, color, segments: segCount }) {
  const segments = segCount || 20;
  const filled = Math.round((value / (max || 100)) * segments);
  return (
    <div className="hf-seg-bar">
      {Array.from({length: segments}, (_, i) => (
        <span key={i} className={`hf-seg ${i < filled ? 'hf-seg-on' : ''}`}
          style={i < filled ? { background: color || 'var(--hf-accent)' } : {}} />
      ))}
    </div>
  );
}

// Two-way visibility hook — true while in view, false when out
// Uses rootMargin to trigger early (before element enters viewport)
function useInView(ref, margin) {
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { rootMargin: margin || '200px 0px' }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, margin]);
  return inView;
}

// Scroll-triggered visibility hook (one-way — stays true once visible)
function useOnScreen(ref, threshold) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: threshold || 0.15 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

// SVG cloud mask transition between sections
function CloudTransition({ topColor, bottomColor }) {
  const top = topColor || 'var(--hf-bg)';
  const bot = bottomColor || '#12101e';

  return (
    <div className="cloud-transition">
      {/* Top section color */}
      <div className="cloud-transition-top" style={{ background: top }} />
      {/* Bottom section color */}
      <div className="cloud-transition-bottom" style={{ background: bot }} />
      {/* Cloud SVG layered on top — bottom half is "bot" color peeking through cloud shapes cut from "top" */}
      <svg className="cloud-transition-svg cloud-transition-drift" viewBox="-100 0 1400 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        {/* Back cloud layer — smooth S-curves using smooth cubic (S) */}
        <path d="M-200,130 C-150,130 -100,65 -20,65 S120,140 220,140 S380,50 460,50
                 S620,130 700,130 S860,45 940,45 S1100,135 1180,135 S1350,60 1500,80
                 L1500,0 L-200,0 Z"
              fill={top} opacity="0.5"/>
        {/* Main cloud layer */}
        <path d="M-200,145 C-140,145 -80,75 20,75 S200,150 300,150 S460,60 560,60
                 S720,145 820,145 S980,55 1080,55 S1240,140 1340,140 S1450,85 1500,95
                 L1500,0 L-200,0 Z"
              fill={top}/>
        {/* Front wispy layer */}
        <path d="M-200,170 C-120,170 -60,140 60,140 S240,175 360,175 S520,132 640,132
                 S820,172 940,172 S1100,128 1200,128 S1380,168 1500,168
                 L1500,200 L-200,200 Z"
              fill={bot} opacity="0.3"/>
      </svg>
    </div>
  );
}

// Purple sky gradient transition with DOM stars
function PurpleSkyTransition() {
  const ref = React.useRef(null);
  const inView = useInView(ref, '300px 0px');

  const stars = React.useMemo(() => Array.from({length: 120}, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    r: 0.5 + Math.random() * 1.5,
    o: 0.1 + Math.random() * 0.6,
    d: Math.random() * 4,
    dur: 1.5 + Math.random() * 2.5,
  })), []);

  return (
    <div className="hf-purple-sky" ref={ref}>
      {inView && <div className="hf-purple-sky-stars">
        {stars.map((s, i) => (
          <span key={i} className="hf-purple-sky-star" style={{
            left: s.x + '%',
            top: s.y + '%',
            width: s.r + 'px',
            height: s.r + 'px',
            opacity: s.o,
            animationDelay: s.d + 's',
            animationDuration: s.dur + 's',
          }} />
        ))}
      </div>}
    </div>
  );
}

Object.assign(window, {
  NotGateDivider, PixelTransition, SceneTransition, SegmentedBar, useOnScreen, useInView, CloudTransition, PurpleSkyTransition,
});
