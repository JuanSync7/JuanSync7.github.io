import { useEffect, useRef, useState } from 'react';
import { useOnScreen } from '@/hooks/useOnScreen';
import ProjectCard from './ProjectCard';
import { GH_API, GH_USER, sortRepos, type Repo } from './projects-data';

type State =
  | { status: 'loading' }
  | { status: 'ok'; repos: Repo[] }
  | { status: 'err'; err: string };

export default function Projects() {
  const ref = useRef<HTMLElement>(null);
  const visible = useOnScreen(ref, 0.1);
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetch(GH_API)
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json() as Promise<Repo[]>;
      })
      .then((all) => {
        if (cancelled) return;
        setState({ status: 'ok', repos: sortRepos(all) });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setState({ status: 'err', err: msg });
      });
    return () => {
      cancelled = true;
    };
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
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="pj-card pj-skel">
              <div className="pj-skel-row pj-skel-row-sm" />
              <div className="pj-skel-row pj-skel-row-lg" />
              <div className="pj-skel-row pj-skel-row-md" />
            </div>
          ))}
        </div>
      )}

      {state.status === 'err' && (
        <div className="pj-error">
          <div>// fetch failed: {state.err}</div>
          <div className="pj-error-sub">
            github api may be rate-limited (60 req/hr per ip). try again later, or visit{' '}
            <a href={`https://github.com/${GH_USER}`} target="_blank" rel="noopener noreferrer">
              github.com/{GH_USER}
            </a>.
          </div>
        </div>
      )}

      {state.status === 'ok' && state.repos.length > 0 && (
        <>
          <div className="pj-grid">
            {state.repos.map((r) => (
              <ProjectCard key={r.id} repo={r} />
            ))}
          </div>
          <div className="pj-footer">
            <a
              className="pj-view-all"
              href={`https://github.com/${GH_USER}?tab=repositories`}
              target="_blank"
              rel="noopener noreferrer"
            >
              view all repositories ›
            </a>
          </div>
        </>
      )}
    </section>
  );
}
