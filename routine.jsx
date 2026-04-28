// Routine Sequencer — FSM day schedule

function RoutineSequencer() {
  const workStates = ['MEETING','CODE','VERIFY','DOCS'];
  const outerStates = ['IDLE','EAT','GYM','SPORT','CODING'];
  const eveningStates = ['GYM','SPORT','CODING'];

  function buildSchedule() {
    const shuffle = (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    const pick3 = () => shuffle(workStates).slice(0, 3);
    const am = pick3();
    const pm = pick3();
    const evening = eveningStates[Math.floor(Math.random() * eveningStates.length)];
    return [
      { state: 'IDLE',    hour: 8  },
      { state: am[0],     hour: 9  },
      { state: am[1],     hour: 10 },
      { state: am[2],     hour: 11 },
      { state: 'EAT',     hour: 13 },
      { state: pm[0],     hour: 14 },
      { state: pm[1],     hour: 15 },
      { state: pm[2],     hour: 16 },
      { state: 'EAT',     hour: 18 },
      { state: evening,   hour: 19 },
      { state: 'IDLE',    hour: 21 },
      { state: 'IDLE',    hour: 23 },
      { state: 'IDLE',    hour: 1  },
      { state: 'IDLE',    hour: 4  },
      { state: 'IDLE',    hour: 6  },
    ];
  }

  const [schedule, setSchedule] = React.useState(() => buildSchedule());
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [taskInBlock, setTaskInBlock] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx(prev => {
        const next = prev + 1;
        if (next >= schedule.length) {
          setSchedule(buildSchedule());
          setTaskInBlock(0);
          return 0;
        }
        const nextState = schedule[next].state;
        if (workStates.includes(nextState)) {
          setTaskInBlock(t => t + 1);
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
  const hour = current.hour;
  const hourStr = hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`;

  const isWorkActive = workStates.includes(active);

  // Node positions
  const nodes = {
    IDLE:    { x: 90,  y: 200, r: 32 },
    EAT:     { x: 510, y: 200, r: 32 },
    GYM:     { x: 300, y: 350, r: 28 },
    SPORT:   { x: 300, y: 420, r: 28 },
    CODING:  { x: 300, y: 490, r: 28 },
  };
  const wb = { x: 200, y: 80, w: 200, h: 220 };
  const workPos = {
    MEETING: { x: 300, y: 125 },
    CODE:    { x: 300, y: 170 },
    VERIFY:  { x: 300, y: 215 },
    DOCS:    { x: 300, y: 260 },
  };

  const arrows = [
    { d: `M${nodes.IDLE.x + 32},${nodes.IDLE.y} C${nodes.IDLE.x + 80},${nodes.IDLE.y} ${wb.x - 50},${wb.y + 100} ${wb.x},${wb.y + 100}` },
    { d: `M${wb.x + wb.w},${wb.y + 100} C${wb.x + wb.w + 50},${wb.y + 100} ${nodes.EAT.x - 80},${nodes.EAT.y} ${nodes.EAT.x - 32},${nodes.EAT.y}` },
    { d: `M${nodes.EAT.x},${nodes.EAT.y - 32} C${nodes.EAT.x},${wb.y - 40} ${wb.x + wb.w + 60},${wb.y + 50} ${wb.x + wb.w},${wb.y + 50}` },
    { d: `M${nodes.EAT.x},${nodes.EAT.y + 32} C${nodes.EAT.x},${nodes.GYM.y} ${nodes.GYM.x + 80},${nodes.GYM.y} ${nodes.GYM.x + 28},${nodes.GYM.y}` },
    { d: `M${nodes.EAT.x},${nodes.EAT.y + 32} C${nodes.EAT.x},${nodes.SPORT.y} ${nodes.SPORT.x + 80},${nodes.SPORT.y} ${nodes.SPORT.x + 28},${nodes.SPORT.y}` },
    { d: `M${nodes.EAT.x},${nodes.EAT.y + 32} C${nodes.EAT.x},${nodes.CODING.y} ${nodes.CODING.x + 80},${nodes.CODING.y} ${nodes.CODING.x + 28},${nodes.CODING.y}` },
    { d: `M${nodes.GYM.x - 28},${nodes.GYM.y} C${nodes.GYM.x - 80},${nodes.GYM.y} ${nodes.IDLE.x},${nodes.GYM.y} ${nodes.IDLE.x},${nodes.IDLE.y + 32}` },
    { d: `M${nodes.SPORT.x - 28},${nodes.SPORT.y} C${nodes.SPORT.x - 100},${nodes.SPORT.y} ${nodes.IDLE.x},${nodes.SPORT.y} ${nodes.IDLE.x},${nodes.IDLE.y + 32}` },
    { d: `M${nodes.CODING.x - 28},${nodes.CODING.y} C${nodes.CODING.x - 120},${nodes.CODING.y} ${nodes.IDLE.x},${nodes.CODING.y} ${nodes.IDLE.x},${nodes.IDLE.y + 32}` },
  ];

  const textFill = (name) => name === active ? 'url(#fsm-glow)' : 'rgba(255,255,255,1)';
  const strokeFill = (name) => name === active ? 'url(#fsm-glow)' : 'rgba(255,255,255,1)';

  return (
    <div className="hf-routine">
      <div className="hf-routine-h">
        // fsm: routine_sequencer (state={active}, hour={hourStr}, task={taskInBlock}/3)
      </div>
      <svg className="hf-routine-svg" viewBox="0 0 600 540" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="fsm-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M30,0 L0,0 L0,30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
          </pattern>
          <marker id="fsm-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0,2 L8,5 L0,8" fill="rgba(255,255,255,1)" />
          </marker>
          <marker id="fsm-arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0,2 L8,5 L0,8" fill="var(--hf-accent)" />
          </marker>
          <linearGradient id="fsm-glow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c8d837" />
            <stop offset="100%" stopColor="#39ff14" />
          </linearGradient>
        </defs>
        <rect width="600" height="540" fill="url(#fsm-grid)" />

        {arrows.map((a, i) => (
          <path key={i} d={a.d} fill="none" stroke="rgba(255,255,255,1)" strokeWidth="2.5"
            markerEnd="url(#fsm-arrow)" />
        ))}

        <rect x={wb.x} y={wb.y} width={wb.w} height={wb.h} rx="6"
          fill="rgba(255,255,255,0.03)" stroke={isWorkActive ? 'url(#fsm-glow)' : 'rgba(255,255,255,1)'}
          strokeWidth="2.5" strokeDasharray={isWorkActive ? 'none' : '6 4'} />
        <text x={wb.x + wb.w / 2} y={wb.y - 8} textAnchor="middle"
          fill="rgba(255,255,255,0.35)" fontSize="11" fontFamily="var(--hf-mono)">WORK_BLOCK</text>

        {workStates.map((s) => {
          const p = workPos[s];
          const isActive = s === active;
          return (
            <g key={s}>
              <rect x={p.x - 60} y={p.y - 14} width="120" height="28" rx="4"
                fill={isActive ? 'rgba(200,216,55,0.12)' : 'transparent'}
                stroke={isActive ? 'url(#fsm-glow)' : 'rgba(255,255,255,1)'}
                strokeWidth={isActive ? 2.5 : 1.5} />
              {isActive && <circle cx={p.x - 48} cy={p.y} r="3" fill="url(#fsm-glow)" className="hf-fsm-pulse" />}
              <text x={p.x} y={p.y + 4} textAnchor="middle"
                fill={textFill(s)} fontSize="12" fontFamily="var(--hf-mono)"
                fontWeight={isActive ? 'bold' : 'normal'}>{s}</text>
            </g>
          );
        })}

        {outerStates.map((s) => {
          const n = nodes[s];
          const isActive = s === active;
          return (
            <g key={s}>
              <circle cx={n.x} cy={n.y} r={n.r}
                fill="rgba(255,255,255,0.02)"
                stroke={strokeFill(s)}
                strokeWidth={isActive ? 3 : 2} />
              {isActive && <circle cx={n.x} cy={n.y} r={n.r}
                fill="none" stroke="url(#fsm-glow)" strokeWidth="2" opacity="0.3"
                className="hf-fsm-ring" />}
              <text x={n.x} y={n.y + 4} textAnchor="middle"
                fill={textFill(s)} fontSize="12" fontFamily="var(--hf-mono)"
                fontWeight={isActive ? 'bold' : 'normal'}>{s}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

window.RoutineSequencer = RoutineSequencer;
