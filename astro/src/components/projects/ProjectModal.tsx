import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { GH_USER, LANG_COLOR, timeAgo, type Repo } from './projects-data';

interface Props {
  repo: Repo;
  onClose: () => void;
}

interface ModalStyle extends CSSProperties {
  '--card-accent': string;
}

export default function ProjectModal({ repo, onClose }: Props) {
  const langColor = (repo.language && LANG_COLOR[repo.language]) || 'var(--hf-ink-soft)';
  const style: ModalStyle = { '--card-accent': langColor };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="pj-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="pj-modal"
        style={style}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pj-modal-title"
      >
        <button className="pj-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="pj-modal-stripe" />

        <div className="pj-modal-head">
          <div className="pj-modal-path">// {GH_USER}/{repo.name}</div>
          <h3 id="pj-modal-title" className="pj-modal-title">
            <span className="pj-modal-chevron">›</span> {repo.name}
          </h3>
        </div>

        <div className="pj-modal-desc">
          {repo.description || <span className="pj-card-no-desc">// no description provided</span>}
        </div>

        <div className="pj-modal-stats">
          {repo.language && (
            <div className="pj-modal-stat">
              <span className="pj-card-lang-dot" />
              <span>{repo.language}</span>
            </div>
          )}
          <div className="pj-modal-stat">★ {repo.stargazers_count} stars</div>
          <div className="pj-modal-stat">⑂ {repo.forks_count} forks</div>
          <div className="pj-modal-stat">updated {timeAgo(repo.pushed_at)}</div>
        </div>

        {repo.topics && repo.topics.length > 0 && (
          <div className="pj-modal-section">
            <div className="pj-modal-section-h">// topics</div>
            <div className="pj-card-tags">
              {repo.topics.map((t) => (
                <span key={t} className="pj-card-tag">#{t}</span>
              ))}
            </div>
          </div>
        )}

        <div className="pj-modal-actions">
          <a
            className="pj-modal-cta"
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open on GitHub →
          </a>
        </div>
      </div>
    </div>
  );
}
