import { LANG_COLOR, timeAgo, type Repo } from './projects-data';

interface Props {
  repo: Repo;
}

export default function ProjectCard({ repo }: Props) {
  const langColor = (repo.language && LANG_COLOR[repo.language]) || 'var(--hf-ink-soft)';
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
          {repo.topics.slice(0, 4).map((t) => (
            <span key={t} className="pj-card-tag">#{t}</span>
          ))}
        </div>
      )}
    </a>
  );
}
