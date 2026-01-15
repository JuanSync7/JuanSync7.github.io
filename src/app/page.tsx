"use client";

import React, { useState, useEffect } from 'react';
import { Globe, CircuitBoard, FileText, Download, Briefcase, GraduationCap, Cpu } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import ChipPackage from '../components/ChipPackage';
import OutputTraceButton from '../components/OutputTraceButton';
import LifeCycleFSM from '../components/LifeCycleFSM';
import InverterChainDivider from '../components/InverterChainDivider';
import ProjectCard from '../components/ProjectCard';
import SkillBadge from '../components/SkillBadge';
import CharacterCanvas from '../components/CharacterCanvas';
import ReadmeModal from '../components/ReadmeModal';

export default function Home() {
  const [activeSection, setActiveSection] = useState('about');
  const [isDark, setIsDark] = useState(false);
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [loadingRepos, setLoadingRepos] = useState(false);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const scrollToSection = (id: string) => {
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

  return (
    <div className={`min-h-screen font-sans ${isDark ? 'dark' : ''}`}>
      <div className="bg-stone-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-200 transition-colors duration-300 bg-grid-pattern bg-fixed">
        
        <Sidebar activeSection={activeSection} onNavigate={scrollToSection} toggleTheme={toggleTheme} isDark={isDark} />
        
        <main className="md:ml-64 min-h-screen flex flex-col relative z-10">
          <div className="flex-1 pb-24 space-y-16">
            
            {/* --- NEW CHIP-STYLE ABOUT SECTION --- */}
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

              {/* --- OUTPUT TRACES & BUTTONS --- */}
              <div className="flex justify-center gap-16 md:gap-32 mt-[-48px] md:mt-[-48px] relative z-10">
                <OutputTraceButton 
                  label="View_Projects" 
                  onClick={() => scrollToSection('projects')}
                  icon={<CircuitBoard size={16} />} 
                />
                <OutputTraceButton 
                  label="See_CV.pdf" 
                  secondary 
                  onClick={() => scrollToSection('cv')}
                  icon={<FileText size={16} />}
                />
              </div>

              {/* --- FSM CYCLE DIAGRAM --- */}
              <div className="relative z-10 mt-16">
                <LifeCycleFSM isDark={isDark} />
              </div>

            </section>
            
            <InverterChainDivider isDark={isDark} />

            {/* PROJECTS SECTION */}
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

            {/* CV SECTION */}
            <section id="cv" className="max-w-4xl mx-auto p-8 md:p-16 scroll-mt-10">
              <div className="flex justify-between items-start mb-8 border-b border-slate-200 dark:border-slate-800 pb-8">
                <div>
                  <div className="font-mono text-sm text-green-600 dark:text-lime-400 mb-2 opacity-80">// 0x02. Qualifications</div>
                  <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white font-mono">Curriculum Vitae</h2>
                  <p className="text-slate-500 font-mono text-xs">ASIC Design Engineer | Hardware-Software Co-optimization</p>
                </div>
                <a href="./Kok_Shew_Juan_CV_2025.pdf" download className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity font-mono">
                  <Download size={16} /> Download_PDF
                </a>
              </div>

              {/* Summary */}
              <div className="bg-green-50/50 dark:bg-slate-900 p-6 rounded-xl border border-green-100 dark:border-slate-800 mb-12">
                <h3 className="text-sm font-bold text-green-800 dark:text-lime-400 uppercase mb-2 tracking-wider font-mono">/* Professional Summary */</h3>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm md:text-base">
                  Experienced ASIC Design Engineer with expertise in SoC architecture, front-end design flows, and functional verification. 
                  Proven track record in HDL coding, code coverage analysis, constraint-random verification, synthesis, DFT implementation, 
                  and early back-end design explorations. Currently exploring the integration of <strong>AI agents, MCP, and RAG</strong> to develop 
                  fully automated workflow systems for chip design.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-12">
                {/* Main Column */}
                <div className="md:col-span-2 space-y-12">
                  
                  {/* Experience */}
                  <div className="section-block">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 font-mono">
                      <Briefcase className="text-green-700 dark:text-lime-500" size={20} /> Work_Experience
                    </h3>
                    <div className="relative pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-12">
                      
                      {/* Job 1 */}
                      <div className="relative">
                        <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-green-700 dark:bg-lime-600 ring-4 ring-white dark:ring-slate-950 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                        <span className="text-sm font-mono text-green-700 dark:text-lime-400 mb-1 block">Aug 2025 - Present</span>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white">Senior Design Engineer</h4>
                        <p className="text-slate-500 text-sm mb-4">Aion Silicon | London, UK</p>
                        <ul className="space-y-3 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                          <li>• Automated front-end design flows using <strong>Python, TCL, and Shell</strong>, reducing manual effort and improving efficiency.</li>
                          <li>• Re-engineered a <strong>RISC-V vector core</strong> to interface with an external VPU accelerator, ensuring ISA compliance and efficient hazard detection.</li>
                        </ul>
                      </div>

                      {/* Job 2 */}
                      <div className="relative">
                        <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-950 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                        <span className="text-sm font-mono text-slate-500 dark:text-slate-500 mb-1 block">Sep 2023 - July 2025</span>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white">ASIC Design Engineer</h4>
                        <p className="text-slate-500 text-sm mb-4">Aion Silicon | Reading, UK</p>
                        <ul className="space-y-3 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                          <li>• Led front-end design initiatives using <strong>SystemVerilog</strong> for complex IP and SoC projects.</li>
                          <li>• Executed comprehensive functional verification plans using <strong>constrained-random methodologies</strong>.</li>
                          <li>• Managed <strong>DFT implementation</strong> for large-scale, ASIL-B compliant SoCs (90%+ coverage) using Synopsys TestMax.</li>
                          <li>• Established company-wide linting methodologies using Synopsys and Siemens tools.</li>
                          <li>• Performed early-stage design exploration using <strong>Synopsys RTL-Architect</strong>.</li>
                          <li>• Designed and architected system-level solutions, integrating third-party and in-house IP.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Education */}
                  <div className="section-block">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 font-mono">
                      <GraduationCap className="text-green-700 dark:text-lime-500" size={20} /> Education
                    </h3>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-12 h-12 bg-green-50 dark:bg-slate-800 rounded-bl-full z-0"></div>
                      <div className="flex justify-between items-start mb-2 relative z-10">
                        <h4 className="font-bold text-slate-800 dark:text-white">University of Southampton</h4>
                        <span className="text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400 font-mono">2023</span>
                      </div>
                      <p className="text-green-700 dark:text-lime-400 text-sm relative z-10">Master of Engineering (MEng) in Electrical and Electronics Engineering</p>
                    </div>
                  </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-8">
                  
                  {/* Skills */}
                  <div className="section-block">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 font-mono">
                      <CircuitBoard size={20} /> Technical_Skills
                    </h3>
                    
                    <div className="mb-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Hardware Design</h4>
                      <div className="flex flex-wrap">
                        <SkillBadge name="SystemVerilog" type="hardware" />
                        <SkillBadge name="RTL Coding" type="hardware" />
                        <SkillBadge name="UVM" type="hardware" />
                        <SkillBadge name="AMBA AXI/AHB" type="hardware" />
                        <SkillBadge name="PCIe / DDR" type="hardware" />
                        <SkillBadge name="ECC Safety" type="hardware" />
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">EDA Tools</h4>
                      <div className="flex flex-wrap">
                        <SkillBadge name="Synopsys TestMax" type="eda" />
                        <SkillBadge name="Design Compiler" type="eda" />
                        <SkillBadge name="RTL-Architect" type="eda" />
                        <SkillBadge name="VC Spyglass" type="eda" />
                        <SkillBadge name="Verdi / VCS" type="eda" />
                        <SkillBadge name="Verilator" type="eda" />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Scripting & Code</h4>
                      <div className="flex flex-wrap">
                        <SkillBadge name="Python" type="code" />
                        <SkillBadge name="TCL / Bash" type="code" />
                        <SkillBadge name="SystemC" type="code" />
                        <SkillBadge name="Rust (Learning)" type="code" />
                        <SkillBadge name="Git / SVN" type="code" />
                      </div>
                    </div>
                  </div>

                  {/* Interests */}
                  <div className="section-block">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 font-mono">
                      <Cpu size={20} /> Interests
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 font-mono text-xs">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-lime-500 mt-0.5">&gt;</span> AI Agents & RAG in Chip Design
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-lime-500 mt-0.5">&gt;</span> AI-driven Specifications
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-lime-500 mt-0.5">&gt;</span> Web-based Automation Tools
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-lime-500 mt-0.5">&gt;</span> ML Hardware Optimization
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-lime-500 mt-0.5">&gt;</span> Automated Verification Tech
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* --- CHARACTER BALL ANIMATION (Moved to bottom) --- */}
          <div className="flex justify-center pb-12 relative z-10">
            <CharacterCanvas isDark={isDark} /> 
          </div>

          <footer className="p-8 border-t border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-600 text-sm font-mono">
            <p className="flex items-center justify-center gap-2"><Globe size={14} /> Hosted on GitHub Pages • © {new Date().getFullYear()} Shew Juan Kok</p>
          </footer>
        </main>
      </div>
      {selectedRepo && <ReadmeModal repo={selectedRepo} onClose={() => setSelectedRepo(null)} />}
    </div>
  );
}
