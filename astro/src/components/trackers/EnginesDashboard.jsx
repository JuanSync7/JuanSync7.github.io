import { useState, useEffect } from 'react';

const tierClass = (t) => (t === 'server' ? 'server' : t === 'legacy' ? 'legacy' : 'local');
const FILTERS = [
  ['all', 'All'],
  ['server', 'Server / Production'],
  ['local', 'Local / Edge'],
  ['legacy', 'Legacy'],
];

export default function Dashboard({ data }) {
  const [active, setActive] = useState('all');
  const [modalId, setModalId] = useState(null);

  const engines = data.engines;
  const usecases = data.usecases;
  const watchlist = data.watchlist;

  const tiers = { server: 0, local: 0, legacy: 0 };
  engines.forEach((e) => { tiers[e.tier] = (tiers[e.tier] || 0) + 1; });

  const shown = engines.filter((e) => active === 'all' || e.tier === active);
  const modal = modalId ? engines.find((e) => e.id === modalId) : null;

  // close modal on Escape
  useEffect(() => {
    if (!modal) return;
    const onKey = (ev) => { if (ev.key === 'Escape') setModalId(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modal]);

  return (
    <>
      {/* stat bar */}
      <div className="bar reveal">
        <div className="stat"><div className="n">{engines.length}</div><div className="l">Engines tracked</div></div>
        <div className="stat"><div className="n">{tiers.server}</div><div className="l">Production / server</div></div>
        <div className="stat"><div className="n">{tiers.local}</div><div className="l">Local / edge</div></div>
        <div className="stat"><div className="n">~16.2k</div><div className="l">Top tok/s (H100, SGLang)</div></div>
      </div>

      {/* tabs */}
      <nav className="tabs reveal">
        {FILTERS.map(([k, label]) => (
          <button
            key={k}
            className={'tab' + (active === k ? ' active' : '')}
            onClick={() => setActive(k)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>

      {/* engine grid */}
      <div className="grid">
        {shown.map((e) => (
          <button key={e.id} className="card" type="button" onClick={() => setModalId(e.id)}>
            <h3>{e.name}</h3>
            <span className={'cat ' + tierClass(e.tier)}>{e.category}</span>
            <div className="tl">{e.tagline}</div>
            <div className="ver">
              <div className="vk"><span className="vlabel">Version</span><span className="vval">{e.latestVersion}</span></div>
              <div className="vk"><span className="vlabel">Released</span><span className="vval">{e.releaseDate}</span></div>
              <div className="vk"><span className="vlabel">License</span><span className="vval">{e.license}</span></div>
            </div>
            <div className="more">View details <span className="arr">→</span></div>
          </button>
        ))}
      </div>

      {/* comparison table */}
      <h2 className="section">Comparison &amp; <em>trade-offs</em></h2>
      <p className="section-sub">Side-by-side at a glance. Click any engine card above for full detail.</p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Engine</th><th>Tier</th><th>Latest</th><th>License</th><th>Hardware</th>
            </tr>
          </thead>
          <tbody>
            {engines.map((e) => (
              <tr key={e.id}>
                <td><b>{e.name}</b></td>
                <td>{e.category}</td>
                <td>{e.latestVersion}<br /><span className="rdate">{e.releaseDate}</span></td>
                <td>{e.license}</td>
                <td>{e.hardware.slice(0, 3).join(', ')}{e.hardware.length > 3 ? '…' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* use-case guide */}
      <h2 className="section">Which one should <em>I use?</em></h2>
      <p className="section-sub">Quick decision guide by scenario.</p>
      <div className="uc uc-one">
        {usecases.map((u, i) => (
          <div className="uccard" key={i}>
            <div className="q">{u.q}</div>
            <div className="a" dangerouslySetInnerHTML={{ __html: u.a }} />
          </div>
        ))}
      </div>

      {/* watchlist */}
      <h2 className="section">On the <em>watchlist</em></h2>
      <p className="section-sub">Emerging engines being tracked but not yet promoted to the main list — pending proven significance.</p>
      <div className="uc">
        {watchlist.map((w, i) => (
          <div className="uccard" key={i}>
            <div className="q">
              {w.name}{' '}
              <a href={w.link} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--mono)' }}><span className="arr">↗</span></a>
            </div>
            <div className="a">{w.note}</div>
            <div className="a" style={{ marginTop: '14px' }}>
              <b style={{ color: 'var(--teal)' }}>Why watch:</b> {w.why}
            </div>
          </div>
        ))}
      </div>

      {/* modal */}
      {modal && (
        <div className="modal" onClick={(ev) => { if (ev.target === ev.currentTarget) setModalId(null); }}>
          <div className="sheet">
            <button className="x" type="button" onClick={() => setModalId(null)} aria-label="Close">×</button>
            <h2>{modal.name}</h2>
            <span className={'cat ' + tierClass(modal.tier)}>{modal.category}</span>
            <div className="tl" style={{ marginTop: '8px' }}>{modal.tagline}</div>
            <div className="ver" style={{ marginBottom: '16px' }}>
              <span>Latest <b>{modal.latestVersion}</b></span>
              <span>Released {modal.releaseDate}</span>
              <span>{modal.license}</span>
              <span>{modal.maintainer}</span>
            </div>
            <div className="sect"><h4>Performance</h4><div className="perf">{modal.perfNote}</div></div>
            <div className="sect"><h4>Hardware</h4><div className="chips">{modal.hardware.map((h, i) => <span key={i}>{h}</span>)}</div></div>
            <div className="sect"><h4>Key features</h4><ul>{modal.keyFeatures.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
            <div className="cols2">
              <div className="sect"><h4>Strengths</h4><ul>{modal.strengths.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
              <div className="sect"><h4>Trade-offs</h4><ul>{modal.tradeoffs.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
            </div>
            <div className="sect"><h4>Best use cases</h4><ul>{modal.bestUseCases.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
            <div className="sect"><h4>Recent updates</h4><ul>{modal.recent.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
            <div className="sect"><h4>Links</h4>
              <div className="chips">
                <span><a href={modal.links.repo} target="_blank" rel="noreferrer">Repository <span className="arr">↗</span></a></span>
                <span><a href={modal.links.docs} target="_blank" rel="noreferrer">Docs <span className="arr">↗</span></a></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
