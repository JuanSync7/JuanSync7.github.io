// Interactive terminal — auto-types on scroll, user can click to intercept

function Terminal() {
  const ref = React.useRef(null);
  const visible = useOnScreen(ref, 0.4);
  const inView = useInView(ref, '300px 0px');

  const nebStars = React.useMemo(() => Array.from({length: 120}, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    r: 0.3 + Math.random() * 1.4,
    o: 0.06 + Math.random() * 0.4,
    d: Math.random() * 5,
    dur: 1.5 + Math.random() * 2.5,
  })), []);
  const [lines, setLines] = React.useState([]);
  const [cursorVisible, setCursorVisible] = React.useState(true);
  const [userMode, setUserMode] = React.useState(false);
  const [userInput, setUserInput] = React.useState('');
  const inputRef = React.useRef(null);
  const hasTyped = React.useRef(false);

  const script = [
    { type: 'cmd', text: 'cat summary.md' },
    { type: 'block', title: '# professional summary', meta: 'ASIC Design Engineer · Hardware-Software Co-optimization', items: [
      '> expertise in SoC architecture, front-end design flows, functional verification',
      '> HDL coding, code coverage analysis, constraint-random verification, synthesis, DFT',
      '> exploring AI agents, MCP & RAG for automated chip design workflows',
    ]},
    { type: 'cmd', text: 'ls -t ~/career/' },
    { type: 'out', text: ['aion-senior.md*', 'aion-asic.md', 'southampton.md'] },
    { type: 'hint', text: '# 3 files found — reading latest first...' },
    { type: 'cmd', text: 'cat aion-senior.md' },
    { type: 'block', title: '# senior design engineer', meta: 'aion silicon · london · aug 2025 — present', items: [
      '> automated front-end flows w/ python, tcl, shell — reduced manual effort',
      '> re-engineered risc-v vector core → external vpu accelerator',
      '> ensured ISA compliance & efficient hazard detection',
    ]},
    { type: 'cmd', text: 'cat aion-asic.md' },
    { type: 'block', title: '# asic design engineer', meta: 'aion silicon · reading · sep 2023 — jul 2025', items: [
      '> led front-end design w/ systemverilog for complex IP & SoC',
      '> constrained-random verification, functional coverage plans',
      '> DFT implementation — ASIL-B compliant SoCs, 90%+ coverage (synopsys testmax)',
      '> established company-wide linting w/ synopsys & siemens tools',
      '> early-stage design exploration using synopsys RTL-Architect',
      '> system-level architecture — integrating 3rd-party & in-house IP',
    ]},
    { type: 'cmd', text: 'cat southampton.md' },
    { type: 'block', title: '# meng, electrical & electronic eng', meta: 'univ. of southampton · 2019 — 2023', items: [] },
  ];

  // Easter egg responses
  const fileBlocks = {
    'summary.md': script.find(s => s.title === '# professional summary'),
    'aion-senior.md': script.find(s => s.title === '# senior design engineer'),
    'aion-asic.md': script.find(s => s.title === '# asic design engineer'),
    'southampton.md': script.find(s => s.title === '# meng, electrical & electronic eng'),
  };

  const easterEggs = {
    'whoami': 'Shew Juan Kok — Senior Design & AI Engineer, silicon whisperer.',
    'sudo hire-me': '[sudo] hiring process initiated... sending CV to all recruiters ✓',
    'help': 'Available: ls, cat <file>.md, whoami, sudo hire-me, clear, neofetch',
    'clear': '__CLEAR__',
    'ls': '__LS__',
    'ls -t': '__LS__',
    'ls -la': '__LS__',
    'neofetch': `
   ╔═══════════════╗    juan@silicon
   ║  JUAN-SOC     ║    -----------
   ║  1999-X1      ║    OS: Silicon Brain v2.0
   ╚═══════════════╝    Host: Aion Silicon, London
                         Kernel: RISC-V + AI
                         Shell: zsh 5.9
                         Languages: SV, Py, TCL, Rust
                         Uptime: since 1999`,
  };

  React.useEffect(() => {
    if (!visible || hasTyped.current) return;
    hasTyped.current = true;

    let lineIdx = 0;
    let charIdx = 0;
    let currentLines = [];

    const typeNext = () => {
      if (lineIdx >= script.length) {
        setUserMode(true);
        return;
      }
      const item = script[lineIdx];
      if (item.type === 'cmd') {
        // Type command char by char
        const cmd = item.text;
        charIdx = 0;
        const typeChar = () => {
          charIdx++;
          const partial = cmd.substring(0, charIdx);
          setLines([...currentLines, { type: 'cmd-typing', text: partial }]);
          if (charIdx < cmd.length) {
            setTimeout(typeChar, 30 + Math.random() * 50);
          } else {
            currentLines = [...currentLines, { type: 'cmd', text: cmd }];
            setLines([...currentLines]);
            lineIdx++;
            setTimeout(typeNext, 200);
          }
        };
        setTimeout(typeChar, 400);
      } else {
        // Output appears instantly
        currentLines = [...currentLines, item];
        setLines([...currentLines]);
        lineIdx++;
        setTimeout(typeNext, 300);
      }
    };
    setTimeout(typeNext, 600);
  }, [visible]);

  // Cursor blink
  React.useEffect(() => {
    const i = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(i);
  }, []);

  const handleUserSubmit = (e) => {
    e.preventDefault();
    const cmd = userInput.trim().toLowerCase();
    if (!cmd) return;
    let response;
    if (easterEggs[cmd] === '__CLEAR__') {
      setLines([]);
      setUserInput('');
      if (ref.current) {
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    } else if (easterEggs[cmd] === '__LS__') {
      setLines(prev => [
        ...prev,
        { type: 'cmd', text: cmd },
        { type: 'out', text: ['aion-senior.md*', 'aion-asic.md', 'southampton.md'] },
      ]);
      setUserInput('');
      return;
    } else if (cmd === 'cat') {
      response = 'usage: cat <file>  — try: cat aion-senior.md';
    } else if (cmd.startsWith('cat ')) {
      const file = cmd.substring(4).trim();
      const block = fileBlocks[file];
      if (block) {
        setLines(prev => [
          ...prev,
          { type: 'cmd', text: cmd },
          block,
        ]);
        setUserInput('');
        return;
      } else {
        response = `cat: ${file}: No such file or directory. Try: aion-senior.md, aion-asic.md, southampton.md`;
      }
    } else if (easterEggs[cmd]) {
      response = easterEggs[cmd];
    } else {
      response = `zsh: command not found: ${cmd}. Try 'help'`;
    }
    setLines(prev => [
      ...prev,
      { type: 'cmd', text: cmd },
      { type: 'response', text: response },
    ]);
    setUserInput('');
  };

  const focusInput = () => {
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <section id="work" className="hf-section hf-term-section" ref={ref}>
      {inView && <div className="hf-term-nebula">
        {nebStars.map((s, i) => (
          <span key={i} className="hf-term-nebula-star" style={{
            left: s.x+'%', top: s.y+'%',
            width: s.r+'px', height: s.r+'px',
            opacity: s.o,
            animationDelay: s.d+'s',
            animationDuration: s.dur+'s',
          }} />
        ))}
      </div>}
      <div className="hf-term-window" onClick={focusInput}>
        <div className="hf-term-bar">
          <span className="hf-term-dot hf-term-dot-r" />
          <span className="hf-term-dot hf-term-dot-y" />
          <span className="hf-term-dot hf-term-dot-g" />
          <span className="hf-term-title">~/career — zsh</span>
        </div>
        <div className="hf-term-body">
          {lines.map((line, i) => {
            if (line.type === 'cmd-typing') {
              return (
                <div key={i} className="hf-term-line">
                  <span className="hf-prompt">juan@silicon</span>
                  <span className="hf-tilde">:~/career$</span>{' '}
                  <span>{line.text}</span>
                  <span className="hf-cursor-inline">▊</span>
                </div>
              );
            }
            if (line.type === 'cmd') {
              return (
                <div key={i} className="hf-term-line">
                  <span className="hf-prompt">juan@silicon</span>
                  <span className="hf-tilde">:~/career$</span>{' '}
                  <span>{line.text}</span>
                </div>
              );
            }
            if (line.type === 'out') {
              return (
                <div key={i} className="hf-term-out-grid">
                  {line.text.map((t, j) => <span key={j} className="hf-term-file">{t}</span>)}
                </div>
              );
            }
            if (line.type === 'hint') {
              return <div key={i} className="hf-term-hint-line">{line.text}</div>;
            }
            if (line.type === 'block') {
              return (
                <div key={i} className={`hf-term-block ${i <= 4 ? 'hf-term-block-active' : ''}`}>
                  <div className="hf-term-block-title">{line.title}</div>
                  <div className="hf-term-block-meta">{line.meta}</div>
                  {line.items.map((item, j) => <div key={j} className="hf-term-block-item">{item}</div>)}
                </div>
              );
            }
            if (line.type === 'response') {
              return <div key={i} className="hf-term-response">{line.text}</div>;
            }
            return null;
          })}

          {/* Active prompt */}
          {userMode && (
            <form onSubmit={handleUserSubmit} className="hf-term-input-row">
              <span className="hf-prompt">juan@silicon</span>
              <span className="hf-tilde">:~/career$</span>{' '}
              <input
                ref={inputRef}
                className="hf-term-input"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                spellCheck="false"
                autoComplete="off"
              />
              <span className={`hf-cursor-inline ${cursorVisible ? '' : 'hf-cursor-hide'}`}>▊</span>
            </form>
          )}

          {!userMode && lines.length > 0 && lines[lines.length-1].type !== 'cmd-typing' && (
            <div className="hf-term-line">
              <span className="hf-prompt">juan@silicon</span>
              <span className="hf-tilde">:~/career$</span>{' '}
              <span className={`hf-cursor-inline ${cursorVisible ? '' : 'hf-cursor-hide'}`}>▊</span>
            </div>
          )}
        </div>
        <div className="hf-term-hint">click to type · try: whoami, sudo hire-me, neofetch</div>
      </div>
    </section>
  );
}

window.Terminal = Terminal;
