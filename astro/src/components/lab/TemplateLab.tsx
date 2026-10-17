import { useEffect, useState } from 'react';
import FigureCanvas from '../ui/FigureCanvas';
import { loadTemplate } from '../../figures/registry';
import type { Template } from '../../figures/defineTemplate';
import './template-lab.css';

interface Props {
  template: string;
}

const MAX_SEED = 999_999_999;
const NEIGHBOURS = 8;

const clampSeed = (n: number): number => Math.min(MAX_SEED, Math.max(0, Math.trunc(n) || 0));

function readSeed(): number {
  const raw = new URLSearchParams(window.location.search).get('seed');
  return raw === null ? 1 : clampSeed(Number(raw));
}

/** A random seed from the browser's crypto source: the lab's dice, not a figure's. */
function roll(): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return (a[0] ?? 1) % (MAX_SEED + 1);
}

/** One template, any seed: the instance large, its id and variant, steps to the next and
 *  previous seed, a dice roll, and the next eight seeds as thumbnails to jump to. The seed
 *  lives in the address (?seed=), so a picture can be shared by its link. */
export default function TemplateLab({ template }: Props) {
  const [tpl, setTpl] = useState<Template | null>(null);
  const [seed, setSeed] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    loadTemplate(template).then((t) => live && setTpl(t)).catch((err: unknown) => console.error('lab:', err));
    const s = readSeed();
    setSeed(s);
    setDraft(String(s));
    return () => {
      live = false;
    };
  }, [template]);

  useEffect(() => {
    if (seed === null) return;
    const url = new URL(window.location.href);
    url.searchParams.set('seed', String(seed));
    window.history.replaceState(null, '', url);
    setDraft(String(seed));
    setCopied(false);
  }, [seed]);

  if (!tpl || seed === null) return <p className="lab-loading">Loading {template}…</p>;
  const go = (s: number): void => {
    const next = clampSeed(s);
    setSeed(next);
    // The draft resyncs even when the seed does not change (a cleared box, a leading zero).
    setDraft(String(next));
  };
  // The next seeds, stopping at the last one rather than repeating it.
  const ahead = Array.from({ length: NEIGHBOURS }, (_, k) => seed + 1 + k).filter((s) => s <= MAX_SEED);
  const id = `${template}~${seed}`;
  const inst = tpl.instance(seed);
  const copy = (): void => {
    navigator.clipboard
      .writeText(id)
      .then(() => setCopied(true))
      .catch(() => setCopied(false));
  };

  return (
    <div className="lab">
      <div className="lab-main">
        <FigureCanvas key={id} id={id} />
      </div>
      <div className="lab-bar">
        <div className="lab-id" aria-live="polite">
          <span className="lab-variant">{inst.variant}</span>
          <button type="button" className="lab-copy" onClick={copy} aria-label={copied ? `Copied ${id}` : `Copy ${id}`}>
            {copied ? 'copied' : id}
          </button>
        </div>
        <form
          className="lab-controls"
          onSubmit={(e) => {
            e.preventDefault();
            go(Number(draft));
          }}
        >
          <button type="button" className="lab-btn" onClick={() => go(seed - 1)} disabled={seed === 0} aria-label="Previous seed">
            ←
          </button>
          <label className="lab-seed">
            <span>seed</span>
            <input inputMode="numeric" value={draft} onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))} onBlur={() => go(Number(draft))} />
          </label>
          <button type="button" className="lab-btn" onClick={() => go(seed + 1)} disabled={seed === MAX_SEED} aria-label="Next seed">
            →
          </button>
          <button type="button" className="lab-btn lab-roll" onClick={() => go(roll())}>
            roll
          </button>
        </form>
      </div>
      <p className="lab-alt" aria-live="polite">
        {inst.alt}
      </p>
      <ol className="lab-strip" aria-label="Next seeds">
        {/* Keyed by position, so the button just pressed stays mounted and keeps focus. */}
        {ahead.map((s, k) => (
          <li key={k}>
            <button type="button" className="lab-thumb" onClick={() => go(s)} aria-label={`Seed ${s}: ${tpl.instance(s).variant}`}>
              <span className="lab-thumb-stage">
                <FigureCanvas id={`${template}~${s}`} />
              </span>
              <span className="lab-thumb-label">
                {s} · {tpl.instance(s).variant}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
