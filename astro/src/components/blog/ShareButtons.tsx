import { useState, type CSSProperties, type MouseEvent } from 'react';

interface Props {
  slug: string;
  title: string;
  color?: string;
}

export default function ShareButtons({ slug, title, color = '#05d9e8' }: Props) {
  const [copied, setCopied] = useState(false);
  const url = `https://juansync7.github.io/blog/${slug}`;

  const share = (platform: 'twitter' | 'linkedin') => {
    const text = encodeURIComponent(title);
    const u = encodeURIComponent(url);
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${u}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    };
    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const btn: CSSProperties = {
    background: 'none', border: `1px solid ${color}33`, borderRadius: 4, color,
    fontFamily: 'var(--hf-mono)', fontSize: 10, padding: '5px 12px', cursor: 'pointer',
    transition: 'all 0.2s', letterSpacing: '0.04em',
  };
  const enter = (e: MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = `${color}15`;
    e.currentTarget.style.borderColor = color;
  };
  const leave = (e: MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'none';
    e.currentTarget.style.borderColor = `${color}33`;
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 10, color: '#4a6a55', marginRight: 4 }}>share:</span>
      <button type="button" style={btn} onClick={() => share('twitter')} onMouseEnter={enter} onMouseLeave={leave}>twitter</button>
      <button type="button" style={btn} onClick={() => share('linkedin')} onMouseEnter={enter} onMouseLeave={leave}>linkedin</button>
      <button type="button" style={btn} onClick={copyLink} onMouseEnter={enter} onMouseLeave={leave}>{copied ? 'copied!' : 'copy link'}</button>
    </div>
  );
}
