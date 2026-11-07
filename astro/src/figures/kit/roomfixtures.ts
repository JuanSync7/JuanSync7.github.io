import { TableDraft } from './tableparts';
import { framed, cupboard, shelf, accessory, shelvedAccessory } from './roomdecor';
import type { ThemeId } from './tablethemes';

export function backFeature(p: TableDraft, theme: ThemeId, variant: number, slot: 0 | 1 | 2): string {
  if (theme === 'dining') {
    const x = slot === 0 ? -2.7 : slot === 1 ? 0 : 2.7;
    framed(p, x, 1.85, 1.9, 1.45);
    p.material('inlay', () => p.box(x, 2.05, 0.12, 1.35, 1.02, 0.04, 0.025));
    p.material('frame', () => p.box(x, 1.98, 0.36, 1.6, 0.08, 0.72, 0.015));
    p.material('frame', () => {
      accessory(p, 'plant', x, 2.06, 0.35, 0.68);
    });
    return 'Dining wall reliefs';
  }
  if (theme === 'work' || theme === 'messy') {
    if (slot > 1) return '';
    if (slot === 0) {
      framed(p, -1.8, 1.85, 3.4, 1.55);
      for (let i = 0; i < 6; i++)
        p.material(i % 2 ? 'frame' : 'inlay', () =>
          p.box(-2.8 + (i % 3) * 0.95, 2.03 + Math.floor(i / 3) * 0.61, 0.15, 0.63, 0.46, 0.025, 0.005),
        );
    } else {
      const [top] = shelf(p, 2.6, 1.8, 2.8, 1.6);
      for (const x of [1.7, 2.5, 3.2]) shelvedAccessory(p, theme === 'messy' ? 'box' : 'files', x, top, 0.3, 0.65);
    }
    return theme === 'messy' ? 'Workshop noticeboard and shelving' : 'Office pinboard and reference shelf';
  }
  if (theme === 'computer') {
    const x = slot === 0 ? -3.1 : slot === 1 ? 0 : 3.1;
    p.material('frame', () => {
      p.box(x, 1.8, 0.1, 2.4, 1.7, 0.16, 0.04);
    });
    p.material('acoustic', () => {
      for (let i = 0; i < 6; i++) p.box(x - 1.02 + i * 0.4, 1.87, 0.21, 0.11, 1.55, 0.075, 0.015);
    });
    return 'Acoustic wall slats';
  }
  if (theme === 'storage') {
    if (slot > 1) return '';
    if (slot === 0) cupboard(p, -2.7, 1.85, 3.25, 1.65);
    else {
      const [top] = shelf(p, 1.8, 1.85, 4.1, 1.65);
      for (let i = 0; i < 4; i++) shelvedAccessory(p, 'box', 0.3 + i * 0.95, top, 0.3, 0.6);
    }
    return 'Wall supply cabinets';
  }
  if (theme === 'study' || theme === 'bar') {
    const x = slot === 0 ? -2.8 : slot === 1 ? 0 : 2.8;
    const levels = shelf(p, x, 1.75, 2.55, 1.8);
    for (const top of levels)
      for (let i = 0; i < 3; i++)
        shelvedAccessory(
          p,
          theme === 'bar' ? 'bottle' : 'files',
          x - 0.8 + i * 0.8,
          top,
          0.3,
          theme === 'bar' ? 0.57 : (i + variant) % 2 ? 0.65 : 0.62,
        );
    return theme === 'study' ? 'Built-in book shelves' : 'Bottle display shelves';
  }
  if (theme === 'kitchen') {
    cupboard(p, slot === 0 ? -3.1 : slot === 1 ? 0 : 3.1, 1.85, 2.85, 1.6);
    return 'Kitchen wall cupboards';
  }
  if (slot !== 1) {
    cupboard(p, slot === 0 ? -3.05 : 3.05, 1.85, 2.7, 1.6);
    return 'Lab wall cupboard';
  }
  p.material('frame', () => p.box(0, 2.0, 0.3, 2.3, 1.4, 0.6, 0.035));
  p.material('inlay', () => p.box(0, 2.03, 0.63, 2.1, 0.34, 0.14, 0.025));
  p.material('recess', () => {
    for (let i = 0; i < 8; i++) p.box(-0.8 + i * 0.23, 2.66, 0.615, 0.11, 0.53, 0.025, 0.01);
  });
  return 'Lab wall cabinets and extraction grille';
}

/** Centres and undersides of the back-wall units after their x-only room transform. */
export function shelfLightMounts(theme: ThemeId): { x: number; y: number; z: number }[] {
  if (!['kitchen', 'bar', 'lab'].includes(theme)) return [];
  return [-1, 0, 1].map((slot) => ({
    x: slot * (theme === 'bar' ? 2.8 : theme === 'kitchen' ? 3.1 : 3.05) * 0.72,
    y: theme === 'bar' ? 1.75 : theme === 'lab' && slot === 0 ? 2 : 1.85,
    z: 0.3,
  }));
}
