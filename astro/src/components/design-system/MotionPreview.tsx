import { useEffect, useRef, useState } from 'react';
import NeonText from '../ui/NeonText';
import KineticWord from '../ui/KineticWord';
import StrikeThrough from '../ui/StrikeThrough';
import StarfieldStage from '../ui/StarfieldStage';
import PurpleSkyTransition from '../ui/PurpleSkyTransition';
import LofiFooterFade from '../ui/LofiFooterFade';
import NebulaStars from '../ui/NebulaStars';
import ZoomSwapDemo from '../ui/ZoomSwapDemo';
import CubeSwapDemo from '../ui/CubeSwapDemo';

/** Legacy effects only run while their library is open and the reader allows motion. */
export default function MotionPreview({ name }: { name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const details = ref.current?.closest('details.ds-legacy');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPlay(details instanceof HTMLDetailsElement && details.open && !motion.matches);
    details?.addEventListener('toggle', update);
    motion.addEventListener('change', update);
    update();
    return () => {
      details?.removeEventListener('toggle', update);
      motion.removeEventListener('change', update);
    };
  }, []);
  return (
    <div ref={ref} className="ds-motion-preview">
      {!play ? (
        <span className="ds-note">
          {name} · Motion preview pauses when the library is closed or reduced motion is enabled.
        </span>
      ) : (
        <>
          {name === 'NeonText' && <NeonText>NEON_TEXT</NeonText>}
          {name === 'KineticWord' && <KineticWord word="design" altWord="build" />}
          {name === 'StrikeThrough' && <StrikeThrough>First draft</StrikeThrough>}
          {name === 'StarfieldStage' && <StarfieldStage />}
          {name === 'PurpleSkyTransition' && <PurpleSkyTransition />}
          {name === 'LofiFooterFade' && <LofiFooterFade />}
          {name === 'NebulaStars' && <NebulaStars />}
          {name === 'ZoomSwapDemo' && <ZoomSwapDemo />}
          {name === 'CubeSwapDemo' && <CubeSwapDemo />}
        </>
      )}
    </div>
  );
}
