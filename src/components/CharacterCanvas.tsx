import { useEffect, useRef, useState } from "react";
import { Activity } from "lucide-react";

const CharacterCanvas = ({ isDark }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const mousePosRef = useRef({ x: 0, y: 0 });
    
    // Hobbies State
    const [activeHobby, setActiveHobby] = useState(-1); // -1 = none lit
    const stateRef = useRef({ lastImpact: false });

    const hobbies = [
        { label: "Ultimate Frisbee", pos: "top-4 left-4 md:left-8" },
        { label: "Badminton", pos: "top-4 right-4 md:right-8" },
        { label: "Swimming", pos: "top-1/2 -translate-y-1/2 left-2 md:left-4" },
        { label: "Piano", pos: "top-1/2 -translate-y-1/2 right-2 md:right-4" },
        { label: "Travelling", pos: "bottom-4 left-4 md:left-12" },
        { label: "Vibe Coding", pos: "bottom-4 right-4 md:right-12" }
    ];

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                mousePosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let time = 0;

        const render = () => {
            time += 0.05;
            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);
            
            const centerX = width / 2;
            const bounceVal = Math.sin(time);
            const bounceOffset = bounceVal * 25; 
            const centerY = height / 2 + bounceOffset; 

            // --- IMPACT LOGIC ---
            const isHittingBottom = bounceVal > 0.8;

            // Sync Hobbies Lighting with Impact
            if (isHittingBottom && !stateRef.current.lastImpact) {
                // Impact Started -> Light random hobby
                const randomHobby = Math.floor(Math.random() * hobbies.length);
                setActiveHobby(randomHobby);
            } else if (!isHittingBottom && stateRef.current.lastImpact) {
                // Impact Ended -> Turn off
                setActiveHobby(-1);
            }
            stateRef.current.lastImpact = isHittingBottom;

            if (containerRef.current) {
                if (isHittingBottom) {
                    if (isDark) {
                        containerRef.current.style.background = '#0f172a';
                        containerRef.current.style.borderColor = "transparent";
                        containerRef.current.style.boxShadow = "0 0 20px rgba(163, 230, 53, 0.4)";
                    } else {
                        containerRef.current.style.background = "rgba(255, 255, 255, 0.6)";
                        containerRef.current.style.borderColor = "#16a34a";
                        containerRef.current.style.boxShadow = "0 0 20px rgba(22, 163, 74, 0.5)";
                    }
                } else {
                    containerRef.current.style.background = 'transparent';
                    containerRef.current.style.borderColor = isDark ? "rgba(71, 85, 105, 0.5)" : "rgba(203, 213, 225, 0.8)";
                    containerRef.current.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
                }
            }

            // --- FILAMENT DRAWING ---
            const filamentY = height - 90; 
            const coilHalfWidth = 50; 
            const baseHalfWidth = 15;
            
            ctx.beginPath();
            ctx.moveTo(centerX - baseHalfWidth, height); 
            ctx.lineTo(centerX - coilHalfWidth, filamentY);
            ctx.moveTo(centerX + coilHalfWidth, filamentY);
            ctx.lineTo(centerX + baseHalfWidth, height);
            
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.lineWidth = 4;
            
            if (isHittingBottom) {
                ctx.strokeStyle = isDark ? '#fde047' : '#16a34a';
                ctx.shadowColor = isDark ? '#fde047' : '#16a34a';
                ctx.shadowBlur = 20;
            } else {
                ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
                ctx.shadowBlur = 0;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // --- CHARACTER DRAWING ---
            let bodyFill, strokeColor, antennaColor;

            if (isDark) {
                const gradient = ctx.createLinearGradient(centerX - 60, centerY - 60, centerX + 60, centerY + 60);
                gradient.addColorStop(0, '#a3e635'); 
                gradient.addColorStop(1, '#16a34a'); 
                bodyFill = gradient;
                strokeColor = '#15803d';
                antennaColor = time % 2 > 1 ? '#eab308' : '#84cc16'; 
            } else {
                bodyFill = '#16a34a'; 
                strokeColor = '#14532d'; 
                antennaColor = time % 2 > 1 ? '#16a34a' : '#86efac'; 
            }

            ctx.beginPath();
            ctx.arc(centerX, centerY, 60, 0, 2 * Math.PI);
            ctx.fillStyle = bodyFill; 
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = strokeColor;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(centerX, centerY - 60);
            ctx.lineTo(centerX, centerY - 90);
            ctx.strokeStyle = strokeColor;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(centerX, centerY - 90, 8, 0, 2 * Math.PI);
            ctx.fillStyle = antennaColor;
            ctx.fill();

            const eyeOffsetX = 20;
            const eyeOffsetY = -10;
            const eyeRadius = 12;
            const pupilRadius = 4;
            
            const dx = mousePosRef.current.x - centerX;
            const dy = mousePosRef.current.y - centerY;
            const angle = Math.atan2(dy, dx);
            const lookDistance = Math.min(5, Math.sqrt(dx*dx + dy*dy) / 20);
            const pupilX = Math.cos(angle) * lookDistance;
            const pupilY = Math.sin(angle) * lookDistance;

            [1, -1].forEach(side => {
                ctx.beginPath();
                ctx.fillStyle = 'white';
                ctx.arc(centerX + (eyeOffsetX * side), centerY + eyeOffsetY, eyeRadius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.fillStyle = '#0f172a'; 
                ctx.arc(centerX + (eyeOffsetX * side) + pupilX, centerY + eyeOffsetY + pupilY, pupilRadius, 0, 2 * Math.PI);
                ctx.fill();
            });
            
            ctx.beginPath();
            ctx.arc(centerX - 25, centerY - 25, 10, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fill();

            animationFrameId = window.requestAnimationFrame(render);
        };
        render();
        return () => window.cancelAnimationFrame(animationFrameId);
    }, [isDark]);

    return (
        <div className="w-full max-w-xl mx-auto mt-12 mb-24">
            
            {/* Header Section - Moved Outside Container */}
            <div className="mb-8 text-center relative z-30">
                <div className="font-mono text-sm text-green-600 dark:text-lime-400 mb-2 opacity-80">// 0x03. Hobbies</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2 font-mono">
                    <Activity className="text-green-700 dark:text-lime-500" size={20} /> Personal_Interests
                </h3>
            </div>

            <div className="relative w-full border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-8 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm transition-colors duration-300">
                {/* Hobbies Text Overlay */}
                {hobbies.map((hobby, i) => (
                    <div key={i} className={`absolute ${hobby.pos} transition-all duration-150 font-mono font-bold text-xs md:text-sm uppercase tracking-wider z-20 ${
                        activeHobby === i 
                        ? (isDark ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)] scale-110' : 'text-green-600 drop-shadow-[0_0_10px_rgba(22,163,74,0.5)] scale-110')
                        : 'text-slate-300 dark:text-slate-700'
                    }`}>
                        {hobby.label}
                    </div>
                ))}

                <div className="flex flex-col items-center">
                    <div 
                        ref={containerRef}
                        className="relative w-[300px] h-[300px] rounded-full border-4 flex items-center justify-center backdrop-blur-md transition-all duration-100 ease-out z-10"
                    >
                        <canvas 
                            ref={canvasRef} 
                            width={300} 
                            height={300} 
                            className="w-full h-full rounded-full cursor-crosshair relative z-10" 
                        />
                        {/* Inner faint glow for effect */}
                        <div className="absolute inset-0 rounded-full bg-green-500/5 pointer-events-none z-0"></div>
                    </div>

                    {/* Light Bulb Base Structure */}
                    <div className="-mt-6 relative z-0">
                        <svg width="120" height="90" viewBox="0 0 120 90" className="drop-shadow-xl">
                            <defs>
                                <linearGradient id="metal-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor={isDark ? "#334155" : "#94a3b8"} />
                                    <stop offset="25%" stopColor={isDark ? "#64748b" : "#cbd5e1"} />
                                    <stop offset="50%" stopColor={isDark ? "#334155" : "#94a3b8"} />
                                    <stop offset="75%" stopColor={isDark ? "#64748b" : "#cbd5e1"} />
                                    <stop offset="100%" stopColor={isDark ? "#334155" : "#94a3b8"} />
                                </linearGradient>
                            </defs>
                            <path d="M 15 0 L 105 0 L 95 60 L 25 60 Z" fill="url(#metal-gradient)" stroke={isDark ? "#1e293b" : "#64748b"} strokeWidth="1" />
                            <path d="M 17 15 Q 60 20 103 15" stroke={isDark ? "#1e293b" : "#64748b"} strokeWidth="2" fill="none" opacity="0.5" />
                            <path d="M 20 30 Q 60 35 100 30" stroke={isDark ? "#1e293b" : "#64748b"} strokeWidth="2" fill="none" opacity="0.5" />
                            <path d="M 23 45 Q 60 50 97 45" stroke={isDark ? "#1e293b" : "#64748b"} strokeWidth="2" fill="none" opacity="0.5" />
                            <path d="M 25 60 L 95 60 L 80 75 L 40 75 Z" fill="#111" />
                            <path d="M 40 75 L 80 75 C 80 85 40 85 40 75" fill={isDark ? "#94a3b8" : "#475569"} />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CharacterCanvas;
