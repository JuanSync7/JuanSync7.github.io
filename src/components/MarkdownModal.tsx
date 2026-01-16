import { useEffect, useState } from "react";
import { X } from "lucide-react";
import SimpleMarkdown from "./SimpleMarkdown";

const MarkdownModal = ({ filePath, onClose }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [fileName, setFileName] = useState('');

    useEffect(() => {
        if (!filePath) return;

        const fetchMarkdown = async () => {
            setLoading(true);
            try {
                const res = await fetch(filePath);
                if (res.ok) {
                    const text = await res.text();
                    setContent(text);
                    setFileName(filePath.split('/').pop() || '');
                } else {
                    setContent(`# Error\nFailed to load file: ${filePath}`);
                }
            } catch (err) {
                setContent(`# Error\nAn error occurred while fetching the file: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchMarkdown();
    }, [filePath]);

    if (!filePath) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-3xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 font-mono">{fileName}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                            <div className="w-8 h-8 border-4 border-green-600 dark:border-lime-500 border-t-transparent rounded-full animate-spin" /> Loading...
                        </div>
                    ) : (
                        <div className="prose dark:prose-invert max-w-none prose-a:text-green-700 dark:prose-a:text-lime-600 hover:prose-a:text-green-500 prose-code:text-green-700 dark:prose-code:text-lime-400 font-mono"><SimpleMarkdown content={content} /></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarkdownModal;
