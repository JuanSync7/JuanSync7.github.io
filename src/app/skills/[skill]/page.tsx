import SimpleMarkdown from '@/components/SimpleMarkdown';
import { notFound } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';

const DYNAMIC_FILES = {
    'systemverilog': 'SystemVerilog.md'
};

export function generateStaticParams() {
    return Object.keys(DYNAMIC_FILES).map(skill => ({
        skill: skill,
    }));
}

const SkillPage = async ({ params }: { params: { skill: string } }) => {
    const fileName = DYNAMIC_FILES[params.skill.toLowerCase()];

    if (!fileName) {
        notFound();
    }

    let content = '';
    try {
        const filePath = path.join(process.cwd(), 'public', fileName);
        content = await fs.readFile(filePath, 'utf8');
    } catch (error) {
        console.error("Error reading markdown file:", error);
        content = `# Error\nFailed to load file: ${fileName}`;
    }

    return (
        <div className="bg-stone-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-200 transition-colors duration-300 bg-grid-pattern bg-fixed">
            <main className="max-w-4xl mx-auto p-8 md:p-16">
                 <div className="prose dark:prose-invert max-w-none prose-a:text-green-700 dark:prose-a:text-lime-600 hover:prose-a:text-green-500 prose-code:text-green-700 dark:prose-code:text-lime-400 font-mono">
                    <SimpleMarkdown content={content} />
                </div>
            </main>
        </div>
    );
};

export default SkillPage;
