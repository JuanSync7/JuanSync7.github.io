export type Shape = 'flat' | 'pointed' | 'antenna' | 'stepped';

export interface Window {
  on: boolean;
  delay: string;
  dur: string;
}

export interface Building {
  h: number;
  cols: number;
  shape: Shape;
  wins: Window[];
}

export interface Drop {
  x: number;
  delay: number;
  dur: number;
  h: number;
}

const HEIGHTS = [40, 68, 32, 55, 82, 42, 72, 38, 60, 78, 35, 65, 45, 70, 50];
const COLS = [6, 7, 6, 7, 6, 7, 6, 7, 7, 6, 7, 6, 7, 6, 7];
const SHAPES: Shape[] = [
  'flat', 'pointed', 'flat', 'antenna', 'stepped',
  'flat', 'pointed', 'flat', 'stepped', 'antenna',
  'flat', 'pointed', 'flat', 'antenna', 'flat',
];

export function makeBuildings(): Building[] {
  return HEIGHTS.map((h, bi) => {
    const rows = Math.floor(h / 4);
    const cols = COLS[bi];
    const wins: Window[] = Array.from({ length: rows * cols }, () => ({
      on: Math.random() > 0.85,
      delay: (Math.random() * 20).toFixed(1),
      dur: (10 + Math.random() * 15).toFixed(1),
    }));
    return { h, wins, cols, shape: SHAPES[bi] };
  });
}

export function makeRain(count = 35): Drop[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    delay: Math.random() * 2,
    dur: 0.4 + Math.random() * 0.4,
    h: 6 + Math.random() * 6,
  }));
}

export const HOBBIES = [
  { icon: 'fa-solid fa-compact-disc', label: 'ultimate frisbee' },
  { icon: 'badminton-svg', label: 'badminton' },
  { icon: 'fa-solid fa-person-swimming', label: 'swimming' },
  { icon: 'fa-solid fa-music', label: 'piano' },
  { icon: 'fa-solid fa-earth-americas', label: 'travelling' },
  { icon: 'fa-solid fa-terminal', label: 'vibe coding' },
] as const;
