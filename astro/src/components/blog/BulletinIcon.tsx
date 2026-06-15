import type { ReactNode } from 'react';

const PATHS: Record<string, ReactNode> = {
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  branch: <><line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></>,
  chart: <><line x1="6" y1="20" x2="6" y2="12" /><line x1="12" y1="20" x2="12" y2="5" /><line x1="18" y1="20" x2="18" y2="14" /></>,
  terminal: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9l3 3-3 3M13 15h4" /></>,
  book: <><path d="M6 4h9l3 3v13H6z" /><path d="M9 10h6M9 14h4" /></>,
  star: <><path d="M12 3l1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7z" /></>,
  coffee: <><path d="M5 9h12v4a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" /><path d="M17 10h2a2 2 0 0 1 0 4h-2" /><path d="M8 4V3M11 4V3M14 4V3" /></>,
  chip: <><rect x="7" y="7" width="10" height="10" rx="1.5" /><path d="M10 7V4M14 7V4M10 20v-3M14 20v-3M7 10H4M7 14H4M20 10h-3M20 14h-3" /></>,
};

interface Props { name: string; color: string; size?: number; }

export default function BulletinIcon({ name, color, size = 26 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name] ?? PATHS.terminal}
    </svg>
  );
}
