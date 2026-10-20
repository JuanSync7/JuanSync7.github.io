import { useState } from 'react';
import FigureCanvas from '../ui/FigureCanvas';
import type { PackageData } from '../../figures/accelerator-package';
import type { PackagePartInfo } from '../../data/anatomy';
import './package-open.css';

interface Props {
  parts: readonly PackagePartInfo[];
}

/** The accelerator package that opens: the figure on the left, and beside it the switch, the
 *  part that is lit with what it does, and every part's name. Hovering or focusing a name
 *  lights that part; a click on the figure or the switch opens or closes the package. The
 *  figure tours the parts by itself while nobody is pointing. */
export default function PackageOpen({ parts }: Props) {
  const [open, setOpen] = useState(true);
  const [pick, setPick] = useState<string | undefined>(undefined);
  const [lit, setLit] = useState('lid');
  const data: PackageData = { open, ...(pick ? { pick } : {}) };
  const current = parts.find((p) => p.id === lit);

  return (
    <section className="package-open" aria-label="An accelerator package, opened">
      <div className="package-open-stage" onClick={() => setOpen((o) => !o)}>
        <FigureCanvas id="accelerator-package" data={data} onReadout={setLit} />
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
            {current
              ? current.body
              : 'Closed, the lid and its foot are all there is to see: one part number, one copper block on a board.'}
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
