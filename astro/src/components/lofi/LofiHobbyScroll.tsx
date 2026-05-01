import BadmintonIcon from './BadmintonIcon';
import { HOBBIES } from './lofi-data';

export default function LofiHobbyScroll() {
  return (
    <div className="lofi-scroll-track">
      <div className="lofi-scroll-strip">
        {[0, 1, 2].map((copy) => (
          <div className="lofi-scroll-copy" key={copy}>
            {HOBBIES.map((h) => (
              <div className="lofi-logo-item" key={h.label}>
                {h.icon === 'badminton-svg' ? (
                  <BadmintonIcon />
                ) : (
                  <i className={`${h.icon} lofi-logo-icon`} />
                )}
                <span className="lofi-logo-text">{h.label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
