// Cockpit — 5-page skill dashboard with live charts, gauges, knobs, meters

/* ── Color Gradients ── */
const GRAD = {
  greenYellow:     ['#22c55e', '#facc15'],
  roseGold:        ['#f472b6', '#fbbf24'],
  periwinkleMint:  ['#818cf8', '#34d399'],
  coralPurple:     ['#ff6b6b', '#a855f7'],
  cyanMagenta:     ['#00d4ff', '#ff00aa'],
  emeraldOrange:   ['#14b8a6', '#f97316'],
  yellowRed:       ['#facc15', '#ef4444'],
};

/* ── Skill Data ── */
const ASIC_SKILLS = [
  { name: 'SystemVerilog', url: 'https://juansync7.github.io/skills/systemverilog/' },
  { name: 'RTL Coding',    url: 'https://juansync7.github.io/skills/rtl-coding/' },
  { name: 'UVM',           url: 'https://juansync7.github.io/skills/uvm/' },
  { name: 'AMBA AXI/AHB',  url: 'https://juansync7.github.io/skills/amba-axi-ahb/' },
  { name: 'PCIe / DDR',    url: 'https://juansync7.github.io/skills/pcie-ddr/' },
  { name: 'ECC Safety',    url: 'https://juansync7.github.io/skills/ecc-safety/' },
];
const AI_SKILLS = [
  { name: 'LLM Tooling',   url: 'https://juansync7.github.io/skills/llm-tooling/',   color: '#ff6b6b' },
  { name: 'MCP Servers',   url: 'https://juansync7.github.io/skills/mcp-servers/',   color: '#ff6b6b' },
  { name: 'RAG Pipelines', url: 'https://juansync7.github.io/skills/rag-pipelines/', color: '#ffa94d' },
  { name: 'AI Agents',     url: 'https://juansync7.github.io/skills/ai-agents/',     color: '#ffa94d' },
  { name: 'Vibe Coding',   url: 'https://juansync7.github.io/skills/vibe-coding/',   color: '#ffa94d' },
];
const EDA_SKILLS = [
  { name: 'TestMax',   val: 85, url: 'https://juansync7.github.io/skills/synopsys-testmax/' },
  { name: 'DC',        val: 88, url: 'https://juansync7.github.io/skills/design-compiler/' },
  { name: 'RTL-Arch',  val: 80, url: 'https://juansync7.github.io/skills/rtl-architect/' },
  { name: 'Spyglass',  val: 82, url: 'https://juansync7.github.io/skills/vc-spyglass/' },
  { name: 'Verdi',     val: 84, url: 'https://juansync7.github.io/skills/verdi-vcs/' },
  { name: 'Verilator', val: 75, url: 'https://juansync7.github.io/skills/verilator/' },
];
const SCRIPT_SKILLS = [
  { name: 'Python',     tag: 'scripting', color: '#c8d837', url: 'https://juansync7.github.io/skills/python/' },
  { name: 'TCL / Bash', tag: 'scripting', color: '#c8d837', url: 'https://juansync7.github.io/skills/tcl-bash/' },
  { name: 'SystemC',    tag: 'hardware',  color: '#1ba0a0', url: 'https://juansync7.github.io/skills/systemc/' },
  { name: 'Rust',       tag: 'learning',  color: '#ffa94d', url: 'https://juansync7.github.io/skills/rust/' },
  { name: 'Git / SVN',  tag: 'vcs',       color: '#c8d837', url: 'https://juansync7.github.io/skills/git-svn/' },
];

const PAGE_NAMES = ['OVERVIEW', 'ASIC', 'AI', 'EDA', 'SCRIPTING'];
const PAGE_COLORS = ['#1ba0a0', '#1ba0a0', '#ff6b6b', '#6ec8e6', '#c8d837'];
const TOTAL_PAGES = 5;

const TICKER_MSG = 'SKILLS: <b>22</b> | COMMITS: <b>847</b> | TAPE_OUTS: <b>3</b> | YEARS_EXP: <b>5</b> | COVERAGE: <b>98.7%</b> | LANGUAGES: <b>6</b> | TOOLS: <b>12</b> | PROJECTS: <b>12</b> | CERTIFICATIONS: <b>2</b> | PUBLICATIONS: <b>1</b> | GIT_STREAK: <b>14d</b>';

/* ── Helpers ── */
function initBarData(n) {
  const d = [];
  for (let i = 0; i < n; i++) {
    const t = i / n;
    d.push(45 + Math.sin(t * 4) * 20 + Math.sin(t * 7) * 10 + (Math.random() - 0.5) * 5);
  }
  return d;
}
function initTpData(n) {
  const d = [];
  for (let i = 0; i < n; i++) {
    const t = i / n;
    d.push(350 + Math.sin(t * 3) * 150 + Math.sin(t * 6) * 60 + (Math.random() - 0.5) * 20);
  }
  return d;
}

/* ── Canvas sub-components ── */

function CircularGauge({ value, color, color2, size }) {
  const ref = React.useRef(null);
  const sz = size || 80;
  const r = sz * 0.375;
  const c2 = color2 || color;

  React.useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    const cx = sz / 2, cy = sz / 2;
    ctx.clearRect(0, 0, sz, sz);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#1a2230'; ctx.lineWidth = 6; ctx.stroke();
    const frac = Math.min(value / 100, 0.995);
    // Linear gradient from top-left to bottom-right creates a sweep effect along the arc
    const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    grad.addColorStop(0, color);
    grad.addColorStop(1, c2);
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.strokeStyle = grad; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke();
  }, [value, color, c2, sz]);

  return <canvas ref={ref} width={sz} height={sz} />;
}

function KnobCanvas({ fraction, color, color2 }) {
  const ref = React.useRef(null);
  const c2 = color2 || color;
  React.useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 50, 50);
    ctx.beginPath(); ctx.arc(25, 25, 18, 0.75 * Math.PI, 2.25 * Math.PI);
    ctx.strokeStyle = '#1a2230'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
    const ang = 0.75 * Math.PI + fraction * 1.5 * Math.PI;
    const grad = ctx.createLinearGradient(7, 43, 43, 7);
    grad.addColorStop(0, color);
    grad.addColorStop(1, c2);
    ctx.beginPath(); ctx.arc(25, 25, 18, 0.75 * Math.PI, ang);
    ctx.strokeStyle = grad; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
    const nx = 25 + Math.cos(ang) * 12, ny = 25 + Math.sin(ang) * 12;
    ctx.beginPath(); ctx.arc(nx, ny, 2, 0, Math.PI * 2);
    ctx.fillStyle = c2; ctx.fill();
  }, [fraction, color, c2]);
  return <canvas ref={ref} width={50} height={50} />;
}

function EdaRoundBtn({ skill, color, color2 }) {
  const ref = React.useRef(null);
  const c2 = color2 || color;
  React.useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);
    ctx.beginPath(); ctx.arc(32, 32, 26, 0, Math.PI * 2);
    ctx.strokeStyle = '#1a2230'; ctx.lineWidth = 5; ctx.stroke();
    const frac = Math.min(skill.val / 100, 0.995);
    const grad = ctx.createLinearGradient(6, 58, 58, 6);
    grad.addColorStop(0, color);
    grad.addColorStop(1, c2);
    ctx.beginPath();
    ctx.arc(32, 32, 26, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.strokeStyle = grad; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke();
    ctx.fillStyle = c2; ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(skill.val + '%', 32, 32);
  }, [skill.val, color, c2]);
  return (
    <a className="cp-rnd-btn" href={skill.url} target="_blank" rel="noopener noreferrer">
      <canvas ref={ref} width={64} height={64} />
      <div className="cp-rnd-lbl">{skill.name}</div>
    </a>
  );
}

function ScopeCanvas() {
  const ref = React.useRef(null);
  const offsetRef = React.useRef(0);
  React.useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    const w = c.width, h = c.height;
    const hi = 15, lo = h - 15, period = 80;
    let raf;

    function draw() {
      ctx.clearRect(0, 0, w, h);
      // Grid lines
      ctx.strokeStyle = '#1a2230'; ctx.lineWidth = 0.5;
      for (let i = 0; i < 4; i++) {
        const y = h * (i / 3);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      // Scrolling waveform
      const off = offsetRef.current;
      ctx.beginPath(); ctx.strokeStyle = '#1ba0a0'; ctx.lineWidth = 2;
      for (let x = 0; x < w; x++) {
        const pos = (x + off) % period;
        const y = pos < period / 2 ? hi : lo;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      // Glow trace
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = '#1ba0a0'; ctx.lineWidth = 6;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const pos = (x + off) % period;
        const y = pos < period / 2 ? hi : lo;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      offsetRef.current += 0.8;
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="cp-scope">
      <canvas ref={ref} width={720} height={90} style={{ width: '100%', height: 'auto' }} />
    </div>
  );
}

/* ── Bar chart drawing ── */
// colorBot = bottom of bar, colorTop = top of bar (two distinct hues)
function drawBars(canvas, data, colorBot, colorTop, maxVal) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = '#1a2230'; ctx.lineWidth = 0.5;
  for (let i = 0; i < 5; i++) {
    const y = h * (i / 4);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // One gradient for the full height, reused for all bars
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
  ctx.fillStyle = '#4a6a55'; ctx.font = '9px monospace'; ctx.textAlign = 'right';
  ctx.fillText(Math.round(maxVal), w - 4, 10);
  ctx.fillText(Math.round(maxVal / 2), w - 4, h / 2 + 3);
  ctx.fillText('0', w - 4, h - 2);
  ctx.textAlign = 'left'; ctx.fillText('now', 4, h - 2);

  ctx.fillStyle = colorTop; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'right';
  ctx.fillText(Math.round(last), w - 4, h - (last / maxVal) * h - 6);
}

/* ── Speedometer gauge ── */
function drawSpeedometer(canvas, value, colorBot, colorTop) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2, cy = h - 20;
  const r = Math.min(cx - 20, cy - 10);
  const startA = Math.PI, endA = 2 * Math.PI;

  // Background arc
  ctx.beginPath(); ctx.arc(cx, cy, r, startA, endA);
  ctx.strokeStyle = '#1a2230'; ctx.lineWidth = 18; ctx.lineCap = 'butt'; ctx.stroke();

  // Gradient filled arc
  const frac = Math.max(0, Math.min(1, value / 100));
  const valA = startA + frac * Math.PI;
  const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
  grad.addColorStop(0, colorBot);
  grad.addColorStop(1, colorTop);
  ctx.beginPath(); ctx.arc(cx, cy, r, startA, valA);
  ctx.strokeStyle = grad; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.stroke();

  // Tick marks
  for (let i = 0; i <= 10; i++) {
    const a = startA + (i / 10) * Math.PI;
    const isMajor = i % 5 === 0;
    const inner = r - (isMajor ? 28 : 24);
    const outer = r - 14;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    ctx.strokeStyle = isMajor ? '#7a9a88' : '#2a3a50'; ctx.lineWidth = isMajor ? 1.5 : 1; ctx.stroke();
  }

  // Needle
  const needleA = startA + frac * Math.PI;
  const needleLen = r - 24;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(needleA) * needleLen, cy + Math.sin(needleA) * needleLen);
  ctx.strokeStyle = '#e4ecd8'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke();

  // Center dot
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#e4ecd8'; ctx.fill();

  // Value text
  ctx.fillStyle = colorTop; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center';
  ctx.fillText(Math.round(value) + '%', cx, cy - 16);

  // Scale labels
  ctx.fillStyle = '#7a9a88'; ctx.font = '10px monospace';
  ctx.textAlign = 'left'; ctx.fillText('0', cx - r - 4, cy + 14);
  ctx.textAlign = 'center'; ctx.fillText('50', cx, cy - r - 8);
  ctx.textAlign = 'right'; ctx.fillText('100', cx + r + 4, cy + 14);
}

/* ── Donut chart ── */
function drawDonut(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const cats = [
    { l: 'ASIC', v: 6, c1: GRAD.emeraldOrange[0], c2: GRAD.emeraldOrange[1] },
    { l: 'AI', v: 5, c1: GRAD.coralPurple[0], c2: GRAD.coralPurple[1] },
    { l: 'EDA', v: 6, c1: GRAD.cyanMagenta[0], c2: GRAD.cyanMagenta[1] },
    { l: 'Script', v: 5, c1: GRAD.yellowRed[0], c2: GRAD.yellowRed[1] },
  ];
  const total = cats.reduce((s, c) => s + c.v, 0);
  const cx = w / 2, cy = h / 2;
  const outerR = Math.min(cx, cy) - 14;
  const innerR = outerR * 0.58;
  const gap = 0.03;

  let angle = -Math.PI / 2;
  cats.forEach((c) => {
    const sweep = (c.v / total) * Math.PI * 2 - gap;
    const midA = angle + sweep / 2;

    // Gradient for segment
    const gx1 = cx + Math.cos(angle) * outerR;
    const gy1 = cy + Math.sin(angle) * outerR;
    const gx2 = cx + Math.cos(angle + sweep) * outerR;
    const gy2 = cy + Math.sin(angle + sweep) * outerR;
    const grad = ctx.createLinearGradient(gx1, gy1, gx2, gy2);
    grad.addColorStop(0, c.c1);
    grad.addColorStop(1, c.c2);

    // Draw segment
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, angle, angle + sweep);
    ctx.arc(cx, cy, innerR, angle + sweep, angle, true);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.globalAlpha = 0.9; ctx.fill();
    ctx.globalAlpha = 1;

    // Label line + text
    const labelR = outerR + 18;
    const lx = cx + Math.cos(midA) * labelR;
    const ly = cy + Math.sin(midA) * labelR;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(midA) * (outerR + 2), cy + Math.sin(midA) * (outerR + 2));
    ctx.lineTo(lx, ly);
    const endX = lx + (Math.cos(midA) > 0 ? 22 : -22);
    ctx.lineTo(endX, ly);
    ctx.strokeStyle = '#4a6a55'; ctx.lineWidth = 1; ctx.stroke();

    ctx.fillStyle = c.c2; ctx.font = 'bold 15px monospace';
    ctx.textAlign = Math.cos(midA) > 0 ? 'left' : 'right';
    ctx.fillText(c.l, endX + (Math.cos(midA) > 0 ? 6 : -6), ly - 4);
    ctx.fillStyle = '#c0d8cc'; ctx.font = 'bold 13px monospace';
    ctx.fillText(c.v + ' skills', endX + (Math.cos(midA) > 0 ? 6 : -6), ly + 12);

    angle += sweep + gap;
  });

  // Center text
  ctx.fillStyle = '#e4ecd8'; ctx.font = 'bold 32px monospace'; ctx.textAlign = 'center';
  ctx.fillText(total, cx, cy + 4);
  ctx.fillStyle = '#c0d8cc'; ctx.font = 'bold 13px monospace';
  ctx.fillText('total skills', cx, cy + 22);
}

/* ── Static charts ── */

function drawCodeActivity(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const wks = [120, 85, 140, 95, 160, 110, 180, 130, 200, 90, 150, 175];

  ctx.strokeStyle = '#1a2230'; ctx.lineWidth = 0.5;
  for (let i = 0; i < 4; i++) {
    const y = h * (i / 3);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.fillStyle = '#4a6a55'; ctx.font = '9px monospace'; ctx.textAlign = 'right';
  ctx.fillText('200', w - 4, 10); ctx.fillText('100', w - 4, h / 2); ctx.fillText('0', w - 4, h - 2);

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

/* ── System log stream ── */
const SYS_LOG_ENTRIES = [
  { t: 'INFO',  msg: 'synthesis complete — area 0.42mm²' },
  { t: 'OK',    msg: 'DRC clean — 0 violations' },
  { t: 'INFO',  msg: 'vcs compile — 847 modules loaded' },
  { t: 'WARN',  msg: 'timing slack -0.18ns @ clk_core' },
  { t: 'OK',    msg: 'coverage merge — 94.2% hit' },
  { t: 'INFO',  msg: 'git push origin main — 3 commits' },
  { t: 'OK',    msg: 'lint pass — spyglass clean' },
  { t: 'INFO',  msg: 'power analysis — 12.4mW dynamic' },
  { t: 'WARN',  msg: 'hold fix inserted — 23 buffers' },
  { t: 'OK',    msg: 'formal verify — all props proven' },
  { t: 'INFO',  msg: 'sim regression — 128/128 passed' },
  { t: 'OK',    msg: 'netlist export — gate count 1.2M' },
  { t: 'INFO',  msg: 'floorplan update — util 78%' },
  { t: 'WARN',  msg: 'clock skew 0.09ns @ pll_div2' },
  { t: 'OK',    msg: 'UPF check — iso/ret verified' },
  { t: 'INFO',  msg: 'testbench seed 0xA3F1 — pass' },
];

function SysLog() {
  const [lines, setLines] = React.useState([]);
  const idxRef = React.useRef(0);
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    // seed with first 3 lines
    const seed = SYS_LOG_ENTRIES.slice(0, 3).map((e, i) => ({
      ...e, id: i, ts: fmtTime(i)
    }));
    setLines(seed);
    idxRef.current = 3;

    const iv = setInterval(() => {
      const entry = SYS_LOG_ENTRIES[idxRef.current % SYS_LOG_ENTRIES.length];
      idxRef.current++;
      setLines(prev => {
        const next = [...prev, { ...entry, id: idxRef.current, ts: fmtTime(idxRef.current) }];
        return next.length > 6 ? next.slice(-6) : next;
      });
    }, 2200 + Math.random() * 1200);

    return () => clearInterval(iv);
  }, []);

  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  function fmtTime(seed) {
    const h = String(10 + (seed * 3) % 14).padStart(2, '0');
    const m = String((seed * 7) % 60).padStart(2, '0');
    const s = String((seed * 13) % 60).padStart(2, '0');
    return h + ':' + m + ':' + s;
  }

  const tagColor = { INFO: '#7a9a88', OK: '#22c55e', WARN: '#facc15' };

  return (
    <div className="cp-syslog-win">
      <div className="cp-syslog-bar">
        <span className="hf-term-dot hf-term-dot-r" />
        <span className="hf-term-dot hf-term-dot-y" />
        <span className="hf-term-dot hf-term-dot-g" />
        <span className="cp-syslog-title">~/syslog — monitor</span>
      </div>
      <div ref={containerRef} className="cp-syslog">
        {lines.map(l => (
          <div key={l.id} className="cp-syslog-line">
            <span className="cp-syslog-tag" style={{ color: tagColor[l.t] || '#7a9a88' }}>[{l.t}]</span>
            <span className="cp-syslog-msg">{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Small reusable components ── */

function Ticker() {
  return (
    <div className="cp-ticker">
      <div className="cp-ticker-track"
        dangerouslySetInnerHTML={{
          __html: '<span class="cp-ticker-item">' + TICKER_MSG + '</span>' +
                  '<span style="display:inline-block;width:80px"></span>' +
                  '<span class="cp-ticker-item">' + TICKER_MSG + '</span>'
        }}
      />
    </div>
  );
}

function Meter({ label, value, displayVal, color }) {
  return (
    <div className="cp-meter">
      <div className="cp-meter-lbl">{label}</div>
      <div className="cp-meter-bar">
        <div className="cp-meter-fill" style={{ width: value + '%', background: color }} />
      </div>
      <div className="cp-meter-val" style={{ color }}>{displayVal}</div>
    </div>
  );
}

function KnobRow({ knobs }) {
  return (
    <div className="cp-knob-row">
      {knobs.map((k, i) => (
        <div key={i} className="cp-knob">
          <KnobCanvas fraction={k.f} color={k.c} color2={k.c2} />
          <div className="cp-knob-val" style={{ color: k.c2 || k.c }}>{k.v}</div>
          <div className="cp-knob-lbl">{k.l}</div>
        </div>
      ))}
    </div>
  );
}

function Heatmap() {
  const cells = React.useMemo(() => {
    const levels = ['#1a2230', '#1a3a2a', '#1a5a3a', '#2a8a4a', '#4ac864', '#7ae87a'];
    return Array.from({ length: 84 }, () => levels[Math.floor(Math.random() * levels.length)]);
  }, []);
  return (
    <div className="cp-heatmap">
      {cells.map((c, i) => <div key={i} className="cp-hm-cell" style={{ background: c }} />)}
    </div>
  );
}

/* ═══════════════════════════════════════
   PAGE COMPONENTS
   ═══════════════════════════════════════ */

function PageOverview({ gpuRef, tpRef, playing, setPlaying, smooth, setSmooth, mode, setMode, goTo }) {
  const [gainVal, setGainVal] = React.useState(70);

  const distRef = React.useRef(null);
  React.useEffect(() => { drawDonut(distRef.current); }, []);

  return (
    <div className="cp-bento">
      {/* ── Row 1: Vitals — full width ── */}
      <div className="cp-tile cp-tile-full">
        <div className="cp-topic"><span className="cp-slash">//</span> vitals</div>
        <div className="cp-stat-row">
          <div className="cp-stat-card"><div className="cp-stat-bar" style={{ background: '#1ba0a0' }} /><div className="cp-stat-val" style={{ color: '#1ba0a0' }}>22</div><div className="cp-stat-lbl">Skills</div></div>
          <div className="cp-stat-card"><div className="cp-stat-bar" style={{ background: '#c8d837' }} /><div className="cp-stat-val" style={{ color: '#c8d837' }}>847</div><div className="cp-stat-lbl">Commits</div></div>
          <div className="cp-stat-card"><div className="cp-stat-bar" style={{ background: '#ffa94d' }} /><div className="cp-stat-val" style={{ color: '#ffa94d' }}>5</div><div className="cp-stat-lbl">Years</div></div>
          <div className="cp-stat-card"><div className="cp-stat-bar" style={{ background: '#ff6b6b' }} /><div className="cp-stat-val" style={{ color: '#ff6b6b' }}>3</div><div className="cp-stat-lbl">Tape-outs</div></div>
          <div className="cp-stat-card"><div className="cp-stat-bar" style={{ background: '#6ec8e6' }} /><div className="cp-stat-val" style={{ color: '#6ec8e6' }}>12</div><div className="cp-stat-lbl">Projects</div></div>
        </div>
      </div>

      {/* ── Row 2: Output rate + Proficiency side by side ── */}
      <div className="cp-tile cp-tile-a">
        <div className="cp-topic"><span className="cp-slash">//</span> output rate <span className="cp-sub">— live</span></div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 180 }}>
          <canvas ref={tpRef} width={320} height={180} style={{ width: '100%', maxWidth: 280, height: 'auto' }} />
        </div>
        <SysLog />
      </div>
      <div className="cp-tile cp-tile-b">
        <div className="cp-topic"><span className="cp-slash">//</span> proficiency</div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <canvas ref={distRef} width={500} height={380} style={{ width: '100%', maxWidth: 460, height: 'auto' }} />
        </div>
      </div>

      {/* ── Row 3: Skill growth (wide) + Commit streak (narrow) ── */}
      <div className="cp-bento-row3">
        <div className="cp-tile">
          <div className="cp-topic"><span className="cp-slash">//</span> skill growth <span className="cp-sub">— live</span></div>
          <div className="cp-ctrl">
            {['1m', '5m', '15m'].map((label, i) => (
              <div key={i} className={'cp-rb' + (mode === i ? ' cp-rb-on' : '')}
                onClick={() => setMode(i)}>{label}</div>
            ))}
            <div className={'cp-play' + (playing ? ' cp-play-on' : ' cp-play-off')}
              onClick={() => setPlaying(p => !p)}
              dangerouslySetInnerHTML={{ __html: playing ? '&#9654;' : '&#10074;&#10074;' }} />
            <div className="cp-tgl-wrap" onClick={() => setSmooth(s => !s)}>
              <div className={'cp-tgl' + (smooth ? ' cp-tgl-on' : '')}>
                <div className="cp-tgl-thumb" />
              </div>
              <span className="cp-tgl-lbl">smooth</span>
            </div>
            <div className="cp-sl-wrap" style={{ marginLeft: 'auto' }}>
              <span className="cp-sl-lbl">gain</span>
              <input type="range" className="cp-slider-h" min="0" max="100" value={gainVal} step="1"
                onChange={e => setGainVal(+e.target.value)} />
              <span className="cp-sl-lbl">{gainVal}</span>
            </div>
          </div>
          <div className="cp-chart-wrap">
            <div className="cp-axis-l">% proficiency</div>
            <canvas ref={gpuRef} width={740} height={130} style={{ width: '100%', height: 'auto' }} />
            <div className="cp-axis-b">timeline</div>
          </div>
        </div>
        <div className="cp-tile">
          <div className="cp-topic"><span className="cp-slash">//</span> commit streak</div>
          <Heatmap />
        </div>
      </div>

      {/* ── Row 4: Explore + Ticker — full width ── */}
      <div className="cp-tile cp-tile-full">
        <div className="cp-topic"><span className="cp-slash">//</span> explore <span className="cp-sub">— each module links to a dedicated skill page</span></div>
        <div className="cp-cat-btns">
          <div className="cp-cat-btn" style={{ borderColor: 'rgba(27,160,160,0.3)', color: '#1ba0a0', background: 'rgba(27,160,160,0.05)' }} onClick={() => goTo(1)}><span className="cp-cat-dot" style={{ background: '#1ba0a0' }} /> asic.core ›</div>
          <div className="cp-cat-btn" style={{ borderColor: 'rgba(255,107,107,0.3)', color: '#ff6b6b', background: 'rgba(255,107,107,0.05)' }} onClick={() => goTo(2)}><span className="cp-cat-dot" style={{ background: '#ff6b6b' }} /> ai.pipeline ›</div>
          <div className="cp-cat-btn" style={{ borderColor: 'rgba(110,200,230,0.3)', color: '#6ec8e6', background: 'rgba(110,200,230,0.05)' }} onClick={() => goTo(3)}><span className="cp-cat-dot" style={{ background: '#6ec8e6' }} /> eda.toolchain ›</div>
          <div className="cp-cat-btn" style={{ borderColor: 'rgba(200,216,55,0.3)', color: '#c8d837', background: 'rgba(200,216,55,0.05)' }} onClick={() => goTo(4)}><span className="cp-cat-dot" style={{ background: '#c8d837' }} /> scripts.src ›</div>
        </div>
        <Ticker />
      </div>
    </div>
  );
}

function PageASIC() {
  const teal = '#1ba0a0';
  return (
    <>
      <div className="cp-topic"><span className="cp-slash" style={{ color: teal }}>//</span> asic.core</div>
      <div className="cp-chip-grid">
        {ASIC_SKILLS.map((s, i) => (
          <a key={i} className="cp-chip" href={s.url} target="_blank" rel="noopener noreferrer"
            style={{ borderColor: 'rgba(27,160,160,0.3)', color: teal, background: 'rgba(27,160,160,0.06)' }}>{s.name} <span className="cp-chip-arr">→</span></a>
        ))}
      </div>

      <div className="cp-topic"><span className="cp-slash" style={{ color: teal }}>//</span> clk_domain</div>
      <ScopeCanvas />

      <div className="cp-topic"><span className="cp-slash" style={{ color: teal }}>//</span> parameters</div>
      <KnobRow knobs={[
        { l: 'CLK_FREQ', v: '500M', c: GRAD.periwinkleMint[0], c2: GRAD.periwinkleMint[1], f: 0.7 },
        { l: 'PIPE_DEPTH', v: '5', c: GRAD.periwinkleMint[0], c2: GRAD.periwinkleMint[1], f: 0.5 },
        { l: 'CACHE_SZ', v: '64K', c: GRAD.periwinkleMint[0], c2: GRAD.periwinkleMint[1], f: 0.6 },
        { l: 'VDD', v: '0.9V', c: GRAD.periwinkleMint[0], c2: GRAD.periwinkleMint[1], f: 0.45 },
      ]} />

      <div className="cp-topic"><span className="cp-slash" style={{ color: teal }}>//</span> bench</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Meter label="Coverage" value={98} displayVal="98.7%" color={teal} />
        <Meter label="Timing" value={88} displayVal="+0.12ns" color={teal} />
        <Meter label="Area" value={72} displayVal="0.8mm²" color={teal} />
      </div>

      <Ticker />
    </>
  );
}

function PageAI({ gpuRef, tpRef }) {
  const red = '#ff6b6b', ora = '#ffa94d';
  return (
    <>
      <div className="cp-topic"><span className="cp-slash" style={{ color: red }}>//</span> ai.pipeline</div>
      <div className="cp-chip-grid">
        {AI_SKILLS.map((s, i) => (
          <a key={i} className="cp-chip" href={s.url} target="_blank" rel="noopener noreferrer"
            style={{ borderColor: s.color + '4d', color: s.color, background: s.color + '0f' }}>{s.name} <span className="cp-chip-arr">→</span></a>
        ))}
      </div>

      <div className="cp-topic"><span className="cp-slash" style={{ color: red }}>//</span> skill growth <span className="cp-sub">— live</span></div>
      <div className="cp-chart-wrap">
        <div className="cp-axis-l">% growth</div>
        <canvas ref={gpuRef} width={720} height={110} style={{ width: '100%', height: 'auto' }} />
        <div className="cp-axis-b">timeline</div>
      </div>

      <div className="cp-topic"><span className="cp-slash" style={{ color: ora }}>//</span> output rate <span className="cp-sub">— live</span></div>
      <div className="cp-chart-wrap">
        <div className="cp-axis-l">output</div>
        <canvas ref={tpRef} width={720} height={110} style={{ width: '100%', height: 'auto' }} />
        <div className="cp-axis-b">timeline</div>
      </div>

      <div className="cp-topic"><span className="cp-slash" style={{ color: red }}>//</span> parameters</div>
      <KnobRow knobs={[
        { l: 'TEMP', v: '0.7', c: '#ffa94d', c2: '#ff00aa', f: 0.7 },
        { l: 'TOP_K', v: '40', c: '#ffa94d', c2: '#ff00aa', f: 0.4 },
        { l: 'CTX_LEN', v: '32k', c: '#ff6b6b', c2: '#a855f7', f: 0.8 },
        { l: 'BATCH', v: '16', c: '#ff6b6b', c2: '#a855f7', f: 0.5 },
      ]} />

      <div className="cp-topic"><span className="cp-slash" style={{ color: red }}>//</span> bench</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Meter label="Accuracy" value={91} displayVal="91.3%" color={red} />
        <Meter label="Tokens/s" value={78} displayVal="156" color={ora} />
        <Meter label="Context" value={64} displayVal="32k" color={red} />
      </div>

      <Ticker />
    </>
  );
}

function PageEDA() {
  const blue = '#6ec8e6';
  return (
    <>
      <div className="cp-topic"><span className="cp-slash" style={{ color: blue }}>//</span> eda.toolchain</div>
      <div className="cp-rnd-grid">
        {EDA_SKILLS.map((s, i) => <EdaRoundBtn key={i} skill={s} color={GRAD.periwinkleMint[0]} color2={GRAD.periwinkleMint[1]} />)}
      </div>

      <div className="cp-topic"><span className="cp-slash" style={{ color: blue }}>//</span> bench</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Meter label="Lint Pass" value={95} displayVal="95%" color={blue} />
        <Meter label="Synth QoR" value={88} displayVal="88%" color={blue} />
        <Meter label="Sim Speed" value={76} displayVal="76%" color={blue} />
      </div>
    </>
  );
}

function PageScripting() {
  const lime = '#c8d837';
  const codeRef = React.useRef(null);
  React.useEffect(() => { drawCodeActivity(codeRef.current); }, []);

  return (
    <>
      <div className="cp-topic"><span className="cp-slash" style={{ color: lime }}>//</span> scripts.src</div>
      <div>
        {SCRIPT_SKILLS.map((s, i) => (
          <a key={i} className="cp-list-row" href={s.url} target="_blank" rel="noopener noreferrer">
            <div className="cp-list-dot" style={{ background: s.color }} />
            <div className="cp-list-name">{s.name}</div>
            <div className="cp-list-tag" style={{ color: s.color }}>{s.tag}</div>
            <span style={{ color: '#7a9a88', fontSize: 12 }}>›</span>
          </a>
        ))}
      </div>

      <div className="cp-topic"><span className="cp-slash" style={{ color: lime }}>//</span> commit log</div>
      <div className="cp-chart-wrap">
        <div className="cp-axis-l">lines</div>
        <canvas ref={codeRef} width={720} height={110} style={{ width: '100%', height: 'auto' }} />
        <div className="cp-axis-b">week</div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════
   MAIN COCKPIT COMPONENT
   ═══════════════════════════════════════ */

function Cockpit() {
  const sectionRef = React.useRef(null);
  const sectionVisible = useOnScreen(sectionRef, 0.1);
  const inView = useInView(sectionRef, '300px 0px');

  // Stars
  const stars = React.useMemo(() => Array.from({ length: 150 }, () => ({
    x: Math.random() * 100, y: Math.random() * 100,
    r: 0.4 + Math.random() * 1.6, o: 0.08 + Math.random() * 0.5,
    d: Math.random() * 4, dur: 1.5 + Math.random() * 2.5,
  })), []);

  // Navigation with GSAP transitions
  const [page, setPage] = React.useState(0);
  const pageRefs = React.useRef([]);
  const isAnimating = React.useRef(false);

  // Set initial visibility on mount
  React.useEffect(() => {
    pageRefs.current.forEach((el, i) => {
      if (!el) return;
      if (i === 0) {
        el.style.display = 'block'; el.style.opacity = '1'; el.style.transform = 'none';
      } else {
        el.style.display = 'none'; el.style.opacity = '0';
      }
    });
  }, []);

  const goTo = React.useCallback((p) => {
    const next = ((p % TOTAL_PAGES) + TOTAL_PAGES) % TOTAL_PAGES;
    if (next === page || isAnimating.current) return;
    isAnimating.current = true;

    const dir = next > page ? 1 : -1;
    const oldEl = pageRefs.current[page];
    const newEl = pageRefs.current[next];
    if (!oldEl || !newEl) { isAnimating.current = false; return; }

    // Scroll section into view first
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const tl = gsap.timeline({
      onComplete: () => {
        oldEl.style.display = 'none';
        isAnimating.current = false;
      }
    });

    // Fade out + slide old page
    tl.to(oldEl, {
      opacity: 0, y: dir * -30, duration: 0.3, ease: 'power2.in',
    });

    // Show new page off-screen, then animate in
    newEl.style.display = 'block';
    gsap.set(newEl, { opacity: 0, y: dir * 40 });
    tl.to(newEl, {
      opacity: 1, y: 0, duration: 0.35, ease: 'power2.out',
    }, '-=0.1');

    setPage(next);
  }, [page]);

  // Chart controls
  const [playing, setPlaying] = React.useState(true);
  const [smooth, setSmooth] = React.useState(true);
  const [mode, setMode] = React.useState(0);

  // Canvas refs
  const gpuRef = React.useRef(null);
  const tpRef = React.useRef(null);
  const gpuRef2 = React.useRef(null);
  const tpRef2 = React.useRef(null);

  // Live data stored in ref to avoid re-renders
  const dataRef = React.useRef({
    gpu: initBarData(60),
    tp: initTpData(60),
    gTarget: 65,
    tTarget: 400,
    speedVal: 65,
    speedTarget: 65,
    fc: 0,
  });

  // Animation loop — only runs when section is near viewport
  React.useEffect(() => {
    if (!inView) return;
    let raf;
    const d = dataRef.current;
    const loop = () => {
      d.fc++;
      if (playing && d.fc % 50 === 0) {
        if (Math.random() < 0.15) d.gTarget = 10 + Math.random() * 80;
        if (Math.random() < 0.15) d.tTarget = 80 + Math.random() * 650;
        if (Math.random() < 0.2) d.speedTarget = 20 + Math.random() * 70;
        const gL = d.gpu[d.gpu.length - 1];
        const gN = gL + (d.gTarget - gL) * 0.18 + (Math.random() - 0.5) * 5;
        d.gpu.push(Math.max(3, Math.min(97, gN))); d.gpu.shift();
        const tL = d.tp[d.tp.length - 1];
        const tN = tL + (d.tTarget - tL) * 0.15 + (Math.random() - 0.5) * 25;
        d.tp.push(Math.max(40, Math.min(780, tN))); d.tp.shift();
      }
      // Smooth needle interpolation (every frame)
      d.speedVal += (d.speedTarget - d.speedVal) * 0.04 + (Math.random() - 0.5) * 0.3;
      d.speedVal = Math.max(5, Math.min(95, d.speedVal));

      // Draw to all visible canvases
      drawBars(gpuRef.current,  d.gpu, ...GRAD.roseGold, 100);
      drawSpeedometer(tpRef.current, d.speedVal, ...GRAD.greenYellow);
      drawBars(gpuRef2.current, d.gpu, ...GRAD.cyanMagenta, 100);
      drawBars(tpRef2.current,  d.tp,  ...GRAD.coralPurple, 800);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [inView, playing]);

  return (
    <section
      id="cv"
      className={'hf-section hf-cockpit' + (sectionVisible ? ' hf-visible' : '')}
      ref={sectionRef}
    >
      {/* Star field */}
      {inView && (
        <div className="cp-stars">
          {stars.map((s, i) => (
            <span key={i} className="cp-star" style={{
              left: s.x + '%', top: s.y + '%',
              width: s.r + 'px', height: s.r + 'px',
              opacity: s.o,
              animationDelay: s.d + 's',
              animationDuration: s.dur + 's',
            }} />
          ))}
        </div>
      )}

      {/* Dashboard container */}
      <div className="cp-dash">
        <div className="cp-scanline" />

        {/* Header with navigation */}
        <div className="cp-hdr">
          <div className="cp-hdr-left">
            <div className="cp-arr" onClick={() => goTo(page - 1)}>◀</div>
            <span className="cp-hdr-title">// skill_monitor.sv</span>
          </div>
          <div className="cp-dots">
            {Array.from({ length: TOTAL_PAGES }, (_, i) => (
              <span key={i}
                className={'cp-dt' + (i === page ? ' cp-dt-on' : '')}
                onClick={() => goTo(i)} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="cp-plbl">
              <span className="cp-sdot" style={{ background: PAGE_COLORS[page] }} />
              [{page + 1}/{TOTAL_PAGES}] {PAGE_NAMES[page]}
            </span>
            <div className="cp-arr" onClick={() => goTo(page + 1)}>▶</div>
          </div>
        </div>

        {/* Pages — GSAP animated transitions */}
        <div className="cp-page" ref={el => pageRefs.current[0] = el}>
          <PageOverview
            gpuRef={gpuRef} tpRef={tpRef}
            playing={playing} setPlaying={setPlaying}
            smooth={smooth} setSmooth={setSmooth}
            mode={mode} setMode={setMode}
            goTo={goTo}
          />
        </div>
        <div className="cp-page" ref={el => pageRefs.current[1] = el}>
          <PageASIC />
        </div>
        <div className="cp-page" ref={el => pageRefs.current[2] = el}>
          <PageAI gpuRef={gpuRef2} tpRef={tpRef2} />
        </div>
        <div className="cp-page" ref={el => pageRefs.current[3] = el}>
          <PageEDA />
        </div>
        <div className="cp-page" ref={el => pageRefs.current[4] = el}>
          <PageScripting />
        </div>
      </div>
    </section>
  );
}

window.Cockpit = Cockpit;
