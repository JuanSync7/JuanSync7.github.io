// Projects — selected work, live from GitHub API

const GH_USER = 'JuanSync7';
const GH_API = `https://api.github.com/users/${GH_USER}/repos?sort=updated&per_page=100`;

// Repos to exclude from the grid (lowercase match)
const EXCLUDE = new Set(['juansync7.github.io']);

// Optional: pin specific repos to the top, in this order. Leave empty to sort by stars.
const PINNED = []; // e.g. ['ai-harness', 'soc-floorplanner']

const MAX_CARDS = 6;

// GitHub language colors
const LANG_COLOR = {
  Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#3178c6',
  HTML: '#e34c26', CSS: '#563d7c', SystemVerilog: '#DAE1C2',
  Verilog: '#b2b7f8', C: '#555555', 'C++': '#f34b7d',
  Rust: '#dea584', Shell: '#89e051', Tcl: '#e4cc98',
  Makefile: '#427819', Dockerfile: '#384d54',
};

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)      return s + 's ago';
  if (s < 3600)    return Math.floor(s / 60) + 'm ago';
  if (s < 86400)   return Math.floor(s / 3600) + 'h ago';
  if (s < 2592000) return Math.floor(s / 86400) + 'd ago';
  if (s < 31536000)return Math.floor(s / 2592000) + 'mo ago';
  return Math.floor(s / 31536000) + 'y ago';
}

function ProjectCard({ repo }) {
  const langColor = LANG_COLOR[repo.language] || '#7a9a88';
  return (
    <a className="pj-card" href={repo.html_url} target="_blank" rel="noopener noreferrer">
      <div className="pj-card-head">
        <span className="pj-card-name">{repo.name}</span>
        <span className="pj-card-arr">↗</span>
      </div>
      <div className="pj-card-desc">
        {repo.description || <span className="pj-card-no-desc">// no description</span>}
      </div>
      <div className="pj-card-meta">
        {repo.language && (
          <span className="pj-card-lang">
            <span className="pj-card-lang-dot" style={{ background: langColor }} />
            {repo.language}
          </span>
        )}
        {repo.stargazers_count > 0 && (
          <span className="pj-card-stat">★ {repo.stargazers_count}</span>
        )}
        {repo.forks_count > 0 && (
          <span className="pj-card-stat">⑂ {repo.forks_count}</span>
        )}
        <span className="pj-card-stat pj-card-time">{timeAgo(repo.pushed_at)}</span>
      </div>
      {repo.topics && repo.topics.length > 0 && (
        <div className="pj-card-tags">
          {repo.topics.slice(0, 4).map(t => (
            <span key={t} className="pj-card-tag">#{t}</span>
          ))}
        </div>
      )}
    </a>
  );
}

function Projects() {
  const ref = React.useRef(null);
  const visible = useOnScreen(ref, 0.1);
  const [state, setState] = React.useState({ status: 'loading', repos: [], err: null });

  React.useEffect(() => {
    let cancelled = false;
    fetch(GH_API)
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(all => {
        if (cancelled) return;
        const filtered = all
          .filter(r => !r.fork && !r.archived && !r.private && !EXCLUDE.has(r.name.toLowerCase()))
          .sort((a, b) => {
            // pinned first, in PINNED order
            const ai = PINNED.indexOf(a.name);
            const bi = PINNED.indexOf(b.name);
            if (ai !== -1 || bi !== -1) {
              if (ai === -1) return 1;
              if (bi === -1) return -1;
              return ai - bi;
            }
            // then stars desc, then most-recently-pushed desc
            if (b.stargazers_count !== a.stargazers_count) {
              return b.stargazers_count - a.stargazers_count;
            }
            return new Date(b.pushed_at) - new Date(a.pushed_at);
          })
          .slice(0, MAX_CARDS);
        setState({ status: 'ok', repos: filtered, err: null });
      })
      .catch(err => {
        if (cancelled) return;
        setState({ status: 'err', repos: [], err: err.message });
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section id="projects" className={`hf-section hf-projects ${visible ? 'hf-visible' : ''}`} ref={ref}>
      <div className="hf-hero-tagrow">
        <span>// 0x11. selected_work</span>
        <span className="hf-blink">_</span>
      </div>

      <div className="pj-head">
        <h2 className="pj-title">selected work</h2>
        <span className="pj-sub">
          live from{' '}
          <a href={`https://github.com/${GH_USER}`} target="_blank" rel="noopener noreferrer" className="pj-sub-link">
            github.com/{GH_USER}
          </a>
        </span>
      </div>

      {state.status === 'loading' && (
        <div className="pj-grid">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className="pj-card pj-skel">
              <div className="pj-skel-row" style={{ width: '40%' }} />
              <div className="pj-skel-row" style={{ width: '90%' }} />
              <div className="pj-skel-row" style={{ width: '70%' }} />
            </div>
          ))}
        </div>
      )}

      {state.status === 'err' && (
        <div className="pj-error">
          <div>// fetch failed: {state.err}</div>
          <div className="pj-error-sub">
            github api may be rate-limited (60 req/hr per ip).
            try again later, or visit{' '}
            <a href={`https://github.com/${GH_USER}`} target="_blank" rel="noopener noreferrer">
              github.com/{GH_USER}
            </a>.
          </div>
        </div>
      )}

      {state.status === 'ok' && state.repos.length > 0 && (
        <>
          <div className="pj-grid">
            {state.repos.map(r => <ProjectCard key={r.id} repo={r} />)}
          </div>
          <div className="pj-footer">
            <a className="pj-view-all" href={`https://github.com/${GH_USER}?tab=repositories`}
               target="_blank" rel="noopener noreferrer">
              view all repositories ›
            </a>
          </div>
        </>
      )}
    </section>
  );
}

window.Projects = Projects;
