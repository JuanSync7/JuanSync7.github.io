import { useState } from 'react';
import FigureCanvas from '../ui/FigureCanvas';
import type { PackagePartInfo } from '../../data/anatomy';
import './package-open.css';

interface Props {
  parts: readonly PackagePartInfo[];
  /** The figure that opens; it takes `{ open, pick }` and reads out the lit part's id. */
  figure: string;
  /** What the section is, for screen readers. */
  label: string;
  /** What shows in the note while it is closed. */
  closed: string;
}

/** A package or stack that opens: the figure on the left, and beside it the switch, the
 *  part that is lit with what it does, and every part's name. Hovering or focusing a name
 *  lights that part; a click on the figure or the switch opens or closes it. The
 *  figure tours the parts by itself while nobody is pointing. */
export default function PackageOpen({ parts, figure, label, closed }: Props) {
  const [open, setOpen] = useState(true);
  const [pick, setPick] = useState<string | undefined>(undefined);
  const [lit, setLit] = useState(parts[0]?.id ?? '');
  const data = { open, ...(pick ? { pick } : {}) };
  const current = parts.find((p) => p.id === lit);

  return (
    <section className="package-open" aria-label={label}>
      <div className="package-open-stage" onClick={() => setOpen((o) => !o)}>
        <FigureCanvas id={figure} data={data} onReadout={setLit} />
      </div>
      <div className="package-open-side">
        <div className="package-open-controls">
          <button type="button" aria-pressed={open} onClick={() => setOpen((o) => !o)}>
            {open ? 'close it' : 'open it'}
          </button>
          <span className="package-open-state">{open ? 'open' : 'closed'}</span>
        </div>
        <div className="package-open-now" aria-live="polite">
          <span className="package-open-label">{current ? `// ${current.name.toLowerCase()}` : '// closed'}</span>
          <p>
            {current ? current.body : closed}
          </p>
        </div>
        <ol className="package-open-parts">
          {parts.map((p, i) => (
            <li key={p.id} className={p.id === lit ? 'is-on' : undefined}>
              <button
                type="button"
                onPointerEnter={() => setPick(p.id)}
                onPointerLeave={() => setPick(undefined)}
                onFocus={() => setPick(p.id)}
                onBlur={() => setPick(undefined)}
                onClick={() => {
                  setPick(p.id);
                  setOpen(true);
                }}
              >
                <span className="package-open-index">{String(i + 1).padStart(2, '0')}</span>
                <span>{p.name}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
