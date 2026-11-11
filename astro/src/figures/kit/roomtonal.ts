import { Vector3, Vector4, type MeshStandardMaterial } from 'three';
import type { Bounds } from './tableparts';
import type { RoomPlan } from './roomplan';

const DEPTH = new WeakMap<MeshStandardMaterial, { value: number }>();
/** World-anchored tonal ramps and analytic wall/floor contact shading; no screen-space outline. */
export function roomTonalDepth(material: MeshStandardMaterial, bounds: Bounds, r: RoomPlan): void {
  const amount = { value: 1 },
    previous = material.onBeforeCompile,
    key = material.customProgramCacheKey(),
    floor = bounds.hi[1] - bounds.lo[1] < 0.25 && bounds.lo[1] <= r.floor + 0.05;
  DEPTH.set(material, amount);
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    Object.assign(shader.uniforms, {
      uRoomDepth: amount,
      uRoomRamp: { value: new Vector4(bounds.lo[1], bounds.hi[1], bounds.lo[2], bounds.hi[2]) },
      uRoomFrame: { value: new Vector3(r.half, r.floor, r.back) },
      uRoomFloorLayer: { value: floor ? 1 : 0 },
    });
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uRoomDepth;
        uniform vec4 uRoomRamp;
        uniform vec3 uRoomFrame;
        uniform float uRoomFloorLayer;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float roomLift=clamp((vRoomSurface.y-uRoomRamp.x)/max(uRoomRamp.y-uRoomRamp.x,0.01),0.0,1.0);
        float roomFront=clamp((vRoomSurface.z-uRoomRamp.z)/max(uRoomRamp.w-uRoomRamp.z,0.01),0.0,1.0);
        float roomRamp=mix(mix(0.72,1.12,roomLift),mix(0.86,1.08,roomFront),uRoomFloorLayer);
        diffuseColor.rgb*=mix(1.0,roomRamp,uRoomDepth);`,
      )
      .replace(
        '#include <aomap_fragment>',
        `#include <aomap_fragment>
        vec3 roomNormal=inverseTransformDirection(normal,viewMatrix);
        float roomHeight=max(0.0,vRoomSurface.y-uRoomFrame.y);
        float roomSide=max(0.0,uRoomFrame.x-abs(vRoomSurface.x));
        float roomBack=max(0.0,vRoomSurface.z-uRoomFrame.z);
        float roomVertical=1.0-abs(roomNormal.y);
        float roomFoot=(1.0-smoothstep(0.0,0.7,roomHeight))*roomVertical;
        float roomEdge=(1.0-smoothstep(0.0,0.7,min(roomSide,roomBack)))*(1.0-smoothstep(0.04,0.18,roomHeight))*abs(roomNormal.y);
        float roomCorner=(1.0-smoothstep(0.0,0.8,max(roomSide,roomBack)))*roomVertical;
        float roomContact=clamp(1.0-roomFoot*0.3-roomEdge*0.35-roomCorner*0.2,0.45,1.0);
        reflectedLight.indirectDiffuse*=mix(1.0,roomContact,uRoomDepth);
        reflectedLight.indirectSpecular*=mix(1.0,roomContact,uRoomDepth);`,
      );
  };
  material.customProgramCacheKey = () => key + ':room-tonal-depth-v1';
}
export function setRoomTonalDepth(material: MeshStandardMaterial, colour: boolean): void {
  const amount = DEPTH.get(material);
  if (amount) amount.value = colour ? 0.45 : 1;
}
