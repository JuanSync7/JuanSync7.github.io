import { useState, useEffect } from 'react';
import data from '../../data/trackers/chips.json';

const FILTERS = [
  ['all', 'All'],
  ['gpu', 'GPUs'],
  ['wafer', 'Wafer-Scale'],
  ['dataflow', 'Dataflow / LPU'],
  ['asic', 'Inference ASICs'],
  ['riscv', 'RISC-V'],
  ['cloud', 'Cloud-Only'],
];

const STATUS_CLASS = {
  'GA': 'status-ga',
  'Sampling': 'status-sampling',
  'Pre-GA': 'status-prega',
  'Cloud-only': 'status-cloud',
};

export default function Dashboard() {
  const [active, setActive] = useState('all');
  const [modalId, setModalId] = useState(null);

  const chips = data.chips;
  const usecases = data.usecases;
  const watchlist = data.watchlist;
  const pipeline = data.pipeline;

  const tierCounts = {};
  chips.forEach((c) => { tierCounts[c.tier] = (tierCounts[c.tier] || 0) + 1; });
  const gaCount = chips.filter((c) => c.status === 'GA').length;
  const fastestClaim = 'WSE-3: 125 PFLOPS';

  const shown = chips.filter((c) => active === 'all' || c.tier === active);
  const modal = modalId ? chips.find((c) => c.id === modalId) : null;

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
        <div className="stat"><div className="n">{chips.length}</div><div className="l">Chips &amp; architectures tracked</div></div>
        <div className="stat"><div className="n">{gaCount}</div><div className="l">Generally available today</div></div>
        <div className="stat"><div className="n">{fastestClaim}</div><div className="l">Peak AI compute (Cerebras)</div></div>
        <div className="stat"><div className="n">$20B</div><div className="l">Groq acquisition (NVIDIA, 2025)</div></div>
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
            {label} {k !== 'all' && tierCounts[k] ? `(${tierCounts[k]})` : ''}
          </button>
        ))}
      </nav>

      {/* chip grid */}
      <div className="grid">
        {shown.map((c) => (
          <button key={c.id} className="card" type="button" onClick={() => setModalId(c.id)}>
            <h3>
              {c.name}
              <span className={'status-badge ' + (STATUS_CLASS[c.status] || 'status-prega')}>{c.status}</span>
            </h3>
            <span className={'cat ' + c.tier}>{c.category}</span>
            <div className="tl">{c.tagline}</div>
            <div className="metric-line">{c.metric}</div>
            <div className="ver">
              <span>{c.process}</span>
              <span><b>{c.company}</b></span>
            </div>
            <div className="more">View details →</div>
          </button>
        ))}
      </div>

      {/* comparison table */}
      <h2 className="section">Architecture <em>comparison</em></h2>
      <p className="section-sub">Side-by-side specs at a glance. Click any card for full detail. Use tabs to filter by architecture type.</p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Chip</th>
              <th>Architecture</th>
              <th>Process</th>
              <th>Memory / BW</th>
              <th>Peak Compute</th>
              <th>Status</th>
              <th>Best for</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((c) => {
              const memFact = c.facts.find((f) => f.k === 'Memory' || f.k === 'On-chip SRAM' || f.k === 'Memory type');
              const bwFact = c.facts.find((f) => f.k === 'Bandwidth' || f.k === 'On-chip bandwidth');
              const memStr = [memFact?.v, bwFact?.v].filter(Boolean).join(' · ') || '—';
              return (
                <tr key={c.id}>
                  <td><b>{c.name}</b><br /><span className="pill">{c.company}</span></td>
                  <td><span className={'cat ' + c.tier}>{c.category}</span></td>
                  <td>{c.process}</td>
                  <td>{memStr}</td>
                  <td><span style={{ fontFamily: 'var(--mono)', fontSize: '12px' }}>{c.metric.split('·')[0].trim()}</span></td>
                  <td><span className={'status-badge ' + (STATUS_CLASS[c.status] || 'status-prega')}>{c.status}</span></td>
                  <td>{c.bestUseCases[0]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* use-case guide */}
      <h2 className="section">Which chip should <em>I use?</em></h2>
      <p className="section-sub">Quick decision guide by workload and requirements.</p>
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
      <p className="section-sub">Announced, rumoured, or in development. Treat unconfirmed items with caution.</p>
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
      <p className="section-sub">Emerging chips and companies being tracked but not yet promoted to a full card.</p>
      <div className="uc">
        {watchlist.map((w, i) => (
          <div className="uccard" key={i}>
            <div className="q">
              {w.name}{' '}
              <a href={w.link} target="_blank" rel="noreferrer" style={{ fontSize: '11px', fontFamily: 'var(--mono)' }}>↗</a>
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
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', margin: '8px 0' }}>
              <span className={'cat ' + modal.tier}>{modal.category}</span>
              <span className={'status-badge ' + (STATUS_CLASS[modal.status] || 'status-prega')}>{modal.status}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)' }}>{modal.process}</span>
            </div>
            <div className="tl" style={{ marginTop: '8px' }}>{modal.tagline}</div>
            <div className="metric-line" style={{ margin: '6px 0 16px' }}>{modal.metric}</div>

            <div className="sect"><h4>Performance overview</h4><div className="perf">{modal.perfNote}</div></div>

            <div className="sect"><h4>Key specs</h4>
              <div className="facts">
                {modal.facts.map((f, i) => (
                  <div className="fact" key={i}><div className="fk">{f.k}</div><div className="fv">{f.v}</div></div>
                ))}
              </div>
            </div>

            <div className="sect"><h4>Key innovations</h4><ul>{modal.keyInnovations.map((f, i) => <li key={i}>{f}</li>)}</ul></div>

            <div className="cols2">
              <div className="sect"><h4>Strengths</h4><ul>{modal.strengths.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
              <div className="sect"><h4>Trade-offs</h4><ul>{modal.tradeoffs.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
            </div>

            <div className="sect"><h4>Best use cases</h4><ul>{modal.bestUseCases.map((f, i) => <li key={i}>{f}</li>)}</ul></div>

            <div className="sect"><h4>Recent updates</h4><ul>{modal.recent.map((f, i) => <li key={i}>{f}</li>)}</ul></div>

            <div className="sect"><h4>Links</h4>
              <div className="chips">
                <span><a href={modal.links.primary.url} target="_blank" rel="noreferrer">{modal.links.primary.label} ↗</a></span>
                <span><a href={modal.links.secondary.url} target="_blank" rel="noreferrer">{modal.links.secondary.label} ↗</a></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
