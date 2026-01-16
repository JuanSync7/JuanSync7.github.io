import React from 'react';
import Link from 'next/link';

interface SkillBadgeProps {
  name: string;
  type: 'hardware' | 'eda' | 'code';
  onClick?: () => any;
}

const SkillBadge: React.FC<SkillBadgeProps> = ({ name, type, onClick }) => {
  const colors = {
    hardware: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
    eda: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800",
    code: "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
  };

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`px-3 py-1 rounded-sm text-xs font-mono font-medium border ${colors[type] || colors.code} mr-2 mb-2 inline-block relative hover:scale-105 transition-transform cursor-pointer`}
      >
        <span className="absolute left-0 top-1/2 -translate-x-full w-[2px] h-[4px] bg-current opacity-30 -mt-[2px]"></span>
        <span className="absolute right-0 top-1/2 translate-x-full w-[2px] h-[4px] bg-current opacity-30 -mt-[2px]"></span>
        {name}
      </button>
    );
  }

  return (
    <Link
      href={`/skills/${name.toLowerCase()}`}
      className={`px-3 py-1 rounded-sm text-xs font-mono font-medium border ${colors[type] || colors.code} mr-2 mb-2 inline-block relative hover:scale-105 transition-transform cursor-pointer`}
    >
      <span className="absolute left-0 top-1/2 -translate-x-full w-[2px] h-[4px] bg-current opacity-30 -mt-[2px]"></span>
      <span className="absolute right-0 top-1/2 translate-x-full w-[2px] h-[4px] bg-current opacity-30 -mt-[2px]"></span>
      {name}
    </Link>
  );
};

export default SkillBadge;
