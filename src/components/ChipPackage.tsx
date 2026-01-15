import React from 'react';

interface ChipPackageProps {
  children: React.ReactNode;
  isDark: boolean;
}

const ChipPackage: React.FC<ChipPackageProps> = ({ children, isDark }) => {
  const pinsH = 6; 
  const pinsW = 8; 

  return (
    <div className="relative p-6 md:p-12 mx-auto max-w-5xl my-12">
      <div className="absolute inset-0 pointer-events-none -z-10 opacity-30 dark:opacity-20 hidden md:block">
      </div>

      <div className="relative bg-[#1a1a1a] rounded-2xl md:rounded-3xl shadow-2xl border-4 border-[#2d2d2d] z-20 overflow-visible">
        
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none rounded-2xl md:rounded-3xl"></div>
        
        <div className="absolute top-4 left-4 w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#111] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] border border-gray-800 z-30"></div>

        <div className="absolute bottom-4 right-6 text-[10px] md:text-xs font-mono text-gray-500 opacity-60 tracking-widest pointer-events-none z-30 transform -rotate-0"> 
          <br/>
          Juan-SOC-1999-X1
        </div>

        {/* Left Pins */}
        <div className="absolute left-0 top-12 bottom-12 flex flex-col justify-between -ml-[12px] md:-ml-[16px] py-4">
          {Array.from({length: pinsH}).map((_, i) => (
            <div key={`l-${i}`} className="w-3 md:w-4 h-6 md:h-8 pin-gradient rounded-l-sm border-r border-gray-600 shadow-sm relative group">
              <div className="absolute right-full top-1/2 -translate-y-1/2 h-[2px] w-4 md:w-8 bg-green-500/20 group-hover:bg-green-500 transition-colors"></div>
            </div>
          ))}
        </div>
        {/* Right Pins */}
        <div className="absolute right-0 top-12 bottom-12 flex flex-col justify-between -mr-[12px] md:-mr-[16px] py-4">
          {Array.from({length: pinsH}).map((_, i) => (
            <div key={`r-${i}`} className="w-3 md:w-4 h-6 md:h-8 pin-gradient rounded-r-sm border-l border-gray-600 shadow-sm relative group">
              <div className="absolute left-full top-1/2 -translate-y-1/2 h-[2px] w-4 md:w-8 bg-green-500/20 group-hover:bg-green-500 transition-colors"></div>
            </div>
          ))}
        </div>
        {/* Top Pins */}
        <div className="absolute top-0 left-12 right-12 flex justify-between -mt-[12px] md:-mt-[16px] px-4">
          {Array.from({length: pinsW}).map((_, i) => (
            <div key={`t-${i}`} className="h-3 md:h-4 w-6 md:w-8 pin-gradient-v rounded-t-sm border-b border-gray-600 shadow-sm relative group">
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-[2px] h-4 md:h-8 bg-green-500/20 group-hover:bg-green-500 transition-colors"></div>
            </div>
          ))}
        </div>
        {/* Bottom Pins */}
        <div className="absolute bottom-0 left-12 right-12 flex justify-between -mb-[12px] md:-mb-[16px] px-4">
          {Array.from({length: pinsW}).map((_, i) => (
            <div key={`b-${i}`} className="h-3 md:h-4 w-6 md:w-8 pin-gradient-v rounded-b-sm border-t border-gray-600 shadow-sm relative group">
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[2px] h-4 md:h-8 bg-green-500/20 group-hover:bg-green-500 transition-colors"></div>
            </div>
          ))}
        </div>

        <div className="relative z-20 p-8 md:p-12 text-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ChipPackage;
