import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useOnScreen } from '@/hooks/useOnScreen';
import { useInView } from '@/hooks/useInView';
import TerminalNebula from './TerminalNebula';
import TerminalLine from './TerminalLine';
import { useAutoTyping } from './useAutoTyping';
import { EASTER_EGGS, FILE_BLOCKS, SCRIPT, type Line } from './terminal-data';

export default function Terminal() {
  const ref = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const visible = useOnScreen(ref, 0.4);
  const inView = useInView(ref, '300px 0px');

  const [lines, setLines] = useState<Line[]>([]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [userMode, setUserMode] = useState(false);
  const [userInput, setUserInput] = useState('');

  const onComplete = useCallback(() => setUserMode(true), []);
  useAutoTyping(visible, SCRIPT, setLines, onComplete);

  useEffect(() => {
    const i = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(i);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cmd = userInput.trim().toLowerCase();
    if (!cmd) return;
    const egg = EASTER_EGGS[cmd];

    if (egg === '__CLEAR__') {
      setLines([]);
      setUserInput('');
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (egg === '__LS__') {
      setLines((prev) => [
        ...prev,
        { type: 'cmd', text: cmd },
        { type: 'out', text: ['aion-senior.md*', 'aion-asic.md', 'southampton.md'] },
      ]);
      setUserInput('');
      return;
    }
    if (cmd.startsWith('cat ')) {
      const file = cmd.substring(4).trim();
      const block = FILE_BLOCKS[file];
      if (block) {
        setLines((prev) => [...prev, { type: 'cmd', text: cmd }, block]);
        setUserInput('');
        return;
      }
      setLines((prev) => [
        ...prev,
        { type: 'cmd', text: cmd },
        {
          type: 'response',
          text: `cat: ${file}: No such file or directory. Try: aion-senior.md, aion-asic.md, southampton.md`,
        },
      ]);
      setUserInput('');
      return;
    }

    const response =
      cmd === 'cat'
        ? 'usage: cat <file>  — try: cat aion-senior.md'
        : egg ?? `zsh: command not found: ${cmd}. Try 'help'`;

    setLines((prev) => [
      ...prev,
      { type: 'cmd', text: cmd },
      { type: 'response', text: response },
    ]);
    setUserInput('');
  };

  const focusInput = () => inputRef.current?.focus();
  const lastLine = lines[lines.length - 1];
  const showIdleCursor = !userMode && lines.length > 0 && lastLine?.type !== 'cmd-typing';

  return (
    <section id="work" className="hf-section hf-term-section" ref={ref}>
      {inView && <TerminalNebula />}
      <div className="hf-term-window" onClick={focusInput}>
        <div className="hf-term-bar">
          <span className="hf-term-dot hf-term-dot-r" />
          <span className="hf-term-dot hf-term-dot-y" />
          <span className="hf-term-dot hf-term-dot-g" />
          <span className="hf-term-title">~/career — zsh</span>
        </div>
        <div className="hf-term-body">
          {lines.map((line, i) => (
            <TerminalLine key={i} line={line} index={i} />
          ))}

          {userMode && (
            <form onSubmit={handleSubmit} className="hf-term-input-row">
              <span className="hf-prompt">juan@silicon</span>
              <span className="hf-tilde">:~/career$</span>{' '}
              <input
                ref={inputRef}
                className="hf-term-input"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                spellCheck="false"
                autoComplete="off"
              />
              <span className={`hf-cursor-inline ${cursorVisible ? '' : 'hf-cursor-hide'}`}>▊</span>
            </form>
          )}

          {showIdleCursor && (
            <div className="hf-term-line">
              <span className="hf-prompt">juan@silicon</span>
              <span className="hf-tilde">:~/career$</span>{' '}
              <span className={`hf-cursor-inline ${cursorVisible ? '' : 'hf-cursor-hide'}`}>▊</span>
            </div>
          )}
        </div>
        <div className="hf-term-hint">click to type · try: whoami, sudo hire-me, neofetch</div>
      </div>
    </section>
  );
}
