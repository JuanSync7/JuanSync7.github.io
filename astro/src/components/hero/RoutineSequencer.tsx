import { useEffect, useState } from 'react';
import {
  ARROWS,
  NODES,
  OUTER_STATES,
  WORK_BLOCK,
  WORK_POS,
  WORK_STATES,
  buildSchedule,
  type AnyState,
  type WorkState,
} from './routine-data';

const isWorkState = (s: AnyState): s is WorkState => (WORK_STATES as readonly string[]).includes(s);

const fillFor = (active: AnyState, name: AnyState) =>
  name === active ? 'url(#fsm-glow)' : 'var(--hf-white)';

function formatHour(hour: number): string {
  if (hour < 12) return `${hour}AM`;
  if (hour === 12) return '12PM';
  return `${hour - 12}PM`;
}

export default function RoutineSequencer() {
  const [schedule, setSchedule] = useState(buildSchedule);
  const [activeIdx, setActiveIdx] = useState(0);
  const [taskInBlock, setTaskInBlock] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => {
        const next = prev + 1;
        if (next >= schedule.length) {
          setSchedule(buildSchedule());
          setTaskInBlock(0);
          return 0;
        }
        const nextState = schedule[next].state;
        if (isWorkState(nextState)) {
          setTaskInBlock((t) => t + 1);
        } else if (nextState === 'EAT' || nextState === 'IDLE') {
          setTaskInBlock(0);
        }
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [schedule]);

  const current = schedule[activeIdx];
  const active = current.state;
  const hourStr = formatHour(current.hour);
  const isWorkActive = isWorkState(active);

  return (
    <div className="hf-routine">
      <div className="hf-routine-h">
        // fsm: routine_sequencer (state={active}, hour={hourStr}, task={taskInBlock}/3)
      </div>
      <svg className="hf-routine-svg" viewBox="0 0 600 540" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="fsm-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M30,0 L0,0 L0,30" fill="none" stroke="var(--hf-alpha-white-03)" strokeWidth="0.5" />
          </pattern>
          <marker id="fsm-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0,2 L8,5 L0,8" fill="var(--hf-white)" />
          </marker>
          <marker id="fsm-arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0,2 L8,5 L0,8" fill="var(--hf-accent)" />
          </marker>
          <linearGradient id="fsm-glow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--hf-accent)" />
            <stop offset="100%" stopColor="var(--hf-terminal-glow)" />
          </linearGradient>
        </defs>
        <rect width="600" height="540" fill="url(#fsm-grid)" />

        {ARROWS.map((a, i) => (
          <path key={i} d={a.d} fill="none" stroke="var(--hf-white)" strokeWidth="2.5" markerEnd="url(#fsm-arrow)" />
        ))}

        <rect
          x={WORK_BLOCK.x} y={WORK_BLOCK.y} width={WORK_BLOCK.w} height={WORK_BLOCK.h} rx="6"
          fill="var(--hf-alpha-white-03)"
          stroke={isWorkActive ? 'url(#fsm-glow)' : 'var(--hf-white)'}
          strokeWidth="2.5"
          strokeDasharray={isWorkActive ? 'none' : '6 4'}
        />
        <text x={WORK_BLOCK.x + WORK_BLOCK.w / 2} y={WORK_BLOCK.y - 8} textAnchor="middle"
          fill="var(--hf-alpha-white-35)" fontSize="11" fontFamily="var(--hf-mono)">WORK_BLOCK</text>

        {WORK_STATES.map((s) => {
          const p = WORK_POS[s];
          const isActive = s === active;
          return (
            <g key={s}>
              <rect x={p.x - 60} y={p.y - 14} width="120" height="28" rx="4"
                fill={isActive ? 'var(--hf-accent-fill)' : 'transparent'}
                stroke={isActive ? 'url(#fsm-glow)' : 'var(--hf-white)'}
                strokeWidth={isActive ? 2.5 : 1.5} />
              {isActive && <circle cx={p.x - 48} cy={p.y} r="3" fill="url(#fsm-glow)" className="hf-fsm-pulse" />}
              <text x={p.x} y={p.y + 4} textAnchor="middle"
                fill={fillFor(active, s)} fontSize="12" fontFamily="var(--hf-mono)"
                fontWeight={isActive ? 'bold' : 'normal'}>{s}</text>
            </g>
          );
        })}

        {OUTER_STATES.map((s) => {
          const n = NODES[s];
          const isActive = s === active;
          return (
            <g key={s}>
              <circle cx={n.x} cy={n.y} r={n.r}
                fill="var(--hf-alpha-white-02)"
                stroke={fillFor(active, s)}
                strokeWidth={isActive ? 3 : 2} />
              {isActive && (
                <circle cx={n.x} cy={n.y} r={n.r}
                  fill="none" stroke="url(#fsm-glow)" strokeWidth="2" opacity="0.3"
                  className="hf-fsm-ring" />
              )}
              <text x={n.x} y={n.y + 4} textAnchor="middle"
                fill={fillFor(active, s)} fontSize="12" fontFamily="var(--hf-mono)"
                fontWeight={isActive ? 'bold' : 'normal'}>{s}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
