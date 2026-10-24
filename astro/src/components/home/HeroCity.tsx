import { useState } from 'react';
import FigureCanvas from '../ui/FigureCanvas';
import './hero-city.css';

type Look = 'solid' | 'wire';
const LOOKS: { id: Look; label: string }[] = [
  { id: 'solid', label: 'solid' },
  { id: 'wire', label: 'wire' },
];

/** The home hero's city, with a switch between its two looks: hard-surface (the default)
 *  and the original wireframe. The scene keeps both built and only shows one, so switching
 *  costs nothing and the camera does not jump. */
export default function HeroCity() {
  const [look, setLook] = useState<Look>('solid');
  return (
    <div className="hero-city">
      <FigureCanvas id="system-stack" data={{ look }} />
      <div className="hero-city-looks" role="group" aria-label="How the city is drawn">
        {LOOKS.map((l) => (
          <button key={l.id} type="button" aria-pressed={look === l.id} onClick={() => setLook(l.id)}>
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
