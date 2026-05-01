export default function LofiMug() {
  return (
    <div className="lofi-mug-sill">
      <div className="lofi-steam-wrap">
        <span className="lofi-steam s1" />
        <span className="lofi-steam s2" />
        <span className="lofi-steam s3" />
      </div>
      <svg className="lofi-mug-svg" viewBox="0 0 50 60" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="8" width="28" height="6" rx="1" fill="var(--lofi-mug-rim)" />
        <path
          d="M4,8 L4,44 Q4,52 12,52 L28,52 Q36,52 36,44 L36,8 Z"
          fill="var(--lofi-mug-body)"
          stroke="var(--lofi-mug-shadow)"
          strokeWidth="1"
        />
        <rect x="2" y="6" width="36" height="4" rx="2" fill="var(--lofi-mug-highlight)" />
        <path
          d="M36,16 Q48,16 48,28 Q48,40 36,40"
          fill="none" stroke="var(--lofi-mug-body)" strokeWidth="4" strokeLinecap="round"
        />
        <path
          d="M36,18 Q46,18 46,28 Q46,38 36,38"
          fill="none" stroke="var(--lofi-mug-highlight)" strokeWidth="1.5"
        />
        <rect x="8" y="14" width="4" height="24" rx="2" fill="var(--hf-alpha-white-12)" />
        <g transform="translate(18,26) rotate(-15)">
          <ellipse cx="0" cy="0" rx="5" ry="7" fill="var(--lofi-bean)" opacity="0.5" />
          <path d="M0,-6 Q-2,0 0,6" fill="none" stroke="var(--lofi-bean-line)" strokeWidth="1" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
}
