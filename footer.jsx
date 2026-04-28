// Footer

function Footer() {
  return (
    <footer className="hf-footer">
      <div className="hf-footer-grid">
        <div className="hf-footer-col">
          <div className="hf-footer-h">// contact.sh</div>
          <div className="hf-footer-links">
            <a href="mailto:kokshewjuan7_job@outlook.com" className="hf-footer-link">email → kokshewjuan7_job@outlook.com</a>
            <a href="https://github.com/JuanSync7" className="hf-footer-link" target="_blank">github → @JuanSync7</a>
            <a href="https://www.linkedin.com/in/shewjuankok/" className="hf-footer-link" target="_blank">linkedin → shewjuankok</a>
          </div>
        </div>
        <div className="hf-footer-col">
          <div className="hf-footer-h">// colophon</div>
          <div className="hf-footer-text">
            <div>no EDA tools were used in the making of this site.</div>
            <div>just vim, coffee, and spite.</div>
            <a href="design-system.html" className="hf-footer-link" style={{ marginTop: 8, display: 'inline-block' }}>design system →</a>
          </div>
        </div>
        <div className="hf-footer-col hf-footer-right">
          <div className="hf-footer-sig">JUAN-SOC-1999-X1</div>
          <div className="hf-footer-rev">rev. 2026 · ed. 02</div>
        </div>
      </div>
    </footer>
  );
}

window.Footer = Footer;
