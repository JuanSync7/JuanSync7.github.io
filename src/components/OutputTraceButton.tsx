const OutputTraceButton = ({ label, onClick, icon, secondary }) => {
    return (
        <div className="flex flex-col items-center group cursor-pointer" onClick={onClick}>
            {/* The Trace Line */}
            <div className="h-12 w-[2px] bg-gray-300 dark:bg-gray-700 group-hover:bg-green-500 transition-colors relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-green-500 -translate-y-full group-hover:animate-[flow_1s_linear_infinite]" style={{ animationDuration: '0.5s' }}></div>
            </div>
            
            {/* The Component/Button */}
            <div className={`
                relative px-6 py-4 rounded-lg border-2 transition-all duration-300 transform group-hover:scale-105 shadow-lg
                ${secondary 
                    ? 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 group-hover:border-green-500' 
                    : 'bg-green-600 dark:bg-green-700 border-green-700 dark:border-green-600 text-white group-hover:shadow-green-500/50'
                }
            `}>
                {/* Tiny pins on component */}
                <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-2 h-[2px] bg-gray-400"></div>
                
                <div className="flex items-center gap-3 font-mono text-sm font-bold">
                    {icon} {label}
                </div>
            </div>
        </div>
    );
};

export default OutputTraceButton;
