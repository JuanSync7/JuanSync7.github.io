import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import { hexOf } from './ink';
import type { NightKey } from '../../styles/tokens/palette';
import type { FurnitureFinish, PropModel } from './tableparts';
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
      detail === 'wall'
        ? 'panel'
        : detail === 'floor'
          ? 'panel2'
          : detail === 'recess'
            ? 'ground2'
            : detail === 'metal'
              ? 'inkFaint'
              : detail === 'inlay'
                ? 'line4'
                : detail === 'tile'
                  ? 'line2'
                  : 'line3';
    roughness = detail === 'metal' ? 0.35 : 0.95;
    metalness = detail === 'metal' ? 0.2 : 0;
    strength = detail === 'wall' ? 0.4 : detail === 'floor' ? 0.22 : detail === 'tile' ? 0.5 : 1;
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
    if (detail === 'inlay') {
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
    if (detail === 'tile') {
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

/** Only drawn markings survive. Polygon seams and hidden wireframe edges are omitted. */
export function solidMesh(model: PropModel, kind: TableObject, theme: ThemeId): Group {
  const group = new Group(),
    buckets = new Map<
      string,
      { tone: NightKey; positions: number[]; roughness: number; metalness: number; strength: number }
    >();
  const lines: number[] = [];
  for (const surface of model.surfaces) {
    const { points, face, solid } = surface,
      first = points[0];
    if (!face) {
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1],
          b = points[i];
        if (a && b) lines.push(...a, ...b);
      }
      continue;
    }
    const finish = tableFinish(kind, solid, theme, surface.finish);
    const key = `${finish.tone}:${finish.roughness}:${finish.metalness}:${finish.strength}`;
    const bucket = buckets.get(key) ?? {
      tone: finish.tone,
      positions: [],
      roughness: finish.roughness,
      metalness: finish.metalness,
      strength: finish.strength,
    };
    buckets.set(key, bucket);
    if (first)
      for (let i = 1; i + 1 < points.length; i++) {
        const a = points[i],
          b = points[i + 1];
        if (a && b) bucket.positions.push(...first, ...a, ...b);
      }
  }
  for (const { tone, positions, roughness, metalness, strength } of buckets.values()) {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    group.add(
      new Mesh(
        geometry,
        new MeshStandardMaterial({
          color: new Color(hexOf(tone)).multiplyScalar(strength),
          roughness,
          metalness,
          side: DoubleSide,
          flatShading: true,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        }),
      ),
    );
  }
  if (lines.length) {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(lines, 3));
    const dark = ['paper', 'openbook', 'notebook', 'napkins', 'towel', 'sticky', 'labels'].includes(kind);
    group.add(
      new LineSegments(
        geometry,
        new LineBasicMaterial({
          color: hexOf(dark ? 'line4' : 'inkSoft'),
          transparent: true,
          opacity: kind === 'table' ? 0.22 : 0.5,
        }),
      ),
    );
  }
  return group;
}
