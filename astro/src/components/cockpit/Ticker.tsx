import { Fragment } from 'react';

interface Stat {
  label: string;
  value: string;
}

const STATS: Stat[] = [
  { label: 'SKILLS', value: '22' },
  { label: 'COMMITS', value: '847' },
  { label: 'TAPE_OUTS', value: '2' },
  { label: 'YEARS_EXP', value: '3' },
  { label: 'ATPG_COV', value: '90%+' },
  { label: 'LANGUAGES', value: '6' },
  { label: 'EDA_TOOLS', value: '12' },
  { label: 'PROJECTS', value: '12' },
  { label: 'OSS_REPOS', value: '4' },
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
