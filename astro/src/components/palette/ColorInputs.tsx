import { useEffect, useState } from 'react';
import { clamp, parseHex, toHex, type Rgba } from '../../lib/palette/color';

interface Props {
  color: Rgba;
  label: string;
  onPick: (c: Rgba) => void;
}

const CHANNELS = ['r', 'g', 'b'] as const;

/** The colour typed in: a hex code copied from another site, or the three 8-bit channels
 *  (0 to 255) a paint program shows. */
export default function ColorInputs({ color, label, onPick }: Props) {
  const [hex, setHex] = useState(toHex(color));
  // Follow the colour when it changes elsewhere (the wheel, a suggestion), but not mid-typing.
  useEffect(() => setHex(toHex(color)), [color]);

  const commitHex = (text: string): void => {
    setHex(text);
    const c = parseHex(text);
    if (c) onPick(c);
  };

  return (
    <div className="pal-inputs">
      <label className="pal-field pal-hex">
        <span>hex</span>
        <input
          value={hex}
          spellCheck={false}
          aria-label={`${label} hex code`}
          aria-invalid={parseHex(hex) ? undefined : true}
          onChange={(e) => commitHex(e.target.value)}
        />
      </label>
      {CHANNELS.map((ch) => (
        <label key={ch} className="pal-field">
          <span>{ch}</span>
          <input
            type="number"
            min={0}
            max={255}
            value={Math.round(color[ch])}
            aria-label={`${label} ${ch} channel, 0 to 255`}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v)) onPick({ ...color, [ch]: clamp(v, 0, 255) });
            }}
          />
        </label>
      ))}
    </div>
  );
}
