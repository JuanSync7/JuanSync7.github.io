import { useEffect, useReducer, useRef, useState } from 'react';
import type { Brief } from '../../lib/palette/export';
import { face } from '../../lib/palette/fonts';
import { ROLES } from '../../lib/palette/harmony';
import { applyToSite, siteRoles } from '../../lib/palette/site';
import { system } from '../../lib/palette/shades';
import { initial, reduce } from '../../lib/palette/state';
import Adjusters from './Adjusters';
import ContrastPanel from './ContrastPanel';
import ExportPanel from './ExportPanel';
import MockSite, { type SceneId } from './MockSite';
import RolePicker from './RolePicker';
import ShadesPanel from './ShadesPanel';
import Toolbar from './Toolbar';
import './palette.css';

/** The palette studio: pick a ground, an ink, an accent and a second accent (60/30/10), watch a
 *  sample site and three drawings take them, read every contrast against WCAG 2.2, and take the
 *  system away as a prompt or as code. It starts from juansync.dev's own palette. */
export default function PaletteStudio() {
  const [s, dispatch] = useReducer(reduce, null, () => initial(siteRoles('light'), siteRoles('dark')));
  const [scene, setScene] = useState<SceneId>('swatch-room');
  const [whole, setWhole] = useState(false);
  const [full, setFull] = useState(false);
  const overlay = useRef<HTMLDivElement>(null);

  const light = system(s.themes.light, 'light');
  const dark = system(s.themes.dark, 'dark');
  const tokens = s.mode === 'light' ? light : dark;
  const roles = s.themes[s.mode];
  const body = face(s.body).stack;
  const heading = face(s.heading).stack;
  const brief: Brief = { light, dark, harmony: s.harmony, body: s.body, heading: s.heading };

  // The whole site takes the palette while the switch is on, and gives it back when it is
  // turned off or the reader leaves the page.
  useEffect(() => {
    applyToSite(whole ? tokens : null, s.mode, body);
  });
  useEffect(() => () => applyToSite(null, 'light', ''), []);

  useEffect(() => {
    if (!full) return undefined;
    const el = overlay.current;
    el?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setFull(false);
    };
    const onExit = (): void => {
      if (!document.fullscreenElement) setFull(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onExit);
    el?.requestFullscreen?.().catch(() => undefined);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onExit);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    };
  }, [full]);

  const mock = <MockSite tokens={tokens} body={body} heading={heading} scene={scene} onScene={setScene} />;

  return (
    <div className="pal">
      <Toolbar s={s} dispatch={dispatch} whole={whole} onWhole={setWhole} onFull={() => setFull(true)} />
      <div className="pal-main">
        <div className="pal-picks">
          {ROLES.map((role) => (
            <RolePicker
              key={role}
              role={role}
              color={roles[role]}
              ground={roles.ground}
              lock={s.locks[role]}
              active={s.active === role}
              dispatch={dispatch}
            />
          ))}
        </div>
        <div className="pal-preview">
          <p className="pal-preview-label">
            {'// preview · '}
            {s.mode} theme{s.linked ? ' · dark follows light' : ' · dark edited by hand'}
          </p>
          {full ? null : mock}
        </div>
      </div>
      <div className="pal-lower">
        <Adjusters role={s.active} color={roles[s.active]} dispatch={dispatch} />
        <ContrastPanel tokens={tokens} mode={s.mode} />
      </div>
      <ShadesPanel tokens={tokens} />
      <ExportPanel brief={brief} />
      {full ? (
        <div ref={overlay} className="pal-full" role="dialog" aria-modal="true" aria-label="Full screen preview" tabIndex={-1}>
          <button type="button" className="pal-full-close" onClick={() => setFull(false)}>
            Close preview
          </button>
          {mock}
        </div>
      ) : null}
    </div>
  );
}
