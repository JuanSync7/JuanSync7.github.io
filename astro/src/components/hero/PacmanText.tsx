import { useEffect, useRef, useState, type CSSProperties } from 'react';

interface Props {
  text: string;
  delay?: number;
}

type Phase = 'idle' | 'eating' | 'paused' | 'spitting' | 'exiting' | 'hidden';

const PAC_SIZE = 28;

export default function PacmanText({ text, delay = 3500 }: Props) {
  const fullText = `(${text})`;
  const [phase, setPhase] = useState<Phase>('idle');
  const [eatProgress, setEatProgress] = useState(0);
  const [spitChars, setSpitChars] = useState(0);
  const [exitProgress, setExitProgress] = useState(0);
  const [mouthOpen, setMouthOpen] = useState(true);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const i = setInterval(() => setMouthOpen((m) => !m), 110);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    cancelledRef.current = false;

    const runCycle = () => {
      if (cancelledRef.current) return;
      setEatProgress(0);
      setSpitChars(0);
      setExitProgress(0);
      setPhase('eating');

      let p = 0;
      const eatInterval = setInterval(() => {
        if (cancelledRef.current) {
          clearInterval(eatInterval);
          return;
        }
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
              if (cancelledRef.current) {
                clearInterval(spitInterval);
                return;
              }
              chars++;
              setSpitChars(chars);
              if (chars >= fullText.length) {
                clearInterval(spitInterval);
                setTimeout(() => {
                  if (cancelledRef.current) return;
                  setPhase('exiting');
                  let ex = 0;
                  const exitInterval = setInterval(() => {
                    if (cancelledRef.current) {
                      clearInterval(exitInterval);
                      return;
                    }
                    ex += 0.025;
                    if (ex >= 1) {
                      ex = 1;
                      clearInterval(exitInterval);
                      setExitProgress(1);
                      setPhase('hidden');
                      setTimeout(() => {
                        if (!cancelledRef.current) runCycle();
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
    };

    const t = setTimeout(runCycle, delay);
    return () => {
      cancelledRef.current = true;
      clearTimeout(t);
    };
  }, [delay, fullText]);

  let showPac = false;
  let pacX = 0;
  let clipStyle: CSSProperties = {};
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

  const flipPac = phase === 'spitting' || phase === 'paused';
  const mouthClip = mouthOpen
    ? 'polygon(0 0, 100% 0, 100% 28%, 42% 50%, 100% 72%, 100% 100%, 0 100%)'
    : 'polygon(0 0, 100% 0, 100% 44%, 42% 50%, 100% 56%, 100% 100%, 0 100%)';

  return (
    <div className="hf-gameboy">
      <div className="hf-gameboy-bezel">
        <div className="hf-gameboy-screen">
          <span className="hf-gb-sizer">{fullText}</span>
          <span
            className="hf-pacman-wrap"
            style={{ overflow: phase === 'exiting' ? 'visible' : undefined }}
          >
            <span className="hf-pacman-text-area" style={{ position: 'relative' }}>
              <span className="hf-gb-text" style={showFullText ? undefined : clipStyle}>
                {fullText}
              </span>
            </span>
            {phase === 'spitting' && spitText && (
              <span
                className="hf-gb-text"
                style={{ position: 'absolute', right: 0, top: 0, whiteSpace: 'nowrap' }}
              >
                {spitText}
              </span>
            )}
            {showPac && (
              <span
                className="hf-pacman"
                style={{
                  left: `calc(${pacX}% - ${PAC_SIZE / 2}px)`,
                  transform: flipPac ? 'scaleX(-1)' : 'none',
                }}
              >
                <svg width={PAC_SIZE} height={PAC_SIZE} viewBox="0 0 24 24">
                  <path
                    d="M12,2 A10,10 0 1,1 12,22 A10,10 0 1,1 12,2 Z"
                    fill="var(--hf-accent)"
                    style={{ clipPath: mouthClip }}
                  />
                  <circle cx="9" cy="7" r="2" fill="var(--hf-pacman-eye)" />
                </svg>
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
