import { useEffect, useRef, useState } from 'react';
import { palette, alpha } from '../../styles/tokens/palette';

interface Props {
  query: string;
  onSearch: (value: string) => void;
}

export default function SearchBar({ query, onSearch }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (e.key === '/' && tag !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div
      style={{
        position: 'relative', marginBottom: 20,
        border: `1.5px solid ${focused ? palette.cyan : palette.line}`,
        borderRadius: 8, background: palette.bg2,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: focused ? `0 0 16px ${alpha(palette.cyan, 0.15)}` : 'none',
        display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px',
      }}
    >
      <span style={{ color: palette.lime, fontFamily: 'var(--hf-mono)', fontSize: 13, flexShrink: 0 }}>$</span>
      <span style={{ color: palette.teal, fontFamily: 'var(--hf-mono)', fontSize: 12, flexShrink: 0 }}>grep</span>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onSearch(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="search posts..."
        style={{
          flex: 1, background: 'none', border: 'none', outline: 'none',
          color: palette.ink, fontFamily: 'var(--hf-mono)', fontSize: 13,
          padding: '12px 0', caretColor: palette.lime,
        }}
      />
      {!query && (
        <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 10, color: palette.inkMuted, border: `1px solid ${palette.line}`, borderRadius: 3, padding: '2px 6px' }}>/</span>
      )}
      {query && (
        <button
          type="button"
          onClick={() => onSearch('')}
          style={{ background: 'none', border: 'none', color: palette.inkSoft, cursor: 'pointer', fontFamily: 'var(--hf-mono)', fontSize: 14, padding: '2px 6px' }}
        >
          ×
        </button>
      )}
    </div>
  );
}
