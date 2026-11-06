import type { SlideIconId } from '../../../data/slide-icons';
import type { SlideDrawing } from './types';
import { compute } from './compute';
import { systems } from './systems';
import { data } from './data';
import { research } from './research';

const drawings: Record<SlideIconId, SlideDrawing> = { ...compute, ...systems, ...data, ...research };
export const slideDrawing = (id: SlideIconId): SlideDrawing => drawings[id];
