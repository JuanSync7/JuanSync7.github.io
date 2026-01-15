const SimpleMarkdown = ({ content }) => {
    if (!content) return <div className="text-gray-400 italic">No content available.</div>;
    let clean = content
        .replace(/^# (.*$)/gim, '') 
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3 text-slate-800 dark:text-slate-100">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2 text-slate-700 dark:text-slate-200">$1</h3>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
        .replace(/`([^`]+)`/gim, '<code class="bg-gray-100 dark:bg-slate-800 rounded px-1 py-0.5 text-sm font-mono text-green-700 dark:text-lime-400">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" class="text-green-700 dark:text-lime-400 hover:underline">$1</a>')
        .replace(/\n/gim, '<br />');
    return <div className="leading-relaxed text-slate-600 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: clean }} />;
};

export default SimpleMarkdown;
