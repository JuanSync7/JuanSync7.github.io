import { Color, Group, Mesh, MeshStandardMaterial, PlaneGeometry, type BufferGeometry, type Material } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { deskHexOf } from './ink';
import type { DeskTone } from '../../styles/tokens/palette';

/** A modern desk setup in metres (y up, the sitter at +z): a thin top on two sled legs, a 27"
 *  landscape monitor with a screen bar and a 24" portrait monitor on real stands, a mat and a
 *  mouse. Every part casts and takes shadow. The screens are planes left for the scene to
 *  texture. */

export interface Kit {
  /** The signal material, shared by every accent, recoloured when the page's signal changes. */
  accent: MeshStandardMaterial;
  add(g: BufferGeometry, mat: Material, at: [number, number, number], parent?: Group): Mesh;
  mat(tone: DeskTone, rough: number, metal: number): MeshStandardMaterial;
  rounded(w: number, h: number, d: number, r?: number): BufferGeometry;
}

export function kit(root: Group, owned: { dispose(): void }[]): Kit {
  const mats = new Map<string, MeshStandardMaterial>();
  const accent = new MeshStandardMaterial({ roughness: 0.45, metalness: 0.1, envMapIntensity: 0.55 });
  owned.push(accent);
  return {
    accent,
    add(g, mat, at, parent = root) {
      const m = new Mesh(g, mat);
      m.position.set(...at);
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    },
    mat(tone, rough, metal) {
      const k = `${tone}|${rough}|${metal}`;
      let m = mats.get(k);
      if (!m) {
        m = new MeshStandardMaterial({
          color: new Color(deskHexOf(tone)),
          roughness: rough,
          metalness: metal,
          envMapIntensity: 0.55,
        });
        mats.set(k, m);
        owned.push(m);
      }
      return m;
    },
    rounded(w, h, d, r = 0.006) {
      const g = new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2));
      owned.push(g);
      return g;
    },
  };
}

export const DESK = { w: 1.4, d: 0.7, top: 0.73 };

export interface Monitor {
  screen: Mesh;
}

/** A monitor on a stand: base plate, neck, hinge block, then the panel with its bezel and chin;
 *  the screen plane sits 1.5 mm proud of the panel so it never fights it. */
export function monitor(
  k: Kit,
  root: Group,
  w: number,
  h: number,
  x: number,
  z: number,
  yaw: number,
  lightBar = false,
): Monitor {
  const g = new Group();
  g.position.set(x, DESK.top, z);
  g.rotation.y = yaw;
  root.add(g);
  const metal = k.mat('metal', 0.35, 0.8);
  k.add(k.rounded(0.24, 0.012, 0.17, 0.005), metal, [0, 0.006, 0.01], g);
  const neckH = 0.1 + h / 2;
  k.add(k.rounded(0.045, neckH, 0.022, 0.006), metal, [0, neckH / 2, -0.05], g);
  k.add(k.rounded(0.08, 0.05, 0.03, 0.006), metal, [0, neckH, -0.035], g);
  const panelY = neckH + 0.01;
  k.add(k.rounded(w + 0.018, h + 0.032, 0.022, 0.006), k.mat('shell', 0.55, 0.2), [0, panelY, -0.01], g);
  const geo = new PlaneGeometry(w, h);
  const screen = new Mesh(geo, new MeshStandardMaterial({ color: 0xffffff }));
  screen.position.set(0, panelY + 0.008, 0.0015);
  g.add(screen);
  if (lightBar) {
    // A screen bar resting on the panel's top edge: the bar leans over the front, its counterweight
    // clamp hangs down the back, and its lit underside is the accent.
    const top = panelY + (h + 0.032) / 2;
    k.add(k.rounded(w * 0.78, 0.022, 0.026, 0.008), k.mat('shell', 0.4, 0.4), [0, top + 0.016, 0.012], g);
    k.add(k.rounded(w * 0.7, 0.003, 0.01, 0.001), k.accent, [0, top + 0.004, 0.02], g);
    k.add(k.rounded(0.05, 0.016, 0.04, 0.004), k.mat('shell', 0.4, 0.4), [0, top + 0.002, -0.01], g);
    k.add(k.rounded(0.04, 0.05, 0.014, 0.004), k.mat('shell', 0.4, 0.4), [0, top - 0.02, -0.03], g);
  }
  return { screen };
}

/** Desk, legs, a mat and a mouse. The keyboard, PC and chair have kits of their own. */
export function deskSet(k: Kit): void {
  const top = k.mat('deskTop', 0.6, 0);
  k.add(k.rounded(DESK.w, 0.03, DESK.d, 0.008), top, [0, DESK.top - 0.015, 0]);
  k.add(k.rounded(DESK.w - 0.02, 0.008, DESK.d - 0.02, 0.003), k.mat('deskEdge', 0.6, 0), [0, DESK.top - 0.034, 0]);
  const metal = k.mat('metal', 0.35, 0.8);
  for (const x of [-0.62, 0.62]) {
    k.add(k.rounded(0.05, 0.03, DESK.d - 0.06, 0.008), metal, [x, 0.015, 0]);
    k.add(k.rounded(0.05, DESK.top - 0.05, 0.05, 0.008), metal, [x, (DESK.top - 0.05) / 2 + 0.02, -0.05]);
    k.add(k.rounded(0.05, 0.025, DESK.d - 0.12, 0.008), metal, [x, DESK.top - 0.045, 0]);
  }
  k.add(k.rounded(0.82, 0.003, 0.3, 0.002), k.mat('mat', 0.95, 0), [-0.06, DESK.top + 0.0015, 0.16]);
  k.add(k.rounded(0.062, 0.03, 0.11, 0.022), k.mat('keyBase', 0.45, 0.3), [0.22, DESK.top + 0.018, 0.17]);
  k.add(k.rounded(0.004, 0.002, 0.03, 0.001), k.accent, [0.22, DESK.top + 0.033, 0.14]);
}
