import type { ReactNode } from 'react';

export function TweakSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color: '#4a6a55', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</div>
      {children}
    </div>
  );
}

export function TweakToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 11, color: '#c0d8cc' }}>{label}</span>
      <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)}
        style={{ position: 'relative', width: 32, height: 18, border: 'none', borderRadius: 999, background: value ? '#c8d837' : '#243028', cursor: 'pointer', padding: 0, transition: 'background 0.15s' }}>
        <span style={{ position: 'absolute', top: 2, left: value ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: '#0a0a0a', transition: 'left 0.15s' }} />
      </button>
    </div>
  );
}

export function TweakRadio<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 11, color: '#c0d8cc' }}>{label}</span>
      <div style={{ display: 'flex', gap: 4, background: '#0a0a0a', border: '1px solid #243028', borderRadius: 6, padding: 3 }}>
        {options.map((o) => (
          <button key={o} type="button" onClick={() => onChange(o)}
            style={{ flex: 1, border: 'none', borderRadius: 4, padding: '5px 4px', cursor: 'pointer', fontFamily: 'var(--hf-mono)', fontSize: 10, letterSpacing: '0.02em', textTransform: 'lowercase', background: o === value ? '#c8d837' : 'transparent', color: o === value ? '#0a0a0a' : '#7a9a88', fontWeight: o === value ? 600 : 400, transition: 'all 0.15s' }}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
