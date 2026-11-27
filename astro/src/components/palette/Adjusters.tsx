import { useRef, type Dispatch } from 'react';
import { hslToRgb, mixOk, rgbToHsl, type Rgba } from '../../lib/palette/color';
import type { Role } from '../../lib/palette/harmony';
import { rampTrack, track, type Channel } from '../../lib/palette/paint';
import { ramp, show } from '../../lib/palette/shades';
import type { Action } from '../../lib/palette/state';
import { ROLE_TEXT } from './RolePicker';

interface Props {
  role: Role;
  color: Rgba;
  dispatch: Dispatch<Action>;
}

const CHANNELS: { ch: Channel; label: string; max: number; unit: string }[] = [
  { ch: 'h', label: 'Hue', max: 360, unit: '°' },
  { ch: 's', label: 'Saturation', max: 100, unit: '%' },
  { ch: 'l', label: 'Lightness', max: 100, unit: '%' },
  { ch: 'a', label: 'Alpha', max: 100, unit: '%' },
];

/** Fine control of the colour being edited: hue, saturation, lightness and alpha, then its
 *  range from light to dark (drag along it, or take one of its eleven steps). */
export default function Adjusters({ role, color, dispatch }: Props) {
  const hsl = rgbToHsl(color);
  const value: Record<Channel, number> = { h: hsl.h, s: hsl.s, l: hsl.l, a: color.a * 100 };
  const set = (c: Rgba): void => dispatch({ type: 'set', role, color: c });
  const change = (ch: Channel, v: number): void => {
    if (ch === 'a') set({ ...color, a: v / 100 });
    else set(hslToRgb({ ...hsl, [ch]: v }, color.a));
  };
  const steps = ramp(color);
  // The range slides along the ramp of the colour it started from, so it does not drift
  // while dragging.
  const base = useRef<Rgba | null>(null);
  const along = (k: number): Rgba => {
    const from = base.current ?? color;
    const r = ramp(from);
    const light = r[0]?.value ?? from;
    const dark = r[r.length - 1]?.value ?? from;
    return k < 0.5 ? mixOk(light, from, k * 2) : mixOk(from, dark, (k - 0.5) * 2);
  };

  return (
    <section className="pal-panel pal-adjust" aria-labelledby="pal-adjust-title">
      <h2 id="pal-adjust-title">
        Adjust <span>{ROLE_TEXT[role].name.toLowerCase()}</span>
      </h2>
      <p className="pal-note">Pick a colour above to edit it here. Locked channels hold when other colours are picked.</p>
      {CHANNELS.map(({ ch, label, max, unit }) => (
        <label key={ch} className="pal-slider">
          <span>
            {label} <output>{`${Math.round(value[ch])}${unit}`}</output>
          </span>
          <input
            type="range"
            min={0}
            max={max}
            step={1}
            value={Math.round(value[ch])}
            style={{ background: track(color, ch) }}
            onChange={(e) => change(ch, Number(e.target.value))}
          />
        </label>
      ))}
      <label className="pal-slider">
        <span>Range, light to dark</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          defaultValue={50}
          style={{ background: rampTrack(color) }}
          onPointerDown={() => (base.current = color)}
          onFocus={() => (base.current = color)}
          onBlur={() => (base.current = null)}
          onChange={(e) => set({ ...along(Number(e.target.value) / 100), a: color.a })}
        />
      </label>
      <div className="pal-steps" role="group" aria-label="The colour's eleven steps">
        {steps.map((s) => (
          <button
            key={s.step}
            type="button"
            style={{ background: show(s.value) }}
            title={`${s.step}: ${show(s.value)}`}
            aria-label={`Use step ${s.step}, ${show(s.value)}`}
            onClick={() => set({ ...s.value, a: color.a })}
          />
        ))}
      </div>
    </section>
  );
}
