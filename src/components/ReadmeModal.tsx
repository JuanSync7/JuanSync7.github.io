import { useEffect, useState } from "react";
import { ExternalLink, Github, X } from "lucide-react";
import SimpleMarkdown from "./SimpleMarkdown";

const ReadmeModal = ({ repo, onClose }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReadme = async () => {
            try {
                const branches = ['main', 'master'];
                let found = false;
                for (const branch of branches) {
                    const res = await fetch(`https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/${branch}/README.md`);
                    if (res.ok) {
                        const text = await res.text();
                        setContent(text);
                        found = true;
                        break;
                    }
                }
                if (!found) setContent('# No README found\nThis repository does not appear to have a README.md file.');
            } catch (err) {
                setContent('# Error\nFailed to load README.');
            } finally {
                setLoading(false);
            }
        };
        fetchReadme();
    }, [repo]);

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-3xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 font-mono"><Github size={18} /> {repo.name}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                            <div className="w-8 h-8 border-4 border-green-600 dark:border-lime-500 border-t-transparent rounded-full animate-spin" /> Loading README...
                        </div>
                    ) : (
                        <div className="prose dark:prose-invert max-w-none prose-a:text-green-700 dark:prose-a:text-lime-600 hover:prose-a:text-green-500 prose-code:text-green-700 dark:prose-code:text-lime-400 font-mono"><SimpleMarkdown content={content} /></div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                    <a href={repo.html_url} target="_blank" className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                        View on GitHub <ExternalLink size={16} />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ReadmeModal;
