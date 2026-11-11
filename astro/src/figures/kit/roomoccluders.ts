import { BackSide, DoubleSide, Mesh, MeshBasicMaterial, type Group } from 'three';
import type { SceneModel } from './roomscene';

/** A camera cutaway reveals the interior without removing the room's light blockers. */
export function roomOccluders(source: SceneModel, model: Group, root: Group): void {
  if (!source.side || source.side === 'floor' || source.interactive || source.cutaway) return;
  model.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    o.castShadow = false;
    const material = new MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: DoubleSide });
    material.shadowSide = BackSide;
    const blocker = new Mesh(o.geometry.clone(), material);
    blocker.castShadow = true;
    blocker.userData.roomOccluder = source.label;
    root.add(blocker);
  });
}
