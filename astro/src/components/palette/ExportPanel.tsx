import { useState } from 'react';
import { cssOf, jsonOf, promptOf, TEMPLATE, type Brief } from '../../lib/palette/export';

const TABS = [
  { id: 'prompt', label: 'Prompt', note: 'Paste into any assistant: the template below, filled in with your picks.' },
  { id: 'css', label: 'CSS', note: 'Custom properties, one light-dark() each, plus the base rules.' },
  { id: 'json', label: 'Tokens JSON', note: 'W3C Design Tokens (DTCG), both themes, for Figma or Style Dictionary.' },
  { id: 'template', label: 'Template', note: 'The saved prompt with its blanks, so you can see what is filled in.' },
] as const;
type Tab = (typeof TABS)[number]['id'];

/** The palette handed over: a filled-in prompt for an assistant, or the code to paste. */
export default function ExportPanel({ brief }: { brief: Brief }) {
  const [tab, setTab] = useState<Tab>('prompt');
  const [copied, setCopied] = useState(false);
  const text = tab === 'prompt' ? promptOf(brief) : tab === 'css' ? cssOf(brief) : tab === 'json' ? jsonOf(brief) : TEMPLATE;
  const current = TABS.find((t) => t.id === tab) ?? TABS[0];

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="pal-panel pal-export" aria-labelledby="pal-export-title">
      <h2 id="pal-export-title">Take it with you</h2>
      <div className="pal-tabs" role="tablist" aria-label="Export format">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === tab}
            onClick={() => {
              setTab(t.id);
              setCopied(false);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="pal-note">{current.note}</p>
      <div className="pal-term">
        <div className="pal-term-bar" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <textarea readOnly value={text} aria-label={`${current.label} to copy`} rows={16} spellCheck={false} />
      </div>
      <button type="button" className="pal-copy" onClick={() => void copy()}>
        {copied ? 'Copied' : `Copy the ${current.label.toLowerCase()}`}
      </button>
      <span className="pal-sr" aria-live="polite">
        {copied ? 'Copied to the clipboard' : ''}
      </span>
    </section>
  );
}
