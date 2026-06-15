import { useEffect, useRef, useState, type FormEvent } from 'react';
import { getGsap, getScrollTrigger } from './gsap';
import { HUDCorner } from './fx';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const g = getGsap();
    if (!g || !ref.current) return;
    const st = getScrollTrigger();
    g.fromTo(ref.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', scrollTrigger: st ? { trigger: ref.current, start: 'top 85%' } : undefined });
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (email.includes('@')) setSubmitted(true);
  };

  return (
    <div ref={ref} style={{ position: 'relative', marginTop: 56, marginBottom: 40, opacity: 0, background: '#0e0e0e', border: '1.5px solid #243028', borderRadius: 12, padding: '32px 36px', overflow: 'hidden' }}>
      <HUDCorner position="top-left" color="#d300c5" />
      <HUDCorner position="bottom-right" color="#d300c5" />
      <div style={{ position: 'relative', zIndex: 3 }}>
        <div style={{ fontFamily: 'var(--hf-mono)', fontSize: 10, color: '#d300c5', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>// subscribe.sh</div>
        <h3 style={{ fontFamily: 'var(--hf-display)', fontSize: 22, color: '#e4ecd8', marginBottom: 8 }}>get notified</h3>
        <p style={{ fontFamily: 'var(--hf-mono)', fontSize: 12, color: '#4a6a55', marginBottom: 20, maxWidth: 400 }}>new post alerts. no spam. unsubscribe anytime. probably monthly at best.</p>
        {submitted ? (
          <div style={{ fontFamily: 'var(--hf-mono)', fontSize: 13, color: '#6dbf8b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6dbf8b', boxShadow: '0 0 8px rgba(109,191,139,0.6)' }} />
            subscribed. check your inbox.
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, border: `1.5px solid ${focused ? '#d300c5' : '#243028'}`, borderRadius: 6, padding: '0 12px', background: '#0a0a0a', transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: focused ? '0 0 12px rgba(211,0,197,0.15)' : 'none' }}>
              <span style={{ color: '#4a6a55', fontFamily: 'var(--hf-mono)', fontSize: 12 }}>→</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="user@domain.io" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#e4ecd8', fontFamily: 'var(--hf-mono)', fontSize: 12, padding: '10px 0', caretColor: '#d300c5' }} />
            </div>
            <button type="submit" style={{ fontFamily: 'var(--hf-mono)', fontSize: 12, fontWeight: 600, color: '#0a0a0a', background: '#d300c5', border: 'none', borderRadius: 6, padding: '10px 20px', cursor: 'pointer', letterSpacing: '0.04em', boxShadow: '0 0 12px rgba(211,0,197,0.3)' }}>subscribe</button>
          </form>
        )}
      </div>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 200, background: 'radial-gradient(ellipse at right, rgba(211,0,197,0.04), transparent)', pointerEvents: 'none' }} />
    </div>
  );
}
