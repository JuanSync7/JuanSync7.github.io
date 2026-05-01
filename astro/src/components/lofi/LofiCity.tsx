import type { Building } from './lofi-data';

interface Props {
  buildings: Building[];
}

export default function LofiCity({ buildings }: Props) {
  return (
    <div className="lofi-city">
      {buildings.map((b, i) => (
        <div key={i} className={`lofi-bldg lofi-bldg-${b.shape}`} style={{ height: `${b.h}%` }}>
          {b.shape === 'antenna' && <div className="lofi-bldg-antenna" />}
          {b.shape === 'stepped' && <div className="lofi-bldg-step" />}
          <div className="lofi-bldg-windows" style={{ gridTemplateColumns: `repeat(${b.cols}, 1fr)` }}>
            {b.wins.map((w, wi) => (
              <span
                key={wi}
                className={`lofi-win ${w.on ? 'lofi-win-on' : ''}`}
                style={{ animationDelay: `${w.delay}s`, animationDuration: `${w.dur}s` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
