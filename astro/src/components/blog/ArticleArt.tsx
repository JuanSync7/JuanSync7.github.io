import React from 'react';
import './article-art.css';
import { computeArt } from '../art/artGeometry';
import type { Motif, Space, Relation } from '../art/artGeometry';
import ArtMotifs from './ArtMotifs';

/* ── Article art (Linear /now style) — thin React renderer ───────────────────
   Geometry is shared with trackers/ArticleArt.astro via ../art/artGeometry.ts.
   This file owns the wrapper + the 3D backdrop; the foreground motif layer lives
   in ./ArtMotifs. Edit geometry in the core, never here. ──────────────────────── */
export type { Motif, Space, Relation };

interface Props {
  seed?: string;
  motif?: Motif;
  space?: Space;
  variant?: Relation;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

// category → motif now lives in the shared registry; re-exported here so existing
// importers (FeaturedParallax) keep their import path.
export { motifForCategory } from '../../config/registry';

export default function ArticleArt({
  seed = 'article',
  motif = 'loop',
  space = 'auto',
  variant = 'mm',
  height = 200,
  className,
  style,
}: Props) {
  const scene = computeArt({ seed, motif, space, variant });
  const {
    accentColor, cx, cy,
    showSpace, spaceMode, vpX, vpY, rayTargets, depth, cbF, cbB, cubeEdges, cubeFloor, lnRings, lnSpokes,
  } = scene;

  return (
    <div
      className={`article-art ${className ?? ''}`}
      style={{ height: `${height}px`, ['--art-accent' as string]: accentColor, ...style } as React.CSSProperties}
      aria-hidden="true"
    >
      <svg viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice" role="presentation">
        {showSpace && (
          <g stroke="var(--art-dim)" strokeWidth="1" fill="none" opacity="0.7">
            {spaceMode === 'cube' ? (
              <React.Fragment>
                <rect x={cbF.x0} y={cbF.y0} width={cbF.x1 - cbF.x0} height={cbF.y1 - cbF.y0} />
                <rect x={cbB.x0} y={cbB.y0} width={cbB.x1 - cbB.x0} height={cbB.y1 - cbB.y0} />
                {cubeEdges.map((e, i) => <line key={i} x1={e[0]} y1={e[1]} x2={e[2]} y2={e[3]} />)}
                {cubeFloor.map((l, i) => <line key={i} x1={l.x1} y1={l.y} x2={l.x2} y2={l.y} />)}
              </React.Fragment>
            ) : spaceMode === 'lens' ? (
              <React.Fragment>
                {lnSpokes.map((s, i) => <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />)}
                {lnRings.map((r, i) => <circle key={i} cx={cx} cy={cy} r={r} />)}
                <circle cx={cx} cy={cy} r="22" />
              </React.Fragment>
            ) : (
              <React.Fragment>
                {rayTargets.map((t, i) => <line key={i} x1={vpX} y1={vpY} x2={t.x} y2={t.y} />)}
                {depth.map((d, i) => <rect key={i} x={d.x} y={d.y} width={d.w} height={d.h} rx="6" />)}
              </React.Fragment>
            )}
          </g>
        )}
        <ArtMotifs scene={scene} motif={motif} variant={variant} />
      </svg>
    </div>
  );
}
