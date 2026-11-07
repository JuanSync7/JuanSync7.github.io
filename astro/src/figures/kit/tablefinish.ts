import type { NightKey } from '../../styles/tokens/palette';
import type { FurnitureFinish } from './tableparts';
import type { PropKind } from './tableprops';
import type { ThemeId } from './tablethemes';

export type TableObject = PropKind | 'table' | 'room';
export function tableFinish(
  kind: TableObject,
  solid: number,
  theme: ThemeId,
  detail?: FurnitureFinish,
): {
  tone: NightKey;
  roughness: number;
  metalness: number;
  strength: number;
} {
  let tone: NightKey = 'inkMuted',
    roughness = 0.75,
    metalness = 0,
    strength = 1;
  if (kind === 'room') {
    tone =
      detail === 'wall' ||
      detail === 'brick' ||
      detail === 'wallpaper' ||
      detail === 'walltile' ||
      detail === 'wallband'
        ? 'panel'
        : detail === 'floor'
          ? 'panel2'
          : detail === 'rug'
            ? 'line2'
            : detail === 'stitch'
              ? 'inkFaint'
              : detail === 'shade' ||
                  detail === 'ceramic' ||
                  detail === 'leaf' ||
                  detail === 'upholstery' ||
                  detail === 'window' ||
                  detail === 'glass' ||
                  detail === 'porcelain' ||
                  detail === 'kraft'
                ? 'inkFaint'
                : detail === 'light'
                  ? 'inkStrong'
                  : detail === 'recess'
                    ? 'ground2'
                    : detail === 'metal'
                      ? 'inkFaint'
                      : detail === 'inlay' || detail === 'cabinet' || detail === 'acoustic' || detail === 'book'
                        ? 'line4'
                        : detail === 'tile' || detail === 'floorAlt'
                          ? 'line2'
                          : 'line3';
    roughness = detail === 'metal' ? 0.35 : 0.95;
    metalness = detail === 'metal' ? 0.2 : 0;
    strength =
      detail === 'wall' ||
      detail === 'brick' ||
      detail === 'wallpaper' ||
      detail === 'walltile' ||
      detail === 'wallband'
        ? 0.4
        : detail === 'floor'
          ? 0.2
          : detail === 'tile' || detail === 'floorAlt'
            ? 0.32
            : detail === 'rug'
              ? 0.5
              : detail === 'stitch'
                ? 0.32
                : 1;
  } else if (kind === 'table') {
    tone = 'line4';
    roughness = 0.9;
    if (theme === 'lab' || theme === 'kitchen') {
      tone = 'inkFaint';
      roughness = 0.4;
      metalness = 0.15;
    }
    if (detail === 'top') tone = theme === 'lab' || theme === 'kitchen' ? 'inkSoft' : 'line4';
    if (detail === 'frame') tone = theme === 'lab' ? 'inkMuted' : 'line3';
    if (detail === 'panel') tone = 'inkFaint';
    if (detail === 'inlay' || detail === 'cabinet' || detail === 'acoustic' || detail === 'book') {
      tone = 'inkMuted';
      roughness = 0.9;
    }
    if (detail === 'recess' || detail === 'foot') {
      tone = 'panel2';
      roughness = 1;
      metalness = 0;
    }
    if (detail === 'metal') {
      tone = 'inkSoft';
      roughness = 0.25;
      metalness = 0.5;
    }
    if (detail === 'tile' || detail === 'floorAlt') {
      tone = 'ink2';
      roughness = 0.2;
    }
  } else if (['paper', 'openbook', 'napkins', 'towel', 'plate', 'bowl', 'mug', 'labels', 'sticky'].includes(kind)) {
    tone = 'ink2';
    roughness = ['plate', 'bowl', 'mug'].includes(kind) ? 0.3 : 0.95;
  } else if (
    ['laptop', 'monitor', 'keyboard', 'mouse', 'tower', 'speaker', 'phone', 'drive', 'gamepad', 'usb'].includes(kind)
  ) {
    tone = 'line4';
    roughness = 0.45;
    metalness = 0.12;
    if ((kind === 'monitor' && solid === 4) || (kind === 'laptop' && solid === 34)) tone = 'inkMuted';
    if (kind === 'keyboard' && solid > 1) tone = 'inkSoft';
    if (kind === 'laptop' && solid >= 2 && solid <= 32) tone = 'inkFaint';
  } else if (kind === 'books' || kind === 'notebook' || kind === 'files') {
    tone = solid % 3 === 2 ? 'ink2' : 'line4';
  } else if (kind === 'box') tone = solid === 3 ? 'ink2' : solid === 2 ? 'inkSoft' : 'inkFaint';
  else if (['bottle', 'wineglass', 'tumbler', 'flask', 'beaker', 'petridish', 'tuberack', 'jar'].includes(kind)) {
    tone = 'inkSoft';
    roughness = 0.2;
    metalness = 0.08;
  } else if (['shaker', 'jigger', 'pot', 'microscope', 'spoon', 'utensils', 'tasklamp'].includes(kind)) {
    tone = solid % 2 ? 'inkMuted' : 'line4';
    roughness = 0.35;
    metalness = 0.25;
  }
  return { tone, roughness, metalness, strength };
}
