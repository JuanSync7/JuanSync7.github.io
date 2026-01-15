import { useEffect, useState } from "react";

const InverterChainDivider = ({ isDark }) => {
    const [tick, setTick] = useState(0);
    const [count, setCount] = useState(20); // Default, updates on mount
    
    // Dynamically calculate how many inverters fit on the screen
    useEffect(() => {
        const updateCount = () => {
            const unitWidth = 45;
            const width = window.innerWidth;
            // Add a small buffer (+2) to ensure edges are covered
            const newCount = Math.ceil(width / unitWidth) + 2;
            setCount(newCount);
        };

        // Run initially and on resize
        updateCount();
        window.addEventListener('resize', updateCount);
        return () => window.removeEventListener('resize', updateCount);
    }, []);
    
    useEffect(() => {
        let frame;
        const animate = () => {
            setTick(t => {
                // Restart from the left once it reaches the end (plus a small buffer)
                if (t > count + 2) return -2;
                return t + 0.1; // Constant speed
            });
            frame = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(frame);
    }, [count]); // Re-bind animation loop when count changes to update reset threshold

    return (
        <div className="w-full h-24 flex items-center justify-center my-4 overflow-hidden bg-transparent relative">
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-stone-50 dark:from-slate-950 to-transparent z-10"></div>
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-stone-50 dark:from-slate-950 to-transparent z-10"></div>

            {/* Removed min-w-[1200px] so it scales down on mobile correctly */}
            <svg width="100%" height="60" className="max-w-full opacity-90">
                <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <g transform="translate(0, 25)">
                {Array.from({ length: count }).map((_, i) => {
                    const unitWidth = 45;
                    const x = i * unitWidth + 20;
                    const y = 0;
                    
                    // Only activate if the "signal" (tick) is passing through this specific gate
                    const dist = Math.abs(i - tick);
                    const isActive = dist < 0.6; // Strict threshold to light up one at a time
                    
                    const strokeInactive = isDark ? '#365314' : '#bbf7d0'; 
                    const strokeActive = isDark ? '#a3e635' : '#16a34a'; 
                    const fillActive = isDark ? '#a3e635' : '#16a34a'; 
                    
                    const currentStroke = isActive ? strokeActive : strokeInactive;
                    const currentFill = isActive ? fillActive : 'transparent';
                    const opacity = isActive ? 1 : 0.3;

                    // Logic Simulation:
                    // Even index inverters (0, 2, 4...): Input=1, Output=0
                    // Odd index inverters (1, 3, 5...): Input=0, Output=1
                    const inputVal = i % 2 === 0 ? '1' : '0';
                    const outputVal = i % 2 === 0 ? '0' : '1';

                    return (
                        <g key={i} style={{ opacity, transition: 'opacity 0.1s' }}>
                            <line x1={x - 10} y1={y} x2={x} y2={y} stroke={currentStroke} strokeWidth="2" />
                            
                            {/* Triangle */}
                            <path d={`M ${x} ${y-8} L ${x} ${y+8} L ${x+14} ${y} Z`} fill="none" stroke={currentStroke} strokeWidth="2" />
                            
                            {/* Bubble */}
                            <circle cx={x + 18} cy={y} r={4} fill={currentFill} stroke={currentStroke} strokeWidth={isActive ? 0 : 2} filter={isActive ? "url(#glow)" : ""} />
                            
                            {/* Output Wire */}
                            <line x1={x + 22} y1={y} x2={x + unitWidth - 10} y2={y} stroke={currentStroke} strokeWidth="2" />

                            {/* Logic Value Labels (Only visible when active) */}
                            {isActive && (
                                <>
                                    <text x={x - 5} y={y - 12} textAnchor="middle" fill={strokeActive} fontSize="10" fontFamily="monospace" fontWeight="bold">{inputVal}</text>
                                    <text x={x + 30} y={y - 12} textAnchor="middle" fill={strokeActive} fontSize="10" fontFamily="monospace" fontWeight="bold">{outputVal}</text>
                                </>)}
                        </g>
                    );
                })}
                </g>
            </svg>
        </div>
    )
}

export default InverterChainDivider;
