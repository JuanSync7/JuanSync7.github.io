import { useEffect, useRef, useState } from 'react';

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
        border: `1.5px solid ${focused ? '#05d9e8' : '#243028'}`,
        borderRadius: 8, background: '#0e0e0e',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: focused ? '0 0 16px rgba(5,217,232,0.15)' : 'none',
        display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px',
      }}
    >
      <span style={{ color: '#c8d837', fontFamily: 'var(--hf-mono)', fontSize: 13, flexShrink: 0 }}>$</span>
      <span style={{ color: '#1ba0a0', fontFamily: 'var(--hf-mono)', fontSize: 12, flexShrink: 0 }}>grep</span>
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
          color: '#e4ecd8', fontFamily: 'var(--hf-mono)', fontSize: 13,
          padding: '12px 0', caretColor: '#c8d837',
        }}
      />
      {!query && (
        <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 10, color: '#4a6a55', border: '1px solid #243028', borderRadius: 3, padding: '2px 6px' }}>/</span>
      )}
      {query && (
        <button
          type="button"
          onClick={() => onSearch('')}
          style={{ background: 'none', border: 'none', color: '#7a9a88', cursor: 'pointer', fontFamily: 'var(--hf-mono)', fontSize: 14, padding: '2px 6px' }}
        >
          ×
        </button>
      )}
    </div>
  );
}
