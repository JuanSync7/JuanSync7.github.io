/** What a figure uses of the drawing kernel (`kit/drawing/`, synced from the experience vault):
 *  figures import only from the kit's own files, so they reach the kernel through this one. The
 *  engineering drawing (`draftScene`) and the hidden-line scene pen (`Sketch`, `monodraw`). */
export { AREA, draftScene, solidLines, type Layout } from './drawing/scene';
export { Sketch, type V3 } from './drawing/monoline';
export { monodraw, reveal, type Drawing } from './drawing/monodraw';
