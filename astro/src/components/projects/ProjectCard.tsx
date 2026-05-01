import type { CSSProperties } from 'react';
import { LANG_COLOR, timeAgo, type Repo } from './projects-data';

interface Props {
  repo: Repo;
  onSelect: (repo: Repo) => void;
}

interface CardStyle extends CSSProperties {
  '--card-accent': string;
}

export default function ProjectCard({ repo, onSelect }: Props) {
  const langColor = (repo.language && LANG_COLOR[repo.language]) || 'var(--hf-ink-soft)';
  const style: CardStyle = { '--card-accent': langColor };
  return (
    <button type="button" className="pj-card" style={style} onClick={() => onSelect(repo)}>
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
          {repo.topics.slice(0, 4).map((t) => (
            <span key={t} className="pj-card-tag">#{t}</span>
          ))}
        </div>
      )}
    </button>
  );
}
