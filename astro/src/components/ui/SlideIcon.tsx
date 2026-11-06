import { SLIDE_ICONS, type SlideIconId } from '../../data/slide-icons';
import { slideDrawing } from '../../figures/kit/slides/models';
import { slidePalette } from '../../figures/kit/slides/svg';
import { SLIDE_DEFAULT, SLIDE_SIZE, SLIDE_WEIGHT, type SlideTone } from '../../figures/kit/slides/types';

interface Props {
  id: SlideIconId;
  tone?: SlideTone;
  accent?: boolean;
  decorative?: boolean;
  className?: string;
}
export default function SlideIcon({ id, tone = SLIDE_DEFAULT.tone, accent = SLIDE_DEFAULT.accent, decorative = false, className }: Props) {
  const palette = slidePalette({ tone, accent });
  const name = SLIDE_ICONS.find((icon) => icon.id === id)?.name ?? id;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${SLIDE_SIZE} ${SLIDE_SIZE}`} fill="none"
      strokeWidth={SLIDE_WEIGHT} strokeLinecap="round" strokeLinejoin="round" className={className}
      role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : name} aria-hidden={decorative || undefined}>
      {!decorative && <title>{name}</title>}
      {slideDrawing(id).map((p, i) => <path key={i} d={p.d} stroke={palette[p.role]} />)}
    </svg>
  );
}
