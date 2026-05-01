import { useEffect, useState } from 'react';

const LINKS = [
  { label: '00 about', anchor: 'about' },
  { label: '01 work', anchor: 'work' },
  { label: '10 cv', anchor: 'cv' },
  { label: '11 projects', anchor: 'projects' },
  { label: 'ff blog', anchor: 'blog' },
] as const;

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`hf-nav ${scrolled ? 'hf-nav-scrolled' : ''}`}>
      <div className="hf-nav-brand">
        <span className="hf-nav-dot" />
        <span className="hf-nav-name">juan_kok</span>
        <span className="hf-nav-tag">v2.0</span>
      </div>
      <div className="hf-nav-links">
        {LINKS.map(({ label, anchor }) => (
          <a key={anchor} href={`#${anchor}`} className="hf-nav-link">
            {label}
          </a>
        ))}
      </div>
      <a
        href="/Kok_Shew_Juan_CV_2025.pdf"
        download="Kok_Shew_Juan_CV_2025.pdf"
        rel="noopener"
        className="hf-nav-cta"
      >
        cv.pdf ↓
      </a>
    </nav>
  );
}
