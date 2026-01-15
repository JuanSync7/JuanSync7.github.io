"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
    Github, Linkedin, Mail, BookOpen, Code, FileText, 
    Terminal, ExternalLink, ChevronRight, X, Moon, Sun, Globe,
    Cpu, CircuitBoard, Download, GraduationCap, Briefcase, Activity
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ProjectCard from '@/components/ProjectCard';
import ReadmeModal from '@/components/ReadmeModal';
import InverterChainDivider from '@/components/InverterChainDivider';
import ChipPackage from '@/components/ChipPackage';
import OutputTraceButton from '@/components/OutputTraceButton';
import LifeCycleFSM from '@/components/LifeCycleFSM';
import CharacterCanvas from '@/components/CharacterCanvas';

const Home = () => {
    const [activeSection, setActiveSection] = useState('about');
    const [isDark, setIsDark] = useState(false);
    const [repos, setRepos] = useState([]);
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [loadingRepos, setLoadingRepos] = useState(false);

    useEffect(() => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const scrollToSection = (id) => {
        if (id === 'blog') return; 
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(id);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, { threshold: 0.2, rootMargin: "-20% 0px -50% 0px" });

        const sections = document.querySelectorAll('section[id]');
        sections.forEach(section => observer.observe(section));

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        setLoadingRepos(true);
        fetch('https://api.github.com/users/JuanSync7/repos?sort=updated&per_page=12')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setRepos(data); })
            .catch(err => console.error(err))
            .finally(() => setLoadingRepos(false));
    }, []);

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle('dark');
    };

    return (
        <div className="bg-stone-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-200 transition-colors duration-300 bg-grid-pattern bg-fixed">
            <Sidebar activeSection={activeSection} onNavigate={scrollToSection} toggleTheme={toggleTheme} isDark={isDark} />
            
            <main className="md:ml-64 min-h-screen flex flex-col relative z-10">
                <div className="flex-1 pb-24 space-y-16">
                    
                    <section id="about" className="min-h-screen flex flex-col justify-center max-w-6xl mx-auto px-4 md:px-16 py-8 animate-in relative">
                        <ChipPackage isDark={isDark}>
                            <div className="text-center max-w-3xl mx-auto">
                                <div className="font-mono text-sm text-green-400 mb-2">// 0x00. Introduction</div>
                                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-white">
                                    Hi, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-lime-300">Shew Juan Kok</span>.
                                </h1>
                                <p className="text-lg text-gray-400 leading-relaxed mb-4">
                                    I am a <strong>Senior Design Engineer</strong> with strong expertise in <strong>Front-end Design</strong> and <strong>functional verification</strong>. I also have strong knowledge in Verification, SoC architecture, Synthesis, and DFT.
                                </p>
                                <p className="text-lg text-gray-400 leading-relaxed">
                                    Currently, I am exploring the integration of <strong>AI Agentic Systems</strong>, MCP, and RAG-based systems to fully automate chip design workflows.
                                </p>
                            </div>
                        </ChipPackage>

                        <div className="flex justify-center gap-16 md:gap-32 mt-[-48px] md:mt-[-48px] relative z-10">
                            <OutputTraceButton 
                                label="View_Projects"
                                onClick={() => scrollToSection('projects')}
                                icon={<CircuitBoard size={16} />} secondary={undefined}                            />
                            <OutputTraceButton 
                                label="See_CV.pdf" 
                                secondary 
                                onClick={() => scrollToSection('cv')}
                                icon={<FileText size={16} />}
                            />
                        </div>

                        <div className="relative z-10 mt-16">
                            <LifeCycleFSM isDark={isDark} />
                        </div>
                    </section>
                    
                    <InverterChainDivider isDark={isDark} />

                    <section id="projects" className="max-w-6xl mx-auto p-8 md:p-16 scroll-mt-10">
                        <div className="mb-12">
                            <div className="font-mono text-sm text-green-600 dark:text-lime-400 mb-2 opacity-80">// 0x01. Portfolio</div>
                            <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white font-mono">module selected_projects;</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-mono text-sm">
                                // Fetched live from <a href="https://github.com/JuanSync7" className="text-green-700 dark:text-lime-600 hover:underline">github.com/JuanSync7</a>
                            </p>
                        </div>
                        {loadingRepos ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {repos.length > 0 ? repos.map(repo => <ProjectCard key={repo.id} repo={repo} onClick={setSelectedRepo} />) : <div className="col-span-full text-center py-20 text-slate-400">No public repositories found.</div>}
                            </div>
                        )}
                    </section>

                    <InverterChainDivider isDark={isDark} />
                    
                    <section id="cv" className="max-w-4xl mx-auto p-8 md:p-16 scroll-mt-10">
                         {/* CV Content Here */}
                    </section>
                </div>

                <div className="flex justify-center pb-12 relative z-10">
                    <CharacterCanvas isDark={isDark} /> 
                </div>

                <footer className="p-8 border-t border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-600 text-sm font-mono">
                    <p className="flex items-center justify-center gap-2"><Globe size={14} /> Hosted on GitHub Pages • © {new Date().getFullYear()} Shew Juan Kok</p>
                </footer>
            </main>
            {selectedRepo && <ReadmeModal repo={selectedRepo} onClose={() => setSelectedRepo(null)} />}
        </div>
    );
};

export default Home;
