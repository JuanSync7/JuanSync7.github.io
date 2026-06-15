import { useEffect, useState } from 'react';
import { STATUS_META } from './series-data';

export function useCountdown(targetISO: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const diff = Math.max(0, new Date(targetISO).getTime() - now);
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

export function CountdownText({ targetISO, color }: { targetISO: string; color: string }) {
  const c = useCountdown(targetISO);
  return (
    <span style={{ color, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>
      {c.d}d {pad(c.h)}h {pad(c.m)}m {pad(c.s)}s
    </span>
  );
}

export function Sparkline({ data, color, height = 20 }: { data: number[]; color: string; height?: number }) {
  if (!data || data.length === 0) {
    return <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 10, color: '#4a6a55' }}>no runs yet</span>;
  }
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height }}>
      {data.map((v, i) => (
        <div key={i} style={{ width: 4, height: `${Math.max(14, (v / max) * 100)}%`, background: i === data.length - 1 ? color : `${color}55`, boxShadow: i === data.length - 1 ? `0 0 6px ${color}88` : 'none', borderRadius: 1 }} />
      ))}
    </div>
  );
}

export function StatusDot({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.active;
  return (
    <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.color, flexShrink: 0, boxShadow: `0 0 8px ${m.color}aa`, animation: m.pulse ? 'navDotPulse 2s ease-in-out infinite' : 'none' }} />
  );
}

export function CadenceBadge({ cadence, color }: { cadence: string; color: string }) {
  return (
    <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999, border: `1px solid ${color}44`, background: `${color}11`, whiteSpace: 'nowrap' }}>↻ {cadence}</span>
  );
}
