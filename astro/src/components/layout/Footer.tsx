import { CONTACT } from '@/data/site';

export default function Footer() {
  return (
    <footer className="hf-footer">
      <div className="hf-footer-grid">
        <div className="hf-footer-col">
          <div className="hf-footer-h">// contact.sh</div>
          <div className="hf-footer-links">
            <a href={`mailto:${CONTACT.email}`} className="hf-footer-link">
              email → {CONTACT.email}
            </a>
            <a href={`https://github.com/${CONTACT.github}`} className="hf-footer-link" target="_blank" rel="noreferrer">
              github → @{CONTACT.github}
            </a>
            <a href={CONTACT.linkedinUrl} className="hf-footer-link" target="_blank" rel="noreferrer">
              linkedin → {CONTACT.linkedin}
            </a>
          </div>
        </div>
        <div className="hf-footer-col">
          <div className="hf-footer-h">// colophon</div>
          <div className="hf-footer-text">
            <div>no EDA tools were used in the making of this site.</div>
            <div>just vim, coffee, and spite.</div>
            <a href="/design-system.html" className="hf-footer-link hf-footer-ds-link">design system →</a>
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
