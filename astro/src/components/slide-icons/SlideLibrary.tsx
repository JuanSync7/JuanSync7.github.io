import { useEffect, useState } from 'react';
import SlideIcon from '../ui/SlideIcon';
import { SLIDE_ICONS, SLIDE_GROUPS, isSlideGroup, type SlideGroup } from '../../data/slide-icons';
import { slideAsset, slideSvg } from '../../figures/kit/slides/svg';
import { SLIDE_DEFAULT, type SlideTone } from '../../figures/kit/slides/types';
import './slide-icons.css';

export default function SlideLibrary() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<SlideGroup | 'all'>('all');
  const [tone, setTone] = useState<SlideTone>(SLIDE_DEFAULT.tone);
  const [accent, setAccent] = useState(SLIDE_DEFAULT.accent);
  const [status, setStatus] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setQuery(q.get('q') ?? '');
    const g = q.get('group');
    if (isSlideGroup(g)) setGroup(g);
    if (q.get('tone') === 'paper') setTone('paper');
    if (q.get('accent') === '0') setAccent(false);
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries({ q: query, group, tone, accent: accent ? '1' : '0' }))
      url.searchParams.set(key, value);
    window.history.replaceState(null, '', url);
    setStatus('');
  }, [query, group, tone, accent, ready]);
  const options = { tone, accent };
  const copy = async (icon: (typeof SLIDE_ICONS)[number]): Promise<void> => {
    try {
      await navigator.clipboard.writeText(slideSvg(icon.id, options));
      setStatus(`${icon.name} SVG copied.`);
    } catch {
      setStatus('Clipboard unavailable. Use the SVG download.');
    }
  };
  const found = SLIDE_ICONS.filter(
    (icon) =>
      (group === 'all' || icon.group === group) &&
      `${icon.name} ${icon.tags}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <section className="slide-library" aria-label="Slide icon collection" data-tone={tone}>
      <div className="slide-toolbar">
        <label className="slide-search">
          <span>Find a mark</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try silicon, notes, or measure…"
          />
        </label>
        <fieldset>
          <legend>Slide background</legend>
          <div className="slide-segments">
            {(['night', 'paper'] as const).map((value) => (
              <button type="button" key={value} aria-pressed={tone === value} onClick={() => setTone(value)}>
                {value === 'night' ? 'dark' : 'light'}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Ink</legend>
          <div className="slide-segments">
            <button type="button" aria-pressed={accent} onClick={() => setAccent(true)}>
              teal accent
            </button>
            <button type="button" aria-pressed={!accent} onClick={() => setAccent(false)}>
              monochrome
            </button>
          </div>
        </fieldset>
      </div>
      <div className="slide-filters" role="group" aria-label="Icon family">
        {(['all', ...SLIDE_GROUPS] as const).map((value) => (
          <button type="button" key={value} aria-pressed={group === value} onClick={() => setGroup(value)}>
            {value}
          </button>
        ))}
        <span aria-live="polite">
          {found.length} / {SLIDE_ICONS.length}
        </span>
      </div>
      <ul className="slide-grid">
        {found.map((icon) => (
          <li key={icon.id} className="slide-card" data-icon={icon.id}>
            <div className="slide-icon-preview">
              <SlideIcon id={icon.id} {...options} />
            </div>
            <div className="slide-card-label">
              <span>{icon.group}</span>
              <h2>{icon.name}</h2>
            </div>
            <div className="slide-actions">
              <a href={slideAsset(icon.id, options)} download aria-label={`Download ${icon.name} SVG`}>
                SVG
              </a>
              <button
                type="button"
                aria-label={`Copy ${icon.name} SVG`}
                onClick={() => {
                  void copy(icon);
                }}
              >
                Copy
              </button>
              <a
                href={`/downloads/slide-icons/proofs/${icon.id}.svg`}
                aria-label={`View ${icon.name} size proof`}
                target="_blank"
                rel="noreferrer"
              >
                Sizes
              </a>
            </div>
          </li>
        ))}
      </ul>
      {found.length === 0 && <p className="slide-empty">No marks match. Try another word or family.</p>}
      <p className="slide-status" role="status">
        {status || 'Transparent SVG · one consistent stroke · no fonts or external assets'}
      </p>
    </section>
  );
}
