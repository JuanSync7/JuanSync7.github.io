import { useEffect, useRef } from 'react';
import { drawCodeActivity } from './draw/code-activity';
import { SCRIPT_SKILLS } from './cockpit-data';

const LIME = 'var(--cp-script)';

export default function PageScripting() {
  const codeRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    drawCodeActivity(codeRef.current);
  }, []);

  return (
    <>
      <div className="cp-topic"><span className="cp-slash" style={{ color: LIME }}>//</span> scripts.src</div>
      <div>
        {SCRIPT_SKILLS.map((s, i) => (
          <a key={i} className="cp-list-row" href={s.url} target="_blank" rel="noopener noreferrer">
            <div className="cp-list-dot" style={{ background: s.color }} />
            <div className="cp-list-name">{s.name}</div>
            <div className="cp-list-tag" style={{ color: s.color }}>{s.tag}</div>
            <span className="cp-list-arrow">›</span>
          </a>
        ))}
      </div>

      <div className="cp-topic"><span className="cp-slash" style={{ color: LIME }}>//</span> commit log</div>
      <div className="cp-chart-wrap">
        <div className="cp-axis-l">lines</div>
        <canvas ref={codeRef} width={720} height={110} className="cp-canvas-fluid" />
        <div className="cp-axis-b">week</div>
      </div>
    </>
  );
}
