// Hero — editorial kinetic type with neon flicker + routine sequencer

function NeonText({ children }) {
  // Broken neon sign effect — random flickers via CSS + JS randomization
  const [flicker, setFlicker] = React.useState(false);
  React.useEffect(() => {
    const loop = () => {
      const delay = 2000 + Math.random() * 4000;
      setTimeout(() => {
        setFlicker(true);
        const dur = 50 + Math.random() * 150;
        setTimeout(() => {
          setFlicker(false);
          // occasional double-flicker
          if (Math.random() > 0.5) {
            setTimeout(() => {
              setFlicker(true);
              setTimeout(() => { setFlicker(false); loop(); }, 40 + Math.random() * 80);
            }, 60);
          } else { loop(); }
        }, dur);
      }, delay);
    };
    loop();
  }, []);

  return (
    <span className={`hf-neon ${flicker ? 'hf-neon-off' : ''}`}>{children}</span>
  );
}

function KineticWord({ word, altWord, delay, loop, strikePrefix, underlinePrefix, variant }) {
  // Word that glitches/scrambles then settles — optionally loops forever
  const [text, setText] = React.useState(word);
  const [glitching, setGlitching] = React.useState(false);
  const [settled, setSettled] = React.useState(true); // starts true for initial word
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const currentRef = React.useRef(word);
  const settleTimer = React.useRef(null);

  React.useEffect(() => {
    let cancelled = false;

    function glitchTo(target, cb) {
      if (cancelled) return;
      setGlitching(true);
      setSettled(false);
      if (settleTimer.current) clearTimeout(settleTimer.current);
      let count = 0;
      const interval = setInterval(() => {
        if (cancelled) { clearInterval(interval); return; }
        count++;
        const progress = count / 14;
        const scrambled = target.split('').map((c, i) => {
          if (i / target.length < progress) return c;
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        setText(scrambled);
        if (count >= 14) {
          clearInterval(interval);
          setText(target);
          currentRef.current = target;
          setGlitching(false);
          // Wait 1s then apply settled styling (strike/underline)
          settleTimer.current = setTimeout(() => {
            if (!cancelled) setSettled(true);
          }, 1000);
          if (cb) cb();
        }
      }, 55);
    }

    function startLoop() {
      if (cancelled) return;
      const pause = 3000 + Math.random() * 3000;
      setTimeout(() => {
        if (cancelled) return;
        const next = currentRef.current === word ? (altWord || word) : word;
        glitchTo(next, () => {
          if (loop) startLoop();
        });
      }, pause);
    }

    // Initial delay before first glitch
    const timer = setTimeout(() => {
      const target = altWord || word;
      glitchTo(target, () => {
        if (loop) startLoop();
      });
    }, delay || 1500);

    return () => { cancelled = true; clearTimeout(timer); if (settleTimer.current) clearTimeout(settleTimer.current); };
  }, []);

  const isOriginal = !glitching && currentRef.current === word;
  const isAlt = !glitching && currentRef.current === (altWord || word);

  // "not software." settled → after 1s, strike through "not "
  if (strikePrefix && isOriginal && !glitching) {
    const prefix = strikePrefix;
    const rest = currentRef.current.substring(prefix.length);
    return (
      <span className="hf-kinetic">
        <span className={`hf-strike ${settled ? 'hf-struck' : ''}`} style={{ marginRight: '20px' }}>
          {prefix.trim()}
          <span className="hf-strike-line" />
        </span>
        {rest}
      </span>
    );
  }

  // "or maybe both?" settled → after 1s, underline "or maybe" in lime green
  if (underlinePrefix && isAlt && !glitching) {
    const uPrefix = underlinePrefix;
    const rest = currentRef.current.substring(uPrefix.length);
    return (
      <span className="hf-kinetic">
        <span className={`hf-underline-prefix ${settled ? 'hf-underlined' : ''}`}>
          {uPrefix.trim()}
        </span>
        {' '}{rest}
      </span>
    );
  }

  const glitchClass = glitching ? (variant === 2 ? 'hf-kinetic-active-2' : 'hf-kinetic-active') : '';
  return <span className={`hf-kinetic ${glitchClass}`}>{text}</span>;
}

function StrikeThrough({ children }) {
  const [struck, setStruck] = React.useState(false);
  React.useEffect(() => {
    setTimeout(() => setStruck(true), 2200);
  }, []);
  return (
    <span className={`hf-strike ${struck ? 'hf-struck' : ''}`}>
      {children}
      <span className="hf-strike-line" />
    </span>
  );
}


function PacmanText({ text, delay }) {
  const fullText = '(' + text + ')';
  const wrapRef = React.useRef(null);
  const textRef = React.useRef(null);
  const [phase, setPhase] = React.useState('idle');
  const [eatProgress, setEatProgress] = React.useState(0);
  const [spitChars, setSpitChars] = React.useState(0);
  const [exitProgress, setExitProgress] = React.useState(0);
  const [mouthOpen, setMouthOpen] = React.useState(true);
  const cancelledRef = React.useRef(false);

  // Mouth chomp
  React.useEffect(() => {
    const i = setInterval(() => setMouthOpen(m => !m), 110);
    return () => clearInterval(i);
  }, []);

  function runCycle() {
    if (cancelledRef.current) return;
    setEatProgress(0);
    setSpitChars(0);
    setExitProgress(0);

    setPhase('eating');
    let p = 0;
    const eatInterval = setInterval(() => {
      if (cancelledRef.current) { clearInterval(eatInterval); return; }
      p += 0.012;
      if (p >= 1.06) {
        p = 1.06;
        clearInterval(eatInterval);
        setEatProgress(1.06);
        setPhase('paused');
        setTimeout(() => {
          if (cancelledRef.current) return;
          setPhase('spitting');
          let chars = 0;
          const spitInterval = setInterval(() => {
            if (cancelledRef.current) { clearInterval(spitInterval); return; }
            chars++;
            setSpitChars(chars);
            if (chars >= fullText.length) {
              clearInterval(spitInterval);
              setTimeout(() => {
                if (cancelledRef.current) return;
                setPhase('exiting');
                let ex = 0;
                const exitInterval = setInterval(() => {
                  if (cancelledRef.current) { clearInterval(exitInterval); return; }
                  ex += 0.025;
                  if (ex >= 1) {
                    ex = 1;
                    clearInterval(exitInterval);
                    setExitProgress(1);
                    setPhase('hidden');
                    setTimeout(() => {
                      if (cancelledRef.current) return;
                      runCycle();
                    }, 5000);
                  }
                  setExitProgress(ex);
                }, 30);
              }, 400);
            }
          }, 60);
        }, 600);
      }
      setEatProgress(p);
    }, 45);
  }

  React.useEffect(() => {
    cancelledRef.current = false;
    const t = setTimeout(() => runCycle(), delay || 3500);
    return () => { cancelledRef.current = true; clearTimeout(t); };
  }, []);

  const pacSize = 28;

  let showPac = false;
  let pacX = 0;
  let clipStyle = {};
  let showFullText = false;
  let spitText = '';

  if (phase === 'idle' || phase === 'hidden') {
    showFullText = true;
  } else if (phase === 'eating') {
    showPac = true;
    pacX = eatProgress * 100;
    clipStyle = { clipPath: `inset(0 0 0 ${eatProgress * 100}%)` };
  } else if (phase === 'paused') {
    showPac = true;
    pacX = 106;
    clipStyle = { clipPath: 'inset(0 0 0 100%)' };
  } else if (phase === 'spitting') {
    showPac = true;
    pacX = 106;
    spitText = fullText.substring(0, spitChars);
    clipStyle = { visibility: 'hidden' };
  } else if (phase === 'exiting') {
    showPac = true;
    pacX = 106 + exitProgress * 40;
    showFullText = true;
  }

  return (
    <div className="hf-gameboy">
      <div className="hf-gameboy-bezel">
        <div className="hf-gameboy-screen">
          {/* Invisible sizer — always holds the full text width */}
          <span className="hf-gb-sizer">{fullText}</span>
          <span className="hf-pacman-wrap" ref={wrapRef} style={{ overflow: phase === 'exiting' ? 'visible' : undefined }}>
            <span className="hf-pacman-text-area" style={{ position: 'relative' }}>
              <span className="hf-gb-text" ref={textRef} style={showFullText ? {} : clipStyle}>
                {fullText}
              </span>
            </span>
            {phase === 'spitting' && spitText && (
              <span className="hf-gb-text" style={{
                position: 'absolute',
                right: 0,
                top: 0,
                whiteSpace: 'nowrap',
              }}>
                {spitText}
              </span>
            )}
            {showPac && (
              <span className="hf-pacman" style={{
                left: `calc(${pacX}% - ${pacSize / 2}px)`,
                transform: phase === 'spitting' || phase === 'paused' ? 'scaleX(-1)' : 'none',
              }}>
                <svg width={pacSize} height={pacSize} viewBox="0 0 24 24">
                  <path d="M12,2 A10,10 0 1,1 12,22 A10,10 0 1,1 12,2 Z" fill="var(--hf-accent)"
                    style={{clipPath: mouthOpen
                      ? 'polygon(0 0, 100% 0, 100% 28%, 42% 50%, 100% 72%, 100% 100%, 0 100%)'
                      : 'polygon(0 0, 100% 0, 100% 44%, 42% 50%, 100% 56%, 100% 100%, 0 100%)'
                    }} />
                  <circle cx="9" cy="7" r="2" fill="#0a1a0a" />
                </svg>
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const ref = React.useRef(null);
  const visible = useOnScreen(ref, 0.1);

  return (
    <section id="about" className={`hf-section hf-hero ${visible ? 'hf-visible' : ''}`} ref={ref}>
      <div className="hf-hero-tagrow">
        <span>// 0x00. introduction</span>
        <span className="hf-blink">_</span>
      </div>

      <div className="hf-hero-display">
        <div className="hf-hero-line">
          <span className="hf-hw">I</span>
          <KineticWord word="design" altWord="build" delay={800} loop />
          <NeonText>silicon,</NeonText>
        </div>
        <div className="hf-hero-line hf-hero-shift">
          <KineticWord word="not software." altWord="or maybe both?" delay={3000} loop strikePrefix="not " underlinePrefix="or maybe " variant={2} />
        </div>
        <div className="hf-hero-line">
          <PacmanText text="ai is eating the chip flow." delay={3500} />
        </div>
      </div>

      <div className="hf-hero-meta">
        <div className="hf-meta-card">
          <div className="hf-meta-lbl">now</div>
          <div className="hf-meta-val">Senior Design Engineer — front-end design, verification, SoC architecture, synthesis & DFT. Exploring AI agents, MCP & RAG to automate chip design workflows.</div>
        </div>
        <div className="hf-meta-card">
          <div className="hf-meta-lbl">stack</div>
          <div className="hf-meta-val">SV, UVM, py, tcl, bash<br/>+MCP / RAG / AI harness<br/>+eda tools</div>
        </div>
        <div className="hf-meta-card">
          <div className="hf-meta-lbl">status</div>
          <div className="hf-meta-val"><span className="hf-status-dot" /> open to chat and collaborate</div>
        </div>
      </div>

      <RoutineSequencer />
    </section>
  );
}

window.NeonText = NeonText;
window.Hero = Hero;
