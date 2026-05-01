import { useMemo, useRef } from 'react';
import { useOnScreen } from '@/hooks/useOnScreen';
import LofiCity from './LofiCity';
import LofiMug from './LofiMug';
import LofiHobbyScroll from './LofiHobbyScroll';
import { makeBuildings, makeRain } from './lofi-data';

export default function LofiRoom() {
  const ref = useRef<HTMLElement>(null);
  const visible = useOnScreen(ref, 0.1);
  const rain = useMemo(() => makeRain(35), []);
  const buildings = useMemo(() => makeBuildings(), []);

  return (
    <section className={`hf-section hf-lofi ${visible ? 'hf-visible' : ''}`} ref={ref}>
      <div className="lofi-title-overlay">
        <div className="lofi-mode-text">// system.low_power_mode</div>
        <div className="lofi-mode-sub">off the clock · abs. max ratings</div>
      </div>

      <div className="lofi-scene">
        <div className="lofi-sky">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className={`lofi-cloud lofi-cloud-${n}`} />
          ))}
        </div>

        <LofiCity buildings={buildings} />

        {rain.map((r, i) => (
          <span
            key={i}
            className="lofi-rain"
            style={{
              left: `${r.x}%`,
              animationDelay: `${r.delay}s`,
              animationDuration: `${r.dur}s`,
              height: `${r.h}px`,
            }}
          />
        ))}

        <div className="lofi-lights">
          <svg viewBox="0 0 400 30" className="lofi-lights-wire" preserveAspectRatio="none">
            <path
              d="M0,8 Q50,18 100,10 Q150,2 200,12 Q250,20 300,10 Q350,4 400,14"
              fill="none" stroke="var(--lofi-string-wire)" strokeWidth="1"
            />
          </svg>
          <div className="lofi-bulbs">
            {Array.from({ length: 10 }, (_, i) => (
              <span
                key={i}
                className="lofi-bulb"
                style={{ animationDelay: `${i * 0.4}s`, left: `${5 + i * 10}%` }}
              />
            ))}
          </div>
        </div>

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

        <div className="lofi-window-frame">
          <div className="lofi-window-vmid" />
          <div className="lofi-window-hmid" />
          <div className="lofi-window-latch" />
        </div>
      </div>

      <div className="lofi-stats">
        <LofiMug />
        <LofiHobbyScroll />
      </div>
    </section>
  );
}
