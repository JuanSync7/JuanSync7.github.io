// Projects — editorial filterable card grid with FLIP animations

function Projects() {
  const ref = React.useRef(null);
  const visible = useOnScreen(ref, 0.1);
  const [filter, setFilter] = React.useState('all');

  const allProjects = [
    { id: '01', name: 'uvm-axi-vip', tag: 'verif', desc: 'reusable axi vip in uvm w/ scoreboard' },
    { id: '02', name: 'riscv-vec-core', tag: 'rtl', desc: 'vector extension on rv32imc base' },
    { id: '03', name: 'dft-autoflow', tag: 'infra', desc: 'python-driven testmax dft pipeline' },
    { id: '04', name: 'mcp-chip-agent', tag: 'ai', desc: 'mcp server for chip-flow tools' },
    { id: '05', name: 'rag-rtl', tag: 'ai', desc: 'rag over IP docs + system verilog ref' },
    { id: '06', name: 'lint-pipeline', tag: 'infra', desc: 'company-wide linting standard' },
  ];

  const tags = ['all', 'rtl', 'verif', 'ai', 'infra'];
  const filtered = filter === 'all' ? allProjects : allProjects.filter(p => p.tag === filter);

  return (
    <section id="projects" className={`hf-section hf-proj-section ${visible ? 'hf-visible' : ''}`} ref={ref}>
      <div className="hf-proj-header">
        <div className="hf-proj-title">selected work.</div>
        <div className="hf-proj-filters">
          {tags.map(t => (
            <button key={t} className={`hf-filter-btn ${filter === t ? 'hf-filter-active' : ''}`}
              onClick={() => setFilter(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="hf-proj-grid">
        {filtered.map((p, i) => (
          <div key={p.id} className="hf-proj-card"
            style={{ animationDelay: (i * 0.08) + 's' }}>
            <div className="hf-proj-card-img">
              <div className="hf-proj-card-placeholder">
                <span className="hf-proj-card-slash">//</span> repo preview
              </div>
            </div>
            <div className="hf-proj-card-body">
              <div className="hf-proj-card-num">{p.id}</div>
              <div className="hf-proj-card-name">{p.name}</div>
              <div className="hf-proj-card-desc">{p.desc}</div>
              <div className="hf-proj-card-foot">
                <span className="hf-proj-card-tag">[{p.tag}]</span>
                <span className="hf-proj-card-link">github →</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

window.Projects = Projects;
