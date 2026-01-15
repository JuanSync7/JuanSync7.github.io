import { useEffect, useRef, useState } from "react";

const LifeCycleFSM = ({ isDark }) => {
    const [activeNode, setActiveNode] = useState('IDLE');
    const stateRef = useRef({
        eatCount: 0,
        stepCount: 0
    });

    // --- RESPONSIVE SCALING ---
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);
    const BASE_WIDTH = 600;
    const BASE_HEIGHT = 420;

    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const currentWidth = containerRef.current.offsetWidth;
                setScale(currentWidth / BASE_WIDTH);
            }
        };

        // Initial update
        updateScale();

        // Observer
        const resizeObserver = new ResizeObserver(updateScale);
        if (containerRef.current) resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    // Graph Topology
    const nodes = {
        IDLE:    { x: 60,  y: 140, label: 'IDLE', type: 'circle' },
        
        // Work Cluster (List Format - inside the box)
        MEETING: { x: 250, y: 55,  label: 'MEETING', type: 'text' },
        CODE:    { x: 250, y: 95, label: 'CODE', type: 'text' },
        VERIFY:  { x: 250, y: 135, label: 'VERIFY', type: 'text' },
        DOCS:    { x: 250, y: 175, label: 'DOCS', type: 'text' },
        
        EAT:     { x: 480, y: 140, label: 'EAT', type: 'circle' },
        GYM:     { x: 250, y: 280, label: 'GYM', type: 'circle' },
        SPORT:   { x: 250, y: 360, label: 'SPORT', type: 'circle' }
    };

    // Work Box Dimensions for rendering the rectangle
    const workBox = { x: 160, y: 30, w: 180, h: 180 };

    // Visual connections (High level flows only)
    const connections = [
        // IDLE -> WORK
        { start: {x: nodes.IDLE.x + 32, y: nodes.IDLE.y}, end: {x: workBox.x, y: nodes.IDLE.y}, id: 'start' },
        
        // WORK -> EAT (Top parallel line)
        { start: {x: workBox.x + workBox.w, y: nodes.EAT.y - 15}, end: {x: nodes.EAT.x - 32, y: nodes.EAT.y - 15}, id: 'work_to_eat' },
        
        // EAT -> WORK (Bottom parallel line)
        { start: {x: nodes.EAT.x - 32, y: nodes.EAT.y + 15}, end: {x: workBox.x + workBox.w, y: nodes.EAT.y + 15}, id: 'eat_to_work' },
        
        // EAT -> GYM (Curve from bottom of EAT to Right of GYM)
        { 
            start: {x: nodes.EAT.x, y: nodes.EAT.y + 32}, 
            end: {x: nodes.GYM.x + 32, y: nodes.GYM.y}, 
            control: {x: nodes.EAT.x, y: nodes.GYM.y}, 
            id: 'eat_to_gym', 
            type: 'curve' 
        },

        // EAT -> SPORT (Curve wider/deeper from bottom of EAT to Right of SPORT)
        { 
            start: {x: nodes.EAT.x, y: nodes.EAT.y + 32}, 
            end: {x: nodes.SPORT.x + 32, y: nodes.SPORT.y}, 
            control: {x: nodes.EAT.x, y: nodes.SPORT.y}, 
            id: 'eat_to_sport', 
            type: 'curve' 
        },
        
        // GYM -> IDLE (Curve from Left of GYM to Bottom of IDLE)
        { 
            start: {x: nodes.GYM.x - 32, y: nodes.GYM.y}, 
            end: {x: nodes.IDLE.x, y: nodes.IDLE.y + 32}, 
            control: {x: nodes.IDLE.x, y: nodes.GYM.y}, 
            id: 'gym_to_idle', 
            type: 'curve' 
        },

        // SPORT -> IDLE (Curve from Left of SPORT to Bottom of IDLE - wider)
        { 
            start: {x: nodes.SPORT.x - 32, y: nodes.SPORT.y}, 
            end: {x: nodes.IDLE.x, y: nodes.IDLE.y + 32}, 
            control: {x: nodes.IDLE.x, y: nodes.SPORT.y}, 
            id: 'sport_to_idle', 
            type: 'curve' 
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveNode(current => {
                let next;
                const workNodes = ['MEETING', 'CODE', 'VERIFY', 'DOCS'];
                const isWorkState = workNodes.includes(current);
                
                // LOGIC: IDLE -> 3xWORK -> EAT -> 3xWORK -> EAT -> (GYM or SPORT) -> IDLE
                
                if (current === 'IDLE') {
                    // Reset everything
                    stateRef.current = { eatCount: 0, stepCount: 0 };
                    // Start Session 1
                    next = workNodes[Math.floor(Math.random() * workNodes.length)];
                }
                else if (current === 'GYM' || current === 'SPORT') {
                    next = 'IDLE';
                }
                else if (current === 'EAT') {
                    stateRef.current.eatCount += 1;
                    
                    if (stateRef.current.eatCount < 2) {
                        // Start Session 2
                        stateRef.current.stepCount = 0;
                        next = workNodes[Math.floor(Math.random() * workNodes.length)];
                    } else {
                        // Done for the day - Pick activity
                        next = Math.random() > 0.5 ? 'GYM' : 'SPORT';
                    }
                }
                else if (isWorkState) {
                    stateRef.current.stepCount += 1;
                    
                    if (stateRef.current.stepCount < 3) {
                        // Continue working (pick different task)
                        const options = workNodes.filter(n => n !== current);
                        next = options[Math.floor(Math.random() * options.length)];
                    } else {
                        // Session Done -> Eat
                        next = 'EAT';
                    }
                }
                
                return next || 'IDLE'; // Fallback
            });
        }, 800); 
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full max-w-[600px] mx-auto mt-16 mb-24 relative flex flex-col items-center">
              <div className="font-mono text-xs text-center mb-4 text-slate-400">
                // fsm: routine_sequencer (state={stateRef.current.eatCount === 0 ? 'AM' : 'PM'}, task={stateRef.current.stepCount}/3)
            </div>
            
            {/* The Scalable Container Wrapper */}
            <div 
                ref={containerRef} 
                className="w-full relative" 
                style={{ height: BASE_HEIGHT * scale }}
            >
                {/* The Internal Stage (Fixed Size coordinate system, Scaled by CSS) */}
                <div 
                    style={{ 
                        transform: `scale(${scale})`, 
                        transformOrigin: 'top left',
                        width: BASE_WIDTH,
                        height: BASE_HEIGHT
                    }}
                    className="absolute top-0 left-0 overflow-hidden" 
                >
                    {/* Background Layer (SVG Traces) */}
                    <svg width="600" height="420" viewBox="0 0 600 420" className="absolute inset-0 pointer-events-none">
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill={isDark ? "#334155" : "#cbd5e1"} />
                            </marker>
                        </defs>
                        
                        {/* WORK Container Rectangle */}
                        <rect 
                            x={workBox.x} 
                            y={workBox.y} 
                            width={workBox.w} 
                            height={workBox.h} 
                            rx="8"
                            fill={isDark ? "rgba(30, 41, 59, 0.3)" : "rgba(241, 245, 249, 0.5)"}
                            stroke={isDark ? "#334155" : "#e2e8f0"}
                            strokeWidth="2"
                        />
                        {/* Header Label */}
                        <text 
                            x={workBox.x + 10} 
                            y={workBox.y - 10} 
                            fill={isDark ? "#64748b" : "#94a3b8"}
                            className="font-mono text-[10px] font-bold tracking-widest uppercase"
                        >
                            Work_Block
                        </text>

                        {/* Connection Lines */}
                        {connections.map((conn) => {
                            let d;
                            if (conn.type === 'curve' && conn.control) {
                                d = `M ${conn.start.x} ${conn.start.y} Q ${conn.control.x} ${conn.control.y} ${conn.end.x} ${conn.end.y}`;
                            } else {
                                d = `M ${conn.start.x} ${conn.start.y} L ${conn.end.x} ${conn.end.y}`;
                            }

                            return (
                                <path 
                                    key={conn.id}
                                    d={d}
                                    fill="none"
                                    stroke={isDark ? "#1e293b" : "#e2e8f0"}
                                    strokeWidth="1.5"
                                    markerEnd="url(#arrowhead)"
                                    className="transition-colors duration-300"
                                />
                            );
                        })}
                    </svg>

                    {/* Nodes Layer (HTML Overlays) */}
                    {Object.entries(nodes).map(([key, pos]) => {
                        const isActive = key === activeNode;
                        const isTextNode = pos.type === 'text';
                        
                        // Base classes
                        let bubbleClass = "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10 font-mono ";
                        
                        if (isTextNode) {
                            // Rectangular / Text list item style
                            bubbleClass += "px-4 py-2 rounded w-[140px] text-center text-xs font-bold ";
                            if (isActive) {
                                bubbleClass += isDark 
                                    ? "bg-slate-800 text-[#a3e635] shadow-[0_0_10px_rgba(163,230,53,0.2)] " 
                                    : "bg-white text-green-700 shadow-md ";
                            } else {
                                bubbleClass += "text-slate-400 opacity-60 ";
                            }
                        } else {
                            // Circular Node style (IDLE, EAT, GYM, SPORT)
                            bubbleClass += "w-16 h-16 rounded-full flex items-center justify-center text-xs font-bold border-2 ";
                            if (isActive) {
                                if (isDark) {
                                    bubbleClass += "border-transparent text-[#a3e635] shadow-[0_0_20px_rgba(163,230,53,0.3)] bg-slate-900 scale-110 ";
                                } else {
                                    bubbleClass += "border-green-600 bg-green-50 text-green-700 shadow-[0_0_15px_rgba(22,163,74,0.3)] scale-110 ";
                                }
                            } else {
                                bubbleClass += "border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-950 ";
                            }
                        }

                        const darkActiveStyle = (isActive && isDark && !isTextNode) ? {
                            background: "linear-gradient(#0f172a, #0f172a) padding-box, linear-gradient(to right, #fde047, #a3e635, #22c55e) border-box",
                        } : {};

                        return (
                            <div 
                                key={key}
                                className={bubbleClass}
                                style={{ 
                                    left: pos.x, 
                                    top: pos.y,
                                    ...darkActiveStyle 
                                }}
                            >
                                {pos.label}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default LifeCycleFSM;
