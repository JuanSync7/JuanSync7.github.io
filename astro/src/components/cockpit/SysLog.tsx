import { useEffect, useRef, useState } from 'react';
import { PALETTE } from './cockpit-palette';
import { SYS_LOG_ENTRIES, type SysLogEntry } from './cockpit-data';

interface Line extends SysLogEntry {
  id: number;
  ts: string;
}

function fmtTime(seed: number): string {
  const h = String(10 + (seed * 3) % 14).padStart(2, '0');
  const m = String((seed * 7) % 60).padStart(2, '0');
  const s = String((seed * 13) % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

const TAG_COLOR: Record<SysLogEntry['t'], string> = {
  INFO: PALETTE.inkSoft,
  OK: PALETTE.okGreen,
  WARN: PALETTE.warnYel,
};

export default function SysLog() {
  const [lines, setLines] = useState<Line[]>([]);
  const idxRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLines(
      SYS_LOG_ENTRIES.slice(0, 3).map((e, i) => ({ ...e, id: i, ts: fmtTime(i) })),
    );
    idxRef.current = 3;

    const iv = setInterval(() => {
      const entry = SYS_LOG_ENTRIES[idxRef.current % SYS_LOG_ENTRIES.length];
      idxRef.current++;
      setLines((prev) => {
        const next = [
          ...prev,
          { ...entry, id: idxRef.current, ts: fmtTime(idxRef.current) },
        ];
        return next.length > 6 ? next.slice(-6) : next;
      });
    }, 2200 + Math.random() * 1200);

    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="cp-syslog-win">
      <div className="cp-syslog-bar">
        <span className="hf-term-dot hf-term-dot-r" />
        <span className="hf-term-dot hf-term-dot-y" />
        <span className="hf-term-dot hf-term-dot-g" />
        <span className="cp-syslog-title">~/syslog — monitor</span>
      </div>
      <div ref={containerRef} className="cp-syslog">
        {lines.map((l) => (
          <div key={l.id} className="cp-syslog-line">
            <span className="cp-syslog-tag" style={{ color: TAG_COLOR[l.t] }}>
              [{l.t}]
            </span>
            <span className="cp-syslog-msg">{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
