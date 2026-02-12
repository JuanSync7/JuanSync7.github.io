import { BookOpen, Code, FileText, Github, Linkedin, Mail, Moon, Sun, Terminal } from "lucide-react";

const Sidebar = ({ activeSection, onNavigate, toggleTheme, isDark }) => {
    const navItems = [
        { id: 'about', label: 'About', index: '00', icon: <Terminal size={18} /> },
        { id: 'projects', label: 'Projects', index: '01', icon: <Code size={18} /> },
        { id: 'cv', label: 'CV / Resume', index: '10', icon: <FileText size={18} /> },
        { id: 'blog', label: 'Blog', index: '11', icon: <BookOpen size={18} /> },
    ];

    return (
        <aside className="w-full md:w-64 md:fixed md:h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-300 z-50">
            <div className="p-8 flex flex-col items-center text-center border-b border-slate-100 dark:border-slate-800">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 mb-4 shadow-lg group relative">
                     <div className="absolute inset-0 rounded-full border-4 border-transparent group-hover:border-green-600 dark:group-hover:border-lime-400 transition-colors z-10 pointer-events-none"></div>
                    <img src="https://github.com/JuanSync7.png" alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" onError={(e) => {(e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan'}} />
                </div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Shew Juan Kok</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider font-mono">ASIC Design Engineer</p>
                <div className="flex gap-3 justify-center">
                    <a href="https://github.com/JuanSync7" target="_blank" className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"><Github size={20} /></a>
                    <a href="https://www.linkedin.com/in/shewjuankok/" target="_blank" className="text-slate-400 hover:text-blue-600 transition-colors"><Linkedin size={20} /></a>
                    <a href="mailto:kokshewjuan7@outlook.com" className="text-slate-400 hover:text-red-500 transition-colors"><Mail size={20} /></a>
                </div>
            </div>
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    {navItems.map((item) => (
                        <li key={item.id}>
                            <button onClick={() => onNavigate(item.id)} 
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group
                                ${activeSection === item.id 
                                    ? 'bg-green-50 text-green-800 border-green-200 dark:bg-lime-900/20 dark:text-lime-400 shadow-sm border dark:border-lime-900/30' 
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                <span className={`font-mono text-xs opacity-50 ${activeSection === item.id ? 'text-green-600 dark:text-lime-500' : 'group-hover:text-green-600'}`}>{item.index}</span>
                                {item.icon} {item.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <a href="https://github.com/JuanSync7/JuanSync7.github.io/raw/main/Kok_Shew_Juan_CV_2025.pdf" target="_blank" download className="w-full flex items-center justify-center gap-2 py-2 mb-2 rounded-lg font-medium transition-all bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm hover:shadow-md text-sm">
                    <FileText size={16} /> Download CV
                </a>
                <button onClick={toggleTheme} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all theme-gradient-bg theme-gradient-bg-hover text-white shadow-md hover:shadow-lg text-sm">
                    {isDark ? <Sun size={16} /> : <Moon size={16} />} {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;