'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const SimpleMarkdown = ({ content }) => {
    if (!content) return <div className="text-gray-400 italic">No content available.</div>;

    return (
        <div className="prose dark:prose-invert max-w-none">
            <div className="mb-8">
                <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors no-underline">
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Home
                </Link>
            </div>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden my-4">
                                <div className="flex items-center justify-between px-4 py-2 bg-slate-700/50">
                                    <div className="flex space-x-2">
                                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                    </div>
                                    <span className="text-xs text-slate-400 font-mono">{`code.${match[1]}`}</span>
                                </div>
                                <SyntaxHighlighter
                                    style={materialDark}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                    customStyle={{
                                        backgroundColor: 'transparent',
                                        padding: '1.5rem',
                                        margin: 0,
                                        border: 'none',
                                        boxShadow: 'none',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            </div>
                        ) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default SimpleMarkdown;
