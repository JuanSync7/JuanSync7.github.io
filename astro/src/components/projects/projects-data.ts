export const GH_USER = 'JuanSync7';
export const GH_API = `https://api.github.com/users/${GH_USER}/repos?sort=updated&per_page=100`;

export const EXCLUDE = new Set(['juansync7.github.io']);
export const PINNED: readonly string[] = [];
export const MAX_CARDS = 6;

export const LANG_COLOR: Record<string, string> = {
  Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#3178c6',
  HTML: '#e34c26', CSS: '#563d7c', SystemVerilog: '#DAE1C2',
  Verilog: '#b2b7f8', C: '#555555', 'C++': '#f34b7d',
  Rust: '#dea584', Shell: '#89e051', Tcl: '#e4cc98',
  Makefile: '#427819', Dockerfile: '#384d54',
};

export interface Repo {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  topics?: string[];
  fork: boolean;
  archived: boolean;
  private: boolean;
}

export function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  if (s < 31536000) return `${Math.floor(s / 2592000)}mo ago`;
  return `${Math.floor(s / 31536000)}y ago`;
}

export function sortRepos(repos: Repo[]): Repo[] {
  return repos
    .filter((r) => !r.fork && !r.archived && !r.private && !EXCLUDE.has(r.name.toLowerCase()))
    .sort((a, b) => {
      const ai = PINNED.indexOf(a.name);
      const bi = PINNED.indexOf(b.name);
      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }
      if (b.stargazers_count !== a.stargazers_count) {
        return b.stargazers_count - a.stargazers_count;
      }
      return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
    })
    .slice(0, MAX_CARDS);
}
