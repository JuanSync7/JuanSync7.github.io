export const WORK_STATES = ['MEETING', 'CODE', 'VERIFY', 'DOCS'] as const;
export const OUTER_STATES = ['IDLE', 'EAT', 'GYM', 'SPORT', 'CODING'] as const;
export const EVENING_STATES = ['GYM', 'SPORT', 'CODING'] as const;

export type WorkState = (typeof WORK_STATES)[number];
export type OuterState = (typeof OUTER_STATES)[number];
export type AnyState = WorkState | OuterState;

export interface NodeSpec {
  x: number;
  y: number;
  r: number;
}

export interface WorkPos {
  x: number;
  y: number;
}

export const NODES: Record<OuterState, NodeSpec> = {
  IDLE:   { x: 90,  y: 200, r: 32 },
  EAT:    { x: 510, y: 200, r: 32 },
  GYM:    { x: 300, y: 350, r: 28 },
  SPORT:  { x: 300, y: 420, r: 28 },
  CODING: { x: 300, y: 490, r: 28 },
};

export const WORK_POS: Record<WorkState, WorkPos> = {
  MEETING: { x: 300, y: 125 },
  CODE:    { x: 300, y: 170 },
  VERIFY:  { x: 300, y: 215 },
  DOCS:    { x: 300, y: 260 },
};

export const WORK_BLOCK = { x: 200, y: 80, w: 200, h: 220 };

export interface ScheduleStep {
  state: AnyState;
  hour: number;
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildSchedule(): ScheduleStep[] {
  const pick3 = () => shuffle(WORK_STATES).slice(0, 3) as WorkState[];
  const am = pick3();
  const pm = pick3();
  const evening = EVENING_STATES[Math.floor(Math.random() * EVENING_STATES.length)];
  return [
    { state: 'IDLE',  hour: 8  },
    { state: am[0],   hour: 9  },
    { state: am[1],   hour: 10 },
    { state: am[2],   hour: 11 },
    { state: 'EAT',   hour: 13 },
    { state: pm[0],   hour: 14 },
    { state: pm[1],   hour: 15 },
    { state: pm[2],   hour: 16 },
    { state: 'EAT',   hour: 18 },
    { state: evening, hour: 19 },
    { state: 'IDLE',  hour: 21 },
    { state: 'IDLE',  hour: 23 },
    { state: 'IDLE',  hour: 1  },
    { state: 'IDLE',  hour: 4  },
    { state: 'IDLE',  hour: 6  },
  ];
}

export const ARROWS: { d: string }[] = [
  { d: `M${NODES.IDLE.x + 32},${NODES.IDLE.y} C${NODES.IDLE.x + 80},${NODES.IDLE.y} ${WORK_BLOCK.x - 50},${WORK_BLOCK.y + 100} ${WORK_BLOCK.x},${WORK_BLOCK.y + 100}` },
  { d: `M${WORK_BLOCK.x + WORK_BLOCK.w},${WORK_BLOCK.y + 100} C${WORK_BLOCK.x + WORK_BLOCK.w + 50},${WORK_BLOCK.y + 100} ${NODES.EAT.x - 80},${NODES.EAT.y} ${NODES.EAT.x - 32},${NODES.EAT.y}` },
  { d: `M${NODES.EAT.x},${NODES.EAT.y - 32} C${NODES.EAT.x},${WORK_BLOCK.y - 40} ${WORK_BLOCK.x + WORK_BLOCK.w + 60},${WORK_BLOCK.y + 50} ${WORK_BLOCK.x + WORK_BLOCK.w},${WORK_BLOCK.y + 50}` },
  { d: `M${NODES.EAT.x},${NODES.EAT.y + 32} C${NODES.EAT.x},${NODES.GYM.y} ${NODES.GYM.x + 80},${NODES.GYM.y} ${NODES.GYM.x + 28},${NODES.GYM.y}` },
  { d: `M${NODES.EAT.x},${NODES.EAT.y + 32} C${NODES.EAT.x},${NODES.SPORT.y} ${NODES.SPORT.x + 80},${NODES.SPORT.y} ${NODES.SPORT.x + 28},${NODES.SPORT.y}` },
  { d: `M${NODES.EAT.x},${NODES.EAT.y + 32} C${NODES.EAT.x},${NODES.CODING.y} ${NODES.CODING.x + 80},${NODES.CODING.y} ${NODES.CODING.x + 28},${NODES.CODING.y}` },
  { d: `M${NODES.GYM.x - 28},${NODES.GYM.y} C${NODES.GYM.x - 80},${NODES.GYM.y} ${NODES.IDLE.x},${NODES.GYM.y} ${NODES.IDLE.x},${NODES.IDLE.y + 32}` },
  { d: `M${NODES.SPORT.x - 28},${NODES.SPORT.y} C${NODES.SPORT.x - 100},${NODES.SPORT.y} ${NODES.IDLE.x},${NODES.SPORT.y} ${NODES.IDLE.x},${NODES.IDLE.y + 32}` },
  { d: `M${NODES.CODING.x - 28},${NODES.CODING.y} C${NODES.CODING.x - 120},${NODES.CODING.y} ${NODES.IDLE.x},${NODES.CODING.y} ${NODES.IDLE.x},${NODES.IDLE.y + 32}` },
];
