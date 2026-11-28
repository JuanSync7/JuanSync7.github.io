import type { Dispatch } from 'react';
import { contrast, type Rgba } from '../../lib/palette/color';
import type { Lock, Role } from '../../lib/palette/harmony';
import { show } from '../../lib/palette/shades';
import type { Action } from '../../lib/palette/state';
import ColorInputs from './ColorInputs';
import ColorWheel from './ColorWheel';

/** What each role is for, in the words the 60/30/10 rule uses. */
export const ROLE_TEXT: Record<Role, { share: string; name: string; note: string }> = {
  ground: { share: '60', name: 'Ground', note: 'The page, cards and panels.' },
  ink: { share: '30', name: 'Ink', note: 'Text, hairlines and icons.' },
  accent: { share: '10', name: 'Accent', note: 'Buttons, links, focus, one highlight.' },
  accent2: { share: '10', name: 'Second accent', note: 'A sliver of the 10: a second series, a rare badge.' },
};

const LOCKS: { key: keyof Lock; text: string; title: string }[] = [
  { key: 'all', text: 'lock', title: 'Keep this whole colour when another is picked (set by hand: locked for you)' },
  { key: 'h', text: 'H', title: 'Keep its hue' },
  { key: 's', text: 'S', title: 'Keep its saturation' },
  { key: 'l', text: 'L', title: 'Keep its lightness' },
];

interface Props {
  role: Role;
  color: Rgba;
  ground: Rgba;
  lock: Lock;
  active: boolean;
  dispatch: Dispatch<Action>;
}

/** One of the four picks: its wheel, its typed value, its locks and its contrast on the ground. */
export default function RolePicker({ role, color, ground, lock, active, dispatch }: Props) {
  const t = ROLE_TEXT[role];
  const pick = (c: Rgba): void => dispatch({ type: 'set', role, color: c });
  const ratio = role === 'ground' ? undefined : contrast(color, ground);
  return (
    <section
      className="pal-role"
      data-active={active || undefined}
      aria-labelledby={`pal-role-${role}`}
      onFocusCapture={() => !active && dispatch({ type: 'active', role })}
    >
      <header>
        <span className="pal-share">{t.share}</span>
        <h3 id={`pal-role-${role}`}>{t.name}</h3>
        <span className="pal-chip" style={{ background: show(color) }} aria-hidden="true" />
      </header>
      <p className="pal-note">
        {t.note}
        {ratio ? ` ${ratio.toFixed(2)}:1 on the ground.` : ''}
      </p>
      <ColorWheel color={color} label={t.name} onPick={pick} />
      <ColorInputs color={color} label={t.name} onPick={pick} />
      <div className="pal-locks" role="group" aria-label={`${t.name} locks`}>
        {LOCKS.map((l) => (
          <button
            key={l.key}
            type="button"
            className="pal-toggle"
            aria-pressed={lock[l.key]}
            title={l.title}
            onClick={() => dispatch({ type: 'lock', role, key: l.key })}
          >
            {l.text}
          </button>
        ))}
      </div>
    </section>
  );
}
