import { useState, useEffect } from 'react';

const FILTERS = [
  ['all', 'All'],
  ['proprietary', 'Frontier · Closed'],
  ['open', 'Frontier · Open'],
  ['small', 'Small & On-device'],
  ['agentic', 'Agentic Frameworks'],
  ['encoder', 'Classifiers & Encoders'],
];

export default function Dashboard({ data }) {
  const [active, setActive] = useState('all');
  const [modalId, setModalId] = useState(null);

  const models = data.models;
  const usecases = data.usecases;
  const watchlist = data.watchlist;
  const pipeline = data.pipeline;

  const tiers = { proprietary: 0, open: 0, small: 0, agentic: 0, encoder: 0 };
  models.forEach((m) => { tiers[m.tier] = (tiers[m.tier] || 0) + 1; });

  const shown = models.filter((m) => active === 'all' || m.tier === active);
  const modal = modalId ? models.find((m) => m.id === modalId) : null;

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
        <div className="stat"><div className="n">{models.length}</div><div className="l">Models &amp; tools tracked</div></div>
        <div className="stat"><div className="n">{tiers.proprietary + tiers.open}</div><div className="l">Frontier models</div></div>
        <div className="stat"><div className="n">61.4</div><div className="l">Top intel index (Opus 4.8)</div></div>
        <div className="stat"><div className="n">80.6%</div><div className="l">Top open SWE-bench (DeepSeek V4)</div></div>
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

      {/* model grid */}
      <div className="grid">
        {shown.map((m) => (
          <button key={m.id} className="card" type="button" onClick={() => setModalId(m.id)}>
            <h3>{m.name}</h3>
            <span className={'cat ' + m.tier}>{m.category}</span>
            <div className="tl">{m.tagline}</div>
            {m.metric && <div className="metric">{m.metric}</div>}
            <div className="ver">
              <div className="vk"><span className="vlabel">Latest</span><span className="vval">{m.latestVersion}</span></div>
              <div className="vk"><span className="vlabel">Released</span><span className="vval">{m.releaseDate}</span></div>
              <div className="vk"><span className="vlabel">License</span><span className="vval">{m.license}</span></div>
            </div>
            <div className="more">View details <span className="arr">→</span></div>
          </button>
        ))}
      </div>

      {/* comparison table */}
      <h2 className="section">Comparison &amp; <em>trade-offs</em></h2>
      <p className="section-sub">Side-by-side at a glance. Click any card above for full detail. Use the tabs to filter by category.</p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Model / tool</th><th>Category</th><th>Latest</th><th>License</th><th>Headline</th><th>Best for</th><th>Watch-out</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((m) => (
              <tr key={m.id}>
                <td><b>{m.name}</b><br /><span className="rdate">{m.maintainer}</span></td>
                <td>{m.category}</td>
                <td>{m.latestVersion}<br /><span className="rdate">{m.releaseDate}</span></td>
                <td>{m.license}</td>
                <td>{m.metric}</td>
                <td>{m.bestUseCases[0]}</td>
                <td>{m.tradeoffs[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* use-case guide */}
      <h2 className="section">Which model should <em>I use?</em></h2>
      <p className="section-sub">Quick decision guide by scenario.</p>
      <div className="uc uc-one">
        {usecases.map((u, i) => (
          <div className="uccard" key={i}>
            <div className="q">{u.q}</div>
            <div className="a" dangerouslySetInnerHTML={{ __html: u.a }} />
          </div>
        ))}
      </div>

      {/* pipeline */}
      <h2 className="section">In the <em>pipeline</em></h2>
      <p className="section-sub">What the labs have announced, are rolling out, or are rumored to ship next. Treat rumored items with caution.</p>
      <div className="pipeline">
        {pipeline.map((p, i) => (
          <div className="pipecard" key={i}>
            <div className="pq">{p.name} <span className="ptag">{p.tag}</span></div>
            <div className="pa">{p.note}</div>
          </div>
        ))}
      </div>

      {/* watchlist */}
      <h2 className="section">On the <em>watchlist</em></h2>
      <p className="section-sub">Emerging models &amp; tools being tracked but not yet promoted to a full card — pending proven significance.</p>
      <div className="uc">
        {watchlist.map((w, i) => (
          <div className="uccard" key={i}>
            <div className="q">
              {w.name}{' '}
              <a href={w.link} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--mono)' }}><span className="arr">↗</span></a>
            </div>
            <div className="a">{w.note}</div>
            <div className="a" style={{ marginTop: '8px', color: 'var(--teal)' }}>
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
            <span className={'cat ' + modal.tier}>{modal.category}</span>
            <div className="tl" style={{ marginTop: '8px' }}>{modal.tagline}</div>
            <div className="ver" style={{ marginBottom: '16px' }}>
              <div className="vk"><span className="vlabel">Latest</span><span className="vval">{modal.latestVersion}</span></div>
              <div className="vk"><span className="vlabel">Released</span><span className="vval">{modal.releaseDate}</span></div>
              <div className="vk"><span className="vlabel">License</span><span className="vval">{modal.license}</span></div>
              <div className="vk"><span className="vlabel">Maintainer</span><span className="vval">{modal.maintainer}</span></div>
            </div>
            <div className="sect"><h4>Headline / performance</h4><div className="perf">{modal.perfNote}</div></div>
            <div className="sect"><h4>Key facts</h4>
              <div className="facts">
                {modal.facts.map((f, i) => (
                  <div className="fact" key={i}><div className="fk">{f.k}</div><div className="fv">{f.v}</div></div>
                ))}
              </div>
            </div>
            <div className="sect"><h4>Key features</h4><ul>{modal.keyFeatures.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
            <div className="cols2">
              <div className="sect"><h4>Strengths</h4><ul>{modal.strengths.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
              <div className="sect"><h4>Trade-offs</h4><ul>{modal.tradeoffs.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
            </div>
            <div className="sect"><h4>Best use cases</h4><ul>{modal.bestUseCases.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
            <div className="sect"><h4>Recent updates</h4><ul>{modal.recent.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
            {modal.pipeline && modal.pipeline.length > 0 && (
              <div className="sect pipe"><h4>In the pipeline</h4><ul>{modal.pipeline.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
            )}
            <div className="sect"><h4>Links</h4>
              <div className="chips">
                <span><a href={modal.links.primary.url} target="_blank" rel="noreferrer">{modal.links.primary.label} <span className="arr">↗</span></a></span>
                <span><a href={modal.links.secondary.url} target="_blank" rel="noreferrer">{modal.links.secondary.label} <span className="arr">↗</span></a></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
