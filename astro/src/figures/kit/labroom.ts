import { rack, shower, sink } from './labsink';
import { bench, computer, notebook } from './labbench';
import { burner, glassware, instruments, microscope } from './labkit';
import { cage, cart, chair } from './labcart';
import { coat } from './labcoat';
import { curve } from './labculture';
import { fridge, shell } from './labshell';
import type { Sketch } from './monoline';
import { wall } from './labwall';

/** The whole lab room (`lab-room`), in one sketch: the room, the fridge in the corner, the wash
 *  side on the left wall, the bench and everything on it, the wall over it, the trolley with the
 *  mouse enclosure, the chair and the stool, and the growth curve on the monitor. */
export function labRoom(k: Sketch): void {
  shell(k);
  fridge(k);
  sink(k);
  rack(k);
  shower(k);
  coat(k);
  bench(k);
  computer(k);
  notebook(k);
  microscope(k);
  burner(k);
  glassware(k);
  instruments(k);
  wall(k);
  cart(k);
  cage(k);
  chair(k);
  curve(k);
}
