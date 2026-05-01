import { Fragment } from 'react';

interface Stat {
  label: string;
  value: string;
}

const STATS: Stat[] = [
  { label: 'SKILLS', value: '22' },
  { label: 'COMMITS', value: '847' },
  { label: 'TAPE_OUTS', value: '3' },
  { label: 'YEARS_EXP', value: '5' },
  { label: 'COVERAGE', value: '98.7%' },
  { label: 'LANGUAGES', value: '6' },
  { label: 'TOOLS', value: '12' },
  { label: 'PROJECTS', value: '12' },
  { label: 'CERTIFICATIONS', value: '2' },
  { label: 'PUBLICATIONS', value: '1' },
  { label: 'GIT_STREAK', value: '14d' },
];

function TickerRun() {
  return (
    <span className="cp-ticker-item">
      {STATS.map((s, i) => (
        <Fragment key={i}>
          {i > 0 ? ' | ' : ''}
          {s.label}: <b>{s.value}</b>
        </Fragment>
      ))}
    </span>
  );
}

export default function Ticker() {
  return (
    <div className="cp-ticker">
      <div className="cp-ticker-track">
        <TickerRun />
        <span className="cp-ticker-gap" />
        <TickerRun />
      </div>
    </div>
  );
}
