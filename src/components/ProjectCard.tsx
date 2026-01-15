import React from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';

interface ProjectCardProps {
  repo: any;
  onClick: (repo: any) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ repo, onClick }) => (
  <div onClick={() => onClick(repo)} className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full hover:border-green-300 dark:hover:border-lime-700 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-8 h-8 bg-stone-50 dark:bg-slate-900 -mr-4 -mt-4 rotate-45 border border-slate-200 dark:border-slate-700"></div>

    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-green-50 dark:bg-lime-900/20 rounded-lg text-green-700 dark:text-lime-400"><BookOpen size={20} /></div>
      <div className="flex gap-2">
        <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-sm font-mono">{repo.language || 'Verilog'}</span>
        <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-sm flex items-center gap-1 font-mono">★ {repo.stargazers_count}</span>
      </div>
    </div>
    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 group-hover:text-green-700 dark:group-hover:text-lime-400 transition-colors font-mono tracking-tight">{repo.name}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 flex-1">{repo.description || "No description available. Check the README."}</p>
    <div className="flex items-center text-sm text-green-700 dark:text-lime-400 font-medium mt-auto">
      Read details <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
    </div>
  </div>
);

export default ProjectCard;
