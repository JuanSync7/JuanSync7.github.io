// Lofi Zen Room — CSS pixel art scene + hobby stats

function LofiRoom() {
  const ref = React.useRef(null);
  const visible = useOnScreen(ref, 0.1);

  // Rain drops
  const rain = React.useMemo(() => Array.from({length: 35}, (_, i) => ({
    x: Math.random() * 100,
    delay: Math.random() * 2,
    dur: 0.4 + Math.random() * 0.4,
    h: 6 + Math.random() * 6,
  })), []);

  // Building window lights — CSS animation driven (no React state updates)
  const buildingHeights = [40,68,32,55,82,42,72,38,60,78,35,65,45,70,50];
  const colsPerBuilding = [6,7,6,7,6,7,6,7,7,6,7,6,7,6,7];
  const buildingShapes = ['flat','pointed','flat','antenna','stepped','flat','pointed','flat','stepped','antenna','flat','pointed','flat','antenna','flat'];

  const buildings = React.useMemo(() => {
    return buildingHeights.map((h, bi) => {
      const rows = Math.floor(h / 4);
      const cols = colsPerBuilding[bi];
      const wins = Array.from({length: rows * cols}, (_, i) => ({
        on: Math.random() > 0.85,
        delay: (Math.random() * 20).toFixed(1),
        dur: (10 + Math.random() * 15).toFixed(1),
      }));
      return { h, wins, cols, shape: buildingShapes[bi] };
    });
  }, []);

  return (
    <section className={`hf-section hf-lofi ${visible ? 'hf-visible' : ''}`} ref={ref}>
      {/* Title above window */}
      <div className="lofi-title-overlay">
        <div className="lofi-mode-text">// system.low_power_mode</div>
        <div className="lofi-mode-sub">off the clock · abs. max ratings</div>
      </div>

      {/* Scene */}
      <div className="lofi-scene">
        {/* Sky + clouds */}
        <div className="lofi-sky">
          <div className="lofi-cloud lofi-cloud-1" />
          <div className="lofi-cloud lofi-cloud-2" />
          <div className="lofi-cloud lofi-cloud-3" />
          <div className="lofi-cloud lofi-cloud-4" />
          <div className="lofi-cloud lofi-cloud-5" />
          <div className="lofi-cloud lofi-cloud-6" />
        </div>

        {/* City skyline */}
        <div className="lofi-city">
          {buildings.map((b, i) => (
            <div key={i} className={`lofi-bldg lofi-bldg-${b.shape}`} style={{height: b.h + '%'}}>
              {b.shape === 'antenna' && <div className="lofi-bldg-antenna" />}
              {b.shape === 'stepped' && <div className="lofi-bldg-step" />}
              <div className="lofi-bldg-windows" style={{gridTemplateColumns: `repeat(${b.cols}, 1fr)`}}>
                {b.wins.map((w, wi) => (
                  <span key={wi} className={`lofi-win ${w.on ? 'lofi-win-on' : ''}`}
                    style={{animationDelay: w.delay + 's', animationDuration: w.dur + 's'}} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Rain */}
        {rain.map((r, i) => (
          <span key={i} className="lofi-rain" style={{
            left: r.x + '%',
            animationDelay: r.delay + 's',
            animationDuration: r.dur + 's',
            height: r.h + 'px',
          }} />
        ))}

        {/* String lights */}
        <div className="lofi-lights">
          <svg viewBox="0 0 400 30" className="lofi-lights-wire" preserveAspectRatio="none">
            <path d="M0,8 Q50,18 100,10 Q150,2 200,12 Q250,20 300,10 Q350,4 400,14"
              fill="none" stroke="#4a3860" strokeWidth="1"/>
          </svg>
          <div className="lofi-bulbs">
            {Array.from({length: 10}, (_, i) => (
              <span key={i} className="lofi-bulb" style={{
                animationDelay: (i * 0.4) + 's',
                left: (5 + i * 10) + '%',
              }} />
            ))}
          </div>
        </div>

        {/* Curtains */}
        <div className="lofi-curtain lofi-curtain-left">
          <div className="lofi-curtain-fold" />
          <div className="lofi-curtain-fold" />
          <div className="lofi-curtain-fold" />
        </div>
        <div className="lofi-curtain lofi-curtain-right">
          <div className="lofi-curtain-fold" />
          <div className="lofi-curtain-fold" />
          <div className="lofi-curtain-fold" />
        </div>
        <div className="lofi-curtain-rod" />

        {/* Window frame overlay */}
        <div className="lofi-window-frame">
          {/* Vertical divider */}
          <div className="lofi-window-vmid" />
          {/* Horizontal divider */}
          <div className="lofi-window-hmid" />
          {/* Window latch */}
          <div className="lofi-window-latch" />
        </div>

      </div>

      {/* Hobby stats on wood table */}
      <div className="lofi-stats">
        {/* Coffee mug on table */}
        <div className="lofi-mug-sill">
          <div className="lofi-steam-wrap">
            <span className="lofi-steam s1" />
            <span className="lofi-steam s2" />
            <span className="lofi-steam s3" />
          </div>
          <svg className="lofi-mug-svg" viewBox="0 0 50 60" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="8" width="28" height="6" rx="1" fill="#3a1a08" />
            <path d="M4,8 L4,44 Q4,52 12,52 L28,52 Q36,52 36,44 L36,8 Z"
              fill="#e8d8c4" stroke="#d0c0a8" strokeWidth="1" />
            <rect x="2" y="6" width="36" height="4" rx="2" fill="#f0e4d4" />
            <path d="M36,16 Q48,16 48,28 Q48,40 36,40"
              fill="none" stroke="#e8d8c4" strokeWidth="4" strokeLinecap="round" />
            <path d="M36,18 Q46,18 46,28 Q46,38 36,38"
              fill="none" stroke="#f0e4d4" strokeWidth="1.5" />
            <rect x="8" y="14" width="4" height="24" rx="2" fill="rgba(255,255,255,0.12)" />
            {/* Coffee bean */}
            <g transform="translate(18,26) rotate(-15)">
              <ellipse cx="0" cy="0" rx="5" ry="7" fill="#8B4513" opacity="0.5" />
              <path d="M0,-6 Q-2,0 0,6" fill="none" stroke="#5a2a08" strokeWidth="1" opacity="0.6" />
            </g>
          </svg>
        </div>
        {/* Infinite scrolling hobby logos */}
        <div className="lofi-scroll-track">
          <div className="lofi-scroll-strip">
            {[0,1,2].map(copy => (
              <div className="lofi-scroll-copy" key={copy}>
                <div className="lofi-logo-item">
                  <i className="fa-solid fa-compact-disc lofi-logo-icon" />
                  <span className="lofi-logo-text">ultimate frisbee</span>
                </div>
                <div className="lofi-logo-item">
                  <svg className="lofi-logo-icon" viewBox="0 0 28 28" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <g transform="rotate(-45 14 14)">
                        <ellipse cx="14" cy="7" rx="6.5" ry="7.5" fill="none" stroke="currentColor" strokeWidth="1.8"/>
                        <line x1="14" y1="0.5" x2="14" y2="13.5" stroke="currentColor" strokeWidth="0.5" opacity="0.45"/>
                        <line x1="8.5" y1="7" x2="19.5" y2="7" stroke="currentColor" strokeWidth="0.5" opacity="0.45"/>
                        <line x1="11" y1="1" x2="11" y2="13" stroke="currentColor" strokeWidth="0.4" opacity="0.3"/>
                        <line x1="17" y1="1" x2="17" y2="13" stroke="currentColor" strokeWidth="0.4" opacity="0.3"/>
                        <line x1="8.5" y1="4" x2="19.5" y2="4" stroke="currentColor" strokeWidth="0.4" opacity="0.3"/>
                        <line x1="8.5" y1="10" x2="19.5" y2="10" stroke="currentColor" strokeWidth="0.4" opacity="0.3"/>
                        <line x1="14" y1="14.5" x2="14" y2="27" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                      </g>
                    </svg>
                  <span className="lofi-logo-text">badminton</span>
                </div>
                <div className="lofi-logo-item">
                  <i className="fa-solid fa-person-swimming lofi-logo-icon" />
                  <span className="lofi-logo-text">swimming</span>
                </div>
                <div className="lofi-logo-item">
                  <i className="fa-solid fa-music lofi-logo-icon" />
                  <span className="lofi-logo-text">piano</span>
                </div>
                <div className="lofi-logo-item">
                  <i className="fa-solid fa-earth-americas lofi-logo-icon" />
                  <span className="lofi-logo-text">travelling</span>
                </div>
                <div className="lofi-logo-item">
                  <i className="fa-solid fa-terminal lofi-logo-icon" />
                  <span className="lofi-logo-text">vibe coding</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

window.LofiRoom = LofiRoom;
