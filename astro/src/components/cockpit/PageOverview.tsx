import { useEffect, useRef, useState, type RefObject } from 'react';
import { drawDonut } from './draw/donut';
import SysLog from './SysLog';
import Heatmap from './Heatmap';
import Ticker from './Ticker';
import { CAREER_STATS } from '@/data/site';

interface Props {
  gpuRef: RefObject<HTMLCanvasElement>;
  tpRef: RefObject<HTMLCanvasElement>;
  playing: boolean;
  setPlaying: (fn: (p: boolean) => boolean) => void;
  smooth: boolean;
  setSmooth: (fn: (s: boolean) => boolean) => void;
  mode: number;
  setMode: (n: number) => void;
  goTo: (p: number) => void;
}

interface Stat {
  color: string;
  val: string;
  label: string;
}

const STATS: Stat[] = [
  { color: 'var(--cp-asic)',      val: String(CAREER_STATS.skills),   label: 'Skills' },
  { color: 'var(--cp-script)',    val: String(CAREER_STATS.commits),  label: 'Commits' },
  { color: 'var(--cp-ai-orange)', val: String(CAREER_STATS.years),    label: 'Years' },
  { color: 'var(--cp-ai)',        val: String(CAREER_STATS.tapeouts), label: 'Tape-outs' },
  { color: 'var(--cp-eda)',       val: String(CAREER_STATS.projects), label: 'Projects' },
];

interface Cat {
  page: number;
  color: string;
  border: string;
  bg: string;
  label: string;
}

const CATS: Cat[] = [
  { page: 1, color: 'var(--cp-asic)',   border: 'rgba(27,160,160,0.3)',  bg: 'rgba(27,160,160,0.05)',  label: 'asic.core ›' },
  { page: 2, color: 'var(--cp-ai)',     border: 'rgba(255,107,107,0.3)', bg: 'rgba(255,107,107,0.05)', label: 'ai.pipeline ›' },
  { page: 3, color: 'var(--cp-eda)',    border: 'rgba(110,200,230,0.3)', bg: 'rgba(110,200,230,0.05)', label: 'eda.toolchain ›' },
  { page: 4, color: 'var(--cp-script)', border: 'rgba(200,216,55,0.3)',  bg: 'rgba(200,216,55,0.05)',  label: 'scripts.src ›' },
];

export default function PageOverview({
  gpuRef, tpRef, playing, setPlaying, smooth, setSmooth, mode, setMode, goTo,
}: Props) {
  const [gainVal, setGainVal] = useState(70);
  const distRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawDonut(distRef.current);
  }, []);

  return (
    <div className="cp-bento">
      <div className="cp-tile cp-tile-full">
        <div className="cp-topic"><span className="cp-slash">//</span> vitals</div>
        <div className="cp-stat-row">
          {STATS.map((s) => (
            <div key={s.label} className="cp-stat-card">
              <div className="cp-stat-bar" style={{ background: s.color }} />
              <div className="cp-stat-val" style={{ color: s.color }}>{s.val}</div>
              <div className="cp-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="cp-tile cp-tile-a">
        <div className="cp-topic"><span className="cp-slash">//</span> output rate <span className="cp-sub">— live</span></div>
        <div className="cp-tp-wrap">
          <canvas ref={tpRef} width={320} height={180} className="cp-canvas-tp" />
        </div>
        <SysLog />
      </div>
      <div className="cp-tile cp-tile-b">
        <div className="cp-topic"><span className="cp-slash">//</span> proficiency</div>
        <div className="cp-donut-wrap">
          <canvas ref={distRef} width={500} height={380} className="cp-canvas-donut" />
        </div>
      </div>

      <div className="cp-bento-row3">
        <div className="cp-tile">
          <div className="cp-topic"><span className="cp-slash">//</span> skill growth <span className="cp-sub">— live</span></div>
          <div className="cp-ctrl">
            {['1m', '5m', '15m'].map((label, i) => (
              <div
                key={i}
                className={`cp-rb${mode === i ? ' cp-rb-on' : ''}`}
                onClick={() => setMode(i)}
              >
                {label}
              </div>
            ))}
            <div
              className={`cp-play${playing ? ' cp-play-on' : ' cp-play-off'}`}
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? '▶' : '❚❚'}
            </div>
            <div className="cp-tgl-wrap" onClick={() => setSmooth((s) => !s)}>
              <div className={`cp-tgl${smooth ? ' cp-tgl-on' : ''}`}>
                <div className="cp-tgl-thumb" />
              </div>
              <span className="cp-tgl-lbl">smooth</span>
            </div>
            <div className="cp-sl-wrap cp-ctrl-gain">
              <span className="cp-sl-lbl">gain</span>
              <input
                type="range" className="cp-slider-h"
                min="0" max="100" value={gainVal} step="1"
                onChange={(e) => setGainVal(+e.target.value)}
              />
              <span className="cp-sl-lbl">{gainVal}</span>
            </div>
          </div>
          <div className="cp-chart-wrap">
            <div className="cp-axis-l">% proficiency</div>
            <canvas ref={gpuRef} width={740} height={130} className="cp-canvas-fluid" />
            <div className="cp-axis-b">timeline</div>
          </div>
        </div>
        <div className="cp-tile">
          <div className="cp-topic"><span className="cp-slash">//</span> commit streak</div>
          <Heatmap />
        </div>
      </div>

      <div className="cp-tile cp-tile-full">
        <div className="cp-topic">
          <span className="cp-slash">//</span> explore <span className="cp-sub">— each module links to a dedicated skill page</span>
        </div>
        <div className="cp-cat-btns">
          {CATS.map((c) => (
            <div
              key={c.page}
              className="cp-cat-btn"
              style={{ borderColor: c.border, color: c.color, background: c.bg }}
              onClick={() => goTo(c.page)}
            >
              <span className="cp-cat-dot" style={{ background: c.color }} /> {c.label}
            </div>
          ))}
        </div>
        <Ticker />
      </div>
    </div>
  );
}
