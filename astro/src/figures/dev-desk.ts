import { Box3, Color, Group, Matrix4, Mesh, OrthographicCamera, Vector3, type MeshStandardMaterial } from 'three';
import { defineThreeFigure } from './defineThree';
import { isometric } from './kit/camera';
import { box, clear } from './kit/draw';
import { deskHexOf, ink } from './kit/ink';
import { mergeStatic, screenOn, signalNear, studio, type Screen } from './kit/studio';
import { chair } from './kit/chair';
import { deskSet, kit, monitor } from './kit/desk';
import { gamingPc, type GamingPc } from './kit/gamingpc';
import { keyboard, type Keyboard } from './kit/keyboard';
import { deskProps } from './kit/deskprops';
import { racks, type Racks } from './kit/rack';
import { drawChat, drawCode, SCREEN_LOOP } from './kit/screens';

/** Building with an AI, as a desk: a prompt is typed on the keyboard and appears in a chat app on
 *  the landscape monitor; a packet runs down the cable from the tower to the rack of servers (the
 *  models), a server lights, the packet returns, the reply streams in, and code arrives line by
 *  line on the portrait monitor. Real materials and shadows; true colours in both themes, the
 *  signal read from the page. Under reduced motion it rests mid-reply. */

const STILL_AT = 8.5;
const REST = 1.2;
const OPEN_AT = 10.1;

interface State {
  root: Group;
  chat: Screen;
  code: Screen;
  board: Keyboard;
  pc: GamingPc;
  rack: Racks;
  frame: number;
  signal: string;
  read: () => string;
  accent: MeshStandardMaterial;
  /** Corners of every part's bounding box, for a tight camera fit. */
  pts: Vector3[];
  /** The size the camera was last fitted to. */
  fit: string;
}

const tmp = new Matrix4();
const dip = new Matrix4();
const keyGrey = new Color(deskHexOf('key'));
const modGrey = new Color(deskHexOf('keyMod'));
const ledGrey = new Color(deskHexOf('led'));
const ledDim = new Color(deskHexOf('unit'));
const hot = new Color();

function cornersOf(root: Group): Vector3[] {
  root.updateMatrixWorld(true);
  const out: Vector3[] = [];
  const b = new Box3();
  root.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    b.setFromObject(o);
    for (let i = 0; i < 8; i++)
      out.push(new Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z));
  });
  return out;
}
const corner = new Vector3();

export default defineThreeFigure<State>({
  id: 'dev-desk',
  title: 'Building with an AI',
  alt: 'An isometric desk with a landscape monitor showing a chat with an AI, a portrait monitor filling with code, a keyboard and a tower cabled to a rack of servers.',
  idea: 'A prompt typed at a desk travels to the models in the rack and comes back as a reply and as code: building a system with an AI.',
  motion: 'ambient',
  answers: false,
  group: 'feature',
  seed: 5209,
  aspect: 1.1,
  build: ({ scene, renderer, onDispose }) => {
    const owned: { dispose(): void }[] = [];
    onDispose(() => owned.forEach((o) => o.dispose()));
    studio(scene, renderer, owned, [0.7, 0, -0.4]);
    const root = new Group();
    scene.add(root);
    const k = kit(root, owned);
    deskSet(k);
    const board = keyboard(k, root, owned);
    const pc = gamingPc(k, root, [0.98, 0, 0.04], owned);
    chair(k, root, [-1.0, 0, 0.42], -1.2, owned);
    const wide = monitor(k, root, 0.78, 0.33, -0.25, -0.19, (7 * Math.PI) / 180, true);
    const tall = monitor(k, root, 0.3, 0.53, 0.4, -0.16, (-12 * Math.PI) / 180);
    deskProps(k, root, k.accent, owned);
    const r = racks(k, root, owned);
    const pts = cornersOf(root);
    const chat = screenOn(wide.screen, 760, 322, owned);
    const code = screenOn(tall.screen, 300, 530, owned);
    mergeStatic(root, owned);
    const read = (): string => signalNear(renderer);
    return {
      root,
      chat,
      code,
      board,
      rack: r,
      pc,
      frame: -1,
      signal: read(),
      read,
      pts,
      fit: '',
      accent: k.accent,
    };
  },
  update: (f) => {
    const cam = f.selectCamera('orthographic');
    if (!(cam instanceof OrthographicCamera)) return;
    const s = f.state;
    // The loop opens on a finished reply, which clears for the next prompt: the scene is busy the
    // moment it is seen.
    const u = f.still && f.t === REST ? STILL_AT : (f.t + OPEN_AT) % SCREEN_LOOP;
    // Camera from the front left, low over the desk, fitted to the scene; only on a resize.
    const size = `${f.w}x${f.h}`;
    if (size !== s.fit) {
      s.fit = size;
      const target = new Vector3(0.4, 0.55, -0.3);
      const az = (-38 * Math.PI) / 180;
      const el = (30 * Math.PI) / 180;
      cam.position.set(
        target.x + Math.sin(az) * Math.cos(el) * 8,
        target.y + Math.sin(el) * 8,
        target.z + Math.cos(az) * Math.cos(el) * 8,
      );
      cam.lookAt(target);
      cam.near = 0.1;
      cam.far = 30;
      cam.updateMatrixWorld();
      let x0 = Infinity;
      let x1 = -Infinity;
      let y0 = Infinity;
      let y1 = -Infinity;
      for (const p of s.pts) {
        corner.copy(p).applyMatrix4(cam.matrixWorldInverse);
        x0 = Math.min(x0, corner.x);
        x1 = Math.max(x1, corner.x);
        y0 = Math.min(y0, corner.y);
        y1 = Math.max(y1, corner.y);
      }
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;
      const half = Math.max((x1 - x0) / 2, ((y1 - y0) / 2) * (f.w / f.h)) * 1.02;
      cam.left = cx - half;
      cam.right = cx + half;
      cam.top = cy + (half * f.h) / f.w;
      cam.bottom = cy - (half * f.h) / f.w;
      cam.updateProjectionMatrix();
    }

    // The page's signal, re-read now and then so a theme switch reaches the scene.
    const frame = Math.floor(u * 10);
    if (frame !== s.frame) {
      if (frame % 10 === 0) s.signal = s.read();
      s.frame = frame;
      drawChat(s.chat.ctx, s.chat.w, s.chat.h, u, s.signal);
      drawCode(s.code.ctx, s.code.w, s.code.h, u, s.signal);
      s.chat.tex.needsUpdate = true;
      s.code.tex.needsUpdate = true;
    }
    // Keys dip while the prompt is typed.
    const typing = u > 0.8 && u < 3.0;
    const hit = Math.floor(u * 11);
    s.board.rest.forEach((m, i) => {
      const down = typing && !s.board.mod[i] && (i * 7 + hit * 13) % 23 === 0 ? -0.003 : 0;
      s.board.keys.setMatrixAt(i, tmp.copy(m).multiply(dip.makeTranslation(0, down, 0)));
    });
    s.board.keys.instanceMatrix.needsUpdate = true;
    // Escape and Enter in the signal.
    hot.set(s.signal);
    s.board.rest.forEach((_, i) =>
      s.board.keys.setColorAt(i, s.board.lit.includes(i) ? hot : s.board.mod[i] ? modGrey : keyGrey),
    );
    // Fans turn, the radiator's a little faster.
    s.pc.rotors.forEach((r, i) => (r.rotation.z = (f.still ? 0.3 : f.t) * (i < 3 ? 9 : 6) + i));
    if (s.board.keys.instanceColor) s.board.keys.instanceColor.needsUpdate = true;
    // The packet: to the rack and back.
    const r = s.rack;
    r.signal.color.set(s.signal);
    s.accent.color.set(s.signal);
    const go = u >= 3.4 && u < 5.0 ? (u - 3.4) / 1.6 : u >= 5.0 && u < 5.8 ? 1 - (u - 5.0) / 0.8 : -1;
    r.packet.visible = go >= 0;
    if (go >= 0) r.packet.position.copy(r.cable.getPointAt(Math.min(1, Math.max(0, go))));
    const busy = u > 4.2 && u < 9.2;
    r.leds.forEach((leds, c) => {
      for (let i = 0; i < r.ledCount; i++) {
        const active = c === r.active[0] && i === r.active[1];
        // Lights flicker as servers work: fast while a request runs, slow while idle.
        const on = (i * 5 + c * 3 + Math.floor(u * (busy ? 6 : 1.5))) % (busy ? 4 : 3) !== 0;
        leds.setColorAt(i, active && busy ? hot : on ? ledGrey : ledDim);
      }
      if (leds.instanceColor) leds.instanceColor.needsUpdate = true;
    });
  },
  fallback: ({ ctx, w, h }) => {
    clear(ctx, w, h);
    const cam = isometric(w * 0.45, h * 0.7, Math.min(w, h) * 0.12);
    const tones = {
      top: ink.soft(0.9),
      left: ink.line(0.5),
      right: ink.line(0.7),
      edge: ink.line(0.9),
      crease: ink.faint(0.8),
    };
    box(ctx, cam, -1.4, -0.7, 1.4, 0.7, 1.4, 1.5, tones);
    box(ctx, cam, -1, -0.5, 0.2, -0.4, 1.5, 2.3, { ...tones, right: ink.signal(0.8) });
    box(ctx, cam, 0.5, -0.5, 1.1, -0.4, 1.5, 2.6, tones);
    box(ctx, cam, 2.2, -2.8, 3.4, -1.2, 0, 2.8, tones);
  },
});
