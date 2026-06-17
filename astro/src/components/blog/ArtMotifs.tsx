import React from 'react';
import type { ArtScene, Motif, Relation } from '../art/artGeometry';

/* The foreground motif layer of the article art — the 14 centred metaphors. Split
   from ArticleArt.tsx (which keeps the wrapper + 3D backdrop) so each file stays under
   the line cap. Pure render over the shared computed scene; geometry lives in the core. */
export default function ArtMotifs({ scene, motif, variant }: { scene: ArtScene; motif: Motif; variant: Relation }) {
  const {
    cx, cy, W, f, brackets,
    lR, lNodes, lPath, lHi,
    fNodes, fToks, fAcc, fX0, fX1, fY, lensR,
    bonds, atoms, atomAcc,
    orbits, sats, oHi,
    stacks, stW, stH, stHi,
    waves, wHi,
    mVerts, mEdges, mAcc,
    tFrame, tWins, tStatus, tHorizon, tFloor,
    dObjs, dObjAcc,
    pxCells, pxSize, pxAcc,
    sX0, sX1, sTop, sBandH, sTopY, sDimY, sDimX0, sGuides, sDots,
    vRings, vArmPaths, vDots,
    hubR, hLeft, hRight, chHubs, chIn, chOut, chMid,
    blId, blGV, blGH, blF, blB, blC, blStripe, blDimR, blDimB,
  } = scene;

  return (
    <>
      {motif === 'loop' && (
        <React.Fragment>
          {[1, 1.38].map((m, i) => <circle key={i} cx={cx} cy={cy} r={lR * m} fill="none" stroke="var(--art-dim)" strokeWidth="1" />)}
          <path d={lPath} fill="none" stroke="var(--art-ink)" strokeOpacity="0.5" strokeWidth="1.5" />
          {lNodes.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="none" stroke="var(--art-ink)" strokeOpacity={i === lHi ? 0.95 : 0.38} strokeWidth="1.5" />)}
          <circle cx={lNodes[lHi].x} cy={lNodes[lHi].y} r={lNodes[lHi].r * 0.42} fill="var(--art-accent)" />
        </React.Fragment>
      )}
      {motif === 'flow' && (
        <React.Fragment>
          <line x1={fX0} y1={fY} x2={fX1} y2={fY} stroke="var(--art-dim)" strokeWidth="1" />
          {fNodes.slice(1).map((n, i) => <path key={i} d={`M${f((fNodes[i].x + n.x) / 2 - 6)} ${f(fY - 6)} L${f((fNodes[i].x + n.x) / 2 + 4)} ${fY} L${f((fNodes[i].x + n.x) / 2 - 6)} ${f(fY + 6)}`} fill="none" stroke="var(--art-ink)" strokeOpacity="0.32" strokeWidth="1.5" />)}
          {fToks.map((t, i) => <circle key={i} cx={t.x} cy={t.y} r={t.r} fill="var(--art-ink)" fillOpacity="0.45" />)}
          {fNodes.map((n, i) => <circle key={i} cx={n.x} cy={n.y} r={i === fAcc ? 24 : 15} fill="none" stroke="var(--art-ink)" strokeOpacity={i === fAcc ? 0.95 : 0.5} strokeWidth="1.5" />)}
          <path d={`M${f(fNodes[fAcc].x - lensR)} ${fY} Q ${fNodes[fAcc].x} ${f(fY - lensR * 0.7)} ${f(fNodes[fAcc].x + lensR)} ${fY}`} fill="none" stroke="var(--art-ink)" strokeWidth="1.5" />
          <path d={`M${f(fNodes[fAcc].x - lensR)} ${fY} Q ${fNodes[fAcc].x} ${f(fY + lensR * 0.7)} ${f(fNodes[fAcc].x + lensR)} ${fY}`} fill="none" stroke="var(--art-ink)" strokeWidth="1.5" />
          <circle cx={fNodes[fAcc].x} cy={fY} r="4" fill="var(--art-accent)" />
          {brackets(fNodes[fAcc].x, fY, 40).map((d, i) => <path key={i} d={d} fill="none" stroke="var(--art-ink)" strokeOpacity="0.85" strokeWidth="1.5" />)}
          {fNodes.map((n, i) => <text key={i} x={n.x} y={fY + 54} textAnchor="middle" fontFamily="var(--mono)" fontSize="22" letterSpacing="1.5" fill={i === fAcc ? 'var(--art-ink)' : 'var(--art-mute)'}>{n.label}</text>)}
        </React.Fragment>
      )}
      {motif === 'lattice' && (
        <React.Fragment>
          <text x={cx} y={cy - 152} textAnchor="middle" fontFamily="var(--mono)" fontSize="21" letterSpacing="2.5" fill="var(--art-mute)">SILICON LATTICE</text>
          {bonds.map((b, i) => <line key={i} x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke="var(--art-ink)" strokeOpacity="0.3" strokeWidth="1.5" />)}
          {atoms.map((a, i) => i === atomAcc
            ? <circle key={i} cx={a.x} cy={a.y} r="8" fill="var(--art-accent)" />
            : <circle key={i} cx={a.x} cy={a.y} r={4 + a.d * 3} fill="none" stroke="var(--art-ink)" strokeOpacity={0.4 + a.d * 0.5} strokeWidth="1.5" />)}
          {brackets(atoms[atomAcc].x, atoms[atomAcc].y, 30).map((d, i) => <path key={i} d={d} fill="none" stroke="var(--art-ink)" strokeOpacity="0.85" strokeWidth="1.5" />)}
          <text x={atoms[atomAcc].x + 18} y={atoms[atomAcc].y + 5} fontFamily="var(--mono)" fontSize="17" fill="var(--art-mute)">Si</text>
        </React.Fragment>
      )}
      {motif === 'orbit' && (
        <React.Fragment>
          {orbits.map((o, i) => <ellipse key={i} cx={cx} cy={cy} rx={o.rx} ry={o.ry} fill="none" stroke="var(--art-dim)" strokeWidth="1" />)}
          {sats.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="none" stroke="var(--art-ink)" strokeOpacity={i === oHi ? 0.95 : 0.45} strokeWidth="1.5" />)}
          <circle cx={cx} cy={cy} r="7" fill="var(--art-accent)" />
        </React.Fragment>
      )}
      {motif === 'stack' && (
        <React.Fragment>
          {stacks.map((s, i) => <rect key={i} x={s.x} y={s.y} width={stW} height={stH} rx="12" fill={i === stHi ? 'var(--art-accent)' : 'none'} fillOpacity={i === stHi ? 0.12 : 0} stroke={i === stHi ? 'var(--art-accent)' : 'var(--art-ink)'} strokeOpacity={i === stHi ? 0.95 : 0.4} strokeWidth="1.5" />)}
        </React.Fragment>
      )}
      {motif === 'wave' && (
        <React.Fragment>
          {waves.map((w, i) => <path key={i} d={w.d} fill="none" stroke="var(--art-ink)" strokeOpacity={i === wHi ? 0.95 : 0.4} strokeWidth="1.5" />)}
          <circle cx={cx} cy={waves[wHi].baseY} r="6" fill="var(--art-accent)" />
        </React.Fragment>
      )}
      {motif === 'mesh' && (
        <React.Fragment>
          {mEdges.map((e, i) => <line key={i} x1={mVerts[e[0]].x} y1={mVerts[e[0]].y} x2={mVerts[e[1]].x} y2={mVerts[e[1]].y} stroke="var(--art-ink)" strokeOpacity="0.4" strokeWidth="1.5" />)}
          {mVerts.map((v, i) => i === mAcc ? <circle key={i} cx={v.x} cy={v.y} r="7" fill="var(--art-accent)" /> : <circle key={i} cx={v.x} cy={v.y} r="5" fill="none" stroke="var(--art-ink)" strokeOpacity="0.7" strokeWidth="1.5" />)}
          {brackets(mVerts[mAcc].x, mVerts[mAcc].y, 26).map((d, i) => <path key={i} d={d} fill="none" stroke="var(--art-ink)" strokeOpacity="0.85" strokeWidth="1.5" />)}
        </React.Fragment>
      )}
      {motif === 'terminal' && (
        <React.Fragment>
          <rect x={tFrame.x} y={tFrame.y} width={tFrame.w} height={tFrame.h} fill="none" stroke="var(--art-dim)" strokeWidth="1.5" />
          {tFloor.map((y, i) => <line key={i} x1={tFrame.x} y1={y} x2={tFrame.x + tFrame.w} y2={y} stroke="var(--art-dim)" strokeWidth="1" />)}
          <line x1={tFrame.x} y1={tFrame.y + tFrame.h} x2={cx} y2={tHorizon} stroke="var(--art-dim)" strokeWidth="1" strokeDasharray="4 7" />
          <line x1={tFrame.x + tFrame.w} y1={tFrame.y + tFrame.h} x2={cx} y2={tHorizon} stroke="var(--art-dim)" strokeWidth="1" strokeDasharray="4 7" />
          {tWins.map((wn, wi) => <g key={wi}>
            <rect x={wn.x} y={wn.y} width={wn.w} height={wn.h} fill="var(--art-bg)" stroke="var(--art-ink)" strokeOpacity="0.55" strokeWidth="1.5" />
            <rect x={wn.x} y={wn.y - 23} width={wn.tab.length * 8.6 + 16} height="23" fill="var(--art-mute)" />
            <text x={wn.x + 8} y={wn.y - 7} fontFamily="var(--mono)" fontSize="13" fill="var(--art-bg)">{wn.tab}</text>
            {wn.body.map((lnt, k) => <text key={k} x={wn.x + 14} y={wn.y + 26 + k * 19} fontFamily="var(--mono)" fontSize="12.5" fill={lnt.startsWith('[[') ? 'var(--art-accent)' : 'var(--art-mute)'}>{lnt}</text>)}
          </g>)}
          <rect x={tStatus.x} y={tStatus.y} width={tStatus.w} height={tStatus.h} fill="var(--art-bg)" stroke="var(--art-ink)" strokeWidth="1.5" />
          <rect x={tStatus.x} y={tStatus.y - 23} width="70" height="23" fill="var(--art-accent)" />
          <text x={tStatus.x + 8} y={tStatus.y - 7} fontFamily="var(--mono)" fontSize="13" fill="var(--art-bg)">STATUS</text>
          {[0, 1, 2].map((k) => <circle key={k} cx={tStatus.x + tStatus.w / 2} cy={tStatus.y + 42 + k * 38} r="11" fill={k === 0 ? 'var(--art-accent)' : 'none'} stroke={k === 0 ? 'var(--art-accent)' : 'var(--art-ink)'} strokeOpacity={k === 0 ? 1 : 0.5} strokeWidth="1.5" />)}
        </React.Fragment>
      )}
      {motif === 'detect' && (
        <React.Fragment>
          {dObjs.map((o, i) => <g key={i}>
            <rect x={o.x} y={o.y} width={o.w} height={o.h} rx="3" fill="none" stroke={i === dObjAcc ? 'var(--art-accent)' : 'var(--art-ink)'} strokeOpacity={i === dObjAcc ? 1 : 0.5} strokeWidth="1.5" strokeDasharray={i === dObjAcc ? 'none' : '5 4'} />
            <text x={o.x + 6} y={o.y - 9} fontFamily="var(--mono)" fontSize="16" fill="var(--art-mute)">{o.tag}</text>
            {o.shape === 'circle' && <circle cx={o.x + o.w / 2} cy={o.y + o.h / 2} r={Math.min(o.w, o.h) / 3.2} fill="none" stroke="var(--art-ink)" strokeOpacity="0.75" strokeWidth="1.5" />}
            {o.shape === 'tri' && <path d={`M${f(o.x + o.w / 2)} ${f(o.y + o.h * 0.28)} L${f(o.x + o.w * 0.76)} ${f(o.y + o.h * 0.72)} L${f(o.x + o.w * 0.24)} ${f(o.y + o.h * 0.72)} Z`} fill="none" stroke="var(--art-ink)" strokeOpacity="0.75" strokeWidth="1.5" />}
            {o.shape === 'diamond' && <path d={`M${f(o.x + o.w / 2)} ${f(o.y + o.h * 0.26)} L${f(o.x + o.w * 0.74)} ${f(o.y + o.h / 2)} L${f(o.x + o.w / 2)} ${f(o.y + o.h * 0.74)} L${f(o.x + o.w * 0.26)} ${f(o.y + o.h / 2)} Z`} fill="none" stroke="var(--art-ink)" strokeOpacity="0.75" strokeWidth="1.5" />}
          </g>)}
        </React.Fragment>
      )}
      {motif === 'pixel' && (
        <React.Fragment>
          {pxCells.map((p, i) => <rect key={i} x={p.x} y={p.y} width={pxSize - 4} height={pxSize - 4} rx="2" fill={i === pxAcc ? 'var(--art-accent)' : 'var(--art-ink)'} fillOpacity={i === pxAcc ? 1 : 0.55} />)}
        </React.Fragment>
      )}
      {motif === 'scatter' && (
        <React.Fragment>
          <line x1={sX0} y1={sTopY} x2={sX1} y2={sTopY} stroke="var(--art-dim)" strokeWidth="1" strokeDasharray="2 7" />
          <line x1={sX0} y1={sTopY} x2={sX0} y2={sTopY + 13} stroke="var(--art-dim)" strokeWidth="1" />
          <line x1={sX1} y1={sTopY} x2={sX1} y2={sTopY + 13} stroke="var(--art-dim)" strokeWidth="1" />
          {sGuides.map((g, i) => <line key={i} x1={sX0 + g * (sX1 - sX0)} y1={sTop - 8} x2={sX0 + g * (sX1 - sX0)} y2={sTop + sBandH + 8} stroke="var(--art-dim)" strokeWidth="1" strokeOpacity="0.55" />)}
          {sDots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r="2.7" fill="var(--art-ink)" fillOpacity="0.8" />)}
          <line x1={sDimX0} y1={sDimY} x2={sX1} y2={sDimY} stroke="var(--art-accent)" strokeWidth="1.5" />
          <path d={`M${f(sDimX0 + 11)} ${f(sDimY - 6)} L${f(sDimX0)} ${f(sDimY)} L${f(sDimX0 + 11)} ${f(sDimY + 6)}`} fill="none" stroke="var(--art-accent)" strokeWidth="1.5" />
          <path d={`M${f(sX1 - 11)} ${f(sDimY - 6)} L${f(sX1)} ${f(sDimY)} L${f(sX1 - 11)} ${f(sDimY + 6)}`} fill="none" stroke="var(--art-accent)" strokeWidth="1.5" />
          <text x={(sDimX0 + sX1) / 2} y={sDimY + 22} textAnchor="middle" fontFamily="var(--mono)" fontSize="20" letterSpacing="2" fill="var(--art-mute)">RESOLVED</text>
        </React.Fragment>
      )}
      {motif === 'vortex' && (
        <React.Fragment>
          {vRings.map((r, i) => <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="var(--art-dim)" strokeWidth="1" />)}
          {vArmPaths.map((d, i) => <path key={i} d={d} fill="none" stroke="var(--art-ink)" strokeOpacity="0.5" strokeWidth="1.5" />)}
          {vDots.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="var(--art-ink)" fillOpacity="0.7" />)}
          <circle cx={cx} cy={cy} r="9" fill="var(--art-accent)" />
          {brackets(cx, cy, 30).map((d, i) => <path key={i} d={d} fill="none" stroke="var(--art-ink)" strokeOpacity="0.85" strokeWidth="1.5" />)}
        </React.Fragment>
      )}
      {motif === 'hub' && (
        <React.Fragment>
          {variant === 'chain' ? (
            <React.Fragment>
              {[...chIn, ...chOut].map((l, i) => <path key={i} d={l.d} fill="none" stroke="var(--art-ink)" strokeOpacity="0.5" strokeWidth="1.5" />)}
              {chMid.map((d, i) => <path key={i} d={d} fill="none" stroke="var(--art-ink)" strokeOpacity="0.55" strokeWidth="1.5" />)}
              {chIn.map((l, i) => <path key={i} d={`M${f(159)} ${f(l.ay - 5)} L${f(150)} ${f(l.ay)} L${f(159)} ${f(l.ay + 5)}`} fill="none" stroke="var(--art-ink)" strokeOpacity="0.6" strokeWidth="1.5" />)}
              {chOut.map((l, i) => <path key={i} d={`M${f(W - 159)} ${f(l.ay - 5)} L${f(W - 150)} ${f(l.ay)} L${f(W - 159)} ${f(l.ay + 5)}`} fill="none" stroke="var(--art-ink)" strokeOpacity="0.6" strokeWidth="1.5" />)}
              {chHubs.map((hx, i) => <circle key={i} cx={hx} cy={cy} r={hubR} fill={i === 1 ? 'var(--art-accent)' : 'var(--art-bg)'} stroke={i === 1 ? 'var(--art-accent)' : 'var(--art-ink)'} strokeOpacity={i === 1 ? 1 : 0.7} strokeWidth="1.5" />)}
              {brackets(chHubs[1], cy, 26).map((d, i) => <path key={i} d={d} fill="none" stroke="var(--art-ink)" strokeOpacity="0.85" strokeWidth="1.5" />)}
            </React.Fragment>
          ) : (
            <React.Fragment>
              {[...hLeft, ...hRight].map((l, i) => <path key={i} d={l.d} fill="none" stroke="var(--art-ink)" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray={l.dash ? '5 5' : 'none'} />)}
              {[...hLeft, ...hRight].map((l, i) => <path key={`a${i}`} d={`M${f(l.ax + l.dir * 9)} ${f(l.ay - 5)} L${f(l.ax)} ${f(l.ay)} L${f(l.ax + l.dir * 9)} ${f(l.ay + 5)}`} fill="none" stroke="var(--art-ink)" strokeOpacity="0.6" strokeWidth="1.5" />)}
              <circle cx={cx} cy={cy} r={hubR} fill="var(--art-accent)" />
              <circle cx={cx} cy={cy} r={hubR * 0.45} fill="var(--art-bg)" />
              {brackets(cx, cy, 28).map((d, i) => <path key={i} d={d} fill="none" stroke="var(--art-ink)" strokeOpacity="0.85" strokeWidth="1.5" />)}
            </React.Fragment>
          )}
        </React.Fragment>
      )}
      {motif === 'blueprint' && (
        <React.Fragment>
          {blGV.map((x, i) => <line key={i} x1={x} y1="78" x2={x} y2="442" stroke="var(--art-dim)" strokeWidth="1" strokeDasharray="2 8" />)}
          {blGH.map((y, i) => <line key={i} x1="40" y1={y} x2={W - 40} y2={y} stroke="var(--art-dim)" strokeWidth="1" strokeDasharray="2 8" />)}
          <rect x={blF.x} y={blF.y} width={blF.s} height={blF.s} rx={blF.r} fill="none" stroke="var(--art-ink)" strokeOpacity="0.45" strokeWidth="1.5" />
          <rect x={blB.x} y={blB.y} width={blB.s} height={blB.s} fill="none" stroke="var(--art-ink)" strokeOpacity="0.3" strokeWidth="1" />
          <defs><clipPath id={blId}><circle cx={blC.x} cy={blC.y} r={blC.r} /></clipPath></defs>
          <circle cx={blC.x} cy={blC.y} r={blC.r} fill="var(--art-accent)" />
          <g clipPath={`url(#${blId})`}>
            {blStripe.map((s, i) => <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="var(--art-bg)" strokeWidth="14" />)}
          </g>
          <line x1={blDimR} y1={blB.y} x2={blDimR} y2={blB.y + blB.s} stroke="var(--art-ink)" strokeOpacity="0.6" strokeWidth="1.5" />
          <path d={`M${f(blDimR - 5)} ${f(blB.y + 9)} L${f(blDimR)} ${f(blB.y)} L${f(blDimR + 5)} ${f(blB.y + 9)}`} fill="none" stroke="var(--art-ink)" strokeOpacity="0.6" strokeWidth="1.5" />
          <path d={`M${f(blDimR - 5)} ${f(blB.y + blB.s - 9)} L${f(blDimR)} ${f(blB.y + blB.s)} L${f(blDimR + 5)} ${f(blB.y + blB.s - 9)}`} fill="none" stroke="var(--art-ink)" strokeOpacity="0.6" strokeWidth="1.5" />
          <text x={blDimR + 12} y={cy + 5} fontFamily="var(--mono)" fontSize="18" fill="var(--art-mute)">90px</text>
          <line x1={blB.x} y1={blDimB} x2={blB.x + blB.s} y2={blDimB} stroke="var(--art-ink)" strokeOpacity="0.6" strokeWidth="1.5" />
          <path d={`M${f(blB.x + 9)} ${f(blDimB - 5)} L${f(blB.x)} ${f(blDimB)} L${f(blB.x + 9)} ${f(blDimB + 5)}`} fill="none" stroke="var(--art-ink)" strokeOpacity="0.6" strokeWidth="1.5" />
          <path d={`M${f(blB.x + blB.s - 9)} ${f(blDimB - 5)} L${f(blB.x + blB.s)} ${f(blDimB)} L${f(blB.x + blB.s - 9)} ${f(blDimB + 5)}`} fill="none" stroke="var(--art-ink)" strokeOpacity="0.6" strokeWidth="1.5" />
          <text x={cx} y={blDimB + 22} textAnchor="middle" fontFamily="var(--mono)" fontSize="18" fill="var(--art-mute)">120px</text>
          <rect x={blF.x - 2} y={blF.y - 2} width="18" height="18" rx="5" fill="none" stroke="var(--art-ink)" strokeOpacity="0.55" strokeWidth="1.5" />
          <line x1={blF.x - 2} y1={blF.y + 16} x2={blF.x + 16} y2={blF.y - 2} stroke="var(--art-ink)" strokeOpacity="0.55" strokeWidth="1" />
          <text x={blF.x - 14} y={blF.y + 11} textAnchor="end" fontFamily="var(--mono)" fontSize="16" fill="var(--art-mute)">23.33%</text>
          <rect x={blF.x - 150} y={cy - 12} width="22" height="22" rx="6" fill="none" stroke="var(--art-ink)" strokeOpacity="0.55" strokeWidth="1.5" />
          <line x1={blF.x - 145} y1={cy + 5} x2={blF.x - 133} y2={cy - 7} stroke="var(--art-ink)" strokeOpacity="0.7" strokeWidth="1.5" />
          <text x={blF.x - 120} y={cy + 4} fontFamily="var(--mono)" fontSize="16" fill="var(--art-mute)">45°</text>
          <text x={blF.x + blF.s + 70} y={blF.y + 8} fontFamily="var(--mono)" fontSize="16" letterSpacing="1" fill="var(--art-mute)">SCALE 1:1</text>
          <text x={blF.x + blF.s + 70} y={blF.y + 30} fontFamily="var(--mono)" fontSize="16" letterSpacing="1" fill="var(--art-mute)">RGB 255, 255, 255</text>
        </React.Fragment>
      )}
    </>
  );
}
