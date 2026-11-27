import type { Dispatch } from 'react';
import { FACES } from '../../lib/palette/fonts';
import { HARMONIES, type Harmony, type Mode } from '../../lib/palette/harmony';
import type { Action, Studio } from '../../lib/palette/state';

interface Props {
  s: Studio;
  dispatch: Dispatch<Action>;
  whole: boolean;
  onWhole: (on: boolean) => void;
  onFull: () => void;
}

const MODES: Mode[] = ['light', 'dark'];

/** The studio's settings: which theme is being edited, how picks suggest the rest, the body
 *  contrast to aim for, the two type faces, and where to see the result. */
export default function Toolbar({ s, dispatch, whole, onWhole, onFull }: Props) {
  return (
    <div className="pal-toolbar" role="group" aria-label="Palette settings">
      <div className="pal-seg" role="radiogroup" aria-label="Theme being edited">
        {MODES.map((m) => (
          <button key={m} type="button" role="radio" aria-checked={s.mode === m} onClick={() => dispatch({ type: 'mode', mode: m })}>
            {m}
          </button>
        ))}
      </div>
      <label className="pal-field">
        <span>harmony</span>
        <select value={s.harmony} onChange={(e) => {
            const harmony = HARMONIES.find((h): h is Harmony => h === e.target.value);
            if (harmony) dispatch({ type: 'harmony', harmony });
          }}>
          {HARMONIES.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </label>
      <label className="pal-field pal-target">
        <span>body contrast {s.target.toFixed(1)}:1</span>
        <input
          type="range"
          min={4.5}
          max={16}
          step={0.5}
          value={s.target}
          onChange={(e) => dispatch({ type: 'target', target: Number(e.target.value) })}
        />
      </label>
      <label className="pal-field">
        <span>headings</span>
        <select value={s.heading} onChange={(e) => dispatch({ type: 'font', which: 'heading', id: e.target.value })}>
          {FACES.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <label className="pal-field">
        <span>body</span>
        <select value={s.body} onChange={(e) => dispatch({ type: 'font', which: 'body', id: e.target.value })}>
          {FACES.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <div className="pal-switches">
        <button type="button" className="pal-toggle" aria-pressed={s.auto} onClick={() => dispatch({ type: 'auto', on: !s.auto })}>
          auto-suggest
        </button>
        <button type="button" className="pal-toggle" onClick={() => dispatch({ type: 'resuggest' })}>
          suggest again
        </button>
        {s.linked ? null : (
          <button type="button" className="pal-toggle" onClick={() => dispatch({ type: 'relink' })}>
            derive dark from light
          </button>
        )}
        <button type="button" className="pal-toggle" aria-pressed={whole} onClick={() => onWhole(!whole)}>
          paint the whole site
        </button>
        <button type="button" className="pal-toggle" onClick={onFull}>
          full screen preview
        </button>
      </div>
    </div>
  );
}
