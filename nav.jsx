// Nav — slim sticky top bar

function Nav() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
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
        {['00 about','01 work','10 cv','11 projects','ff blog'].map(l => (
          <a key={l} href={'#' + l.split(' ')[1]} className="hf-nav-link">{l}</a>
        ))}
      </div>
      <a href="#" className="hf-nav-cta">cv.pdf ↓</a>
    </nav>
  );
}

window.Nav = Nav;
