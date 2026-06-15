import { useEffect, useState } from 'react';
import { IDENTITY } from '@/data/site';

interface NavLink {
  label: string;
  href: string;
  match?: string;
}

const LINKS: NavLink[] = [
  { label: '00 about', href: '/#about' },
  { label: '01 work', href: '/#work' },
  { label: '10 cv', href: '/#cv' },
  { label: '11 projects', href: '/#projects' },
  { label: 'ff blog', href: '/blog', match: '/blog' },
] as const;

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [path, setPath] = useState('');

  useEffect(() => {
    setPath(window.location.pathname);
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`hf-nav ${scrolled ? 'hf-nav-scrolled' : ''}`}>
      <div className="hf-nav-brand">
        <span className="hf-nav-dot" />
        <span className="hf-nav-name">{IDENTITY.shortName}</span>
        <span className="hf-nav-tag">v2.0</span>
      </div>
      <div className="hf-nav-links">
        {LINKS.map(({ label, href, match }) => {
          const active = match ? path.startsWith(match) : false;
          return (
            <a
              key={href}
              href={href}
              className={`hf-nav-link ${active ? 'hf-nav-link-active' : ''}`}
            >
              {label}
            </a>
          );
        })}
      </div>
      <a
        href={IDENTITY.cvFile}
        download={IDENTITY.cvFile.replace(/^\//, '')}
        rel="noopener"
        className="hf-nav-cta"
      >
        cv.pdf ↓
      </a>
    </nav>
  );
}
