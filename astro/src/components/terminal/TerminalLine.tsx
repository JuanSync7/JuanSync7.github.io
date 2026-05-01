import type { Line } from './terminal-data';

interface Props {
  line: Line;
  index: number;
}

function PromptHead() {
  return (
    <>
      <span className="hf-prompt">juan@silicon</span>
      <span className="hf-tilde">:~/career$</span>{' '}
    </>
  );
}

export default function TerminalLine({ line, index }: Props) {
  if (line.type === 'cmd-typing') {
    return (
      <div className="hf-term-line">
        <PromptHead />
        <span>{line.text}</span>
        <span className="hf-cursor-inline">▊</span>
      </div>
    );
  }
  if (line.type === 'cmd') {
    return (
      <div className="hf-term-line">
        <PromptHead />
        <span>{line.text}</span>
      </div>
    );
  }
  if (line.type === 'out') {
    return (
      <div className="hf-term-out-grid">
        {line.text.map((t, j) => (
          <span key={j} className="hf-term-file">{t}</span>
        ))}
      </div>
    );
  }
  if (line.type === 'hint') return <div className="hf-term-hint-line">{line.text}</div>;
  if (line.type === 'block') {
    return (
      <div className={`hf-term-block ${index <= 4 ? 'hf-term-block-active' : ''}`}>
        <div className="hf-term-block-title">{line.title}</div>
        <div className="hf-term-block-meta">{line.meta}</div>
        {line.items.map((item, j) => (
          <div key={j} className="hf-term-block-item">{item}</div>
        ))}
      </div>
    );
  }
  if (line.type === 'response') return <div className="hf-term-response">{line.text}</div>;
  return null;
}
