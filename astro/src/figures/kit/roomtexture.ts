import { Vector2, type MeshStandardMaterial } from 'three';
import { MATERIAL_PATTERNS, type RoomPaint } from './roompaint';

/** Stable world-space material detail, filtered by screen derivatives at small sizes. */
const SURFACE = `
uniform float uRoomPattern;
uniform float uRoomDetail;
uniform float uRoomPhase;
uniform float uRoomWoodAxis;
uniform vec2 uRoomSize;
varying vec3 vRoomSurface;
float roomHash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float roomNoise(vec2 p) {
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(roomHash(i),roomHash(i+vec2(1.0,0.0)),f.x),mix(roomHash(i+vec2(0.0,1.0)),roomHash(i+1.0),f.x),f.y);
}
float roomSurface(vec3 p) {
  if (uRoomPattern<0.5) return 1.0;
  if (uRoomPattern<1.5) {
    if(uRoomWoodAxis>0.5) p.xz=p.zx;
    float board=p.z*4.0/uRoomSize.y;
    float b=floor(board);
    float wave=p.z*37.0+sin(p.x*0.82+b*2.1)*1.2+sin(p.x*2.4+b)*0.2;
    float aa=1.0-smoothstep(0.6,3.0,fwidth(wave));
    float grain=sin(wave)*0.075*aa+sin(wave*2.7)*0.025*aa;
    float seam=1.0-smoothstep(max(fwidth(board),0.001),max(fwidth(board)*2.0,0.018),min(fract(board),1.0-fract(board)));
    vec2 k=vec2(fract(p.x*0.23+roomHash(vec2(b,uRoomPhase)))-0.5,(fract(board)-0.5)*1.8);
    float knot=length(k);
    float rings=sin(knot*100.0)*(1.0-smoothstep(0.03,0.24,knot))*(1.0-smoothstep(0.8,3.0,fwidth(knot*100.0)));
    return 0.92+roomHash(vec2(b,uRoomPhase))*0.17+grain+rings*0.11-seam*0.2;
  }
  if (uRoomPattern<2.5) {
    float n=roomNoise(p.xz*5.0+uRoomPhase);
    float vein=abs(sin(p.x*1.7+p.z*0.8+roomNoise(p.xz*0.65)*3.0));
    return 0.94+n*0.12-(1.0-smoothstep(0.025,0.09+fwidth(vein),vein))*0.13;
  }
  if (uRoomPattern<3.5) {
    float line=p.x*220.0+p.z*4.0;
    return 1.0+sin(line)*0.035*(1.0-smoothstep(0.8,3.0,fwidth(line)));
  }
  if (uRoomPattern<4.5) {
    vec2 weave=p.xz*150.0+p.xy*45.0;
    vec2 filtered=1.0-smoothstep(vec2(0.8),vec2(3.0),fwidth(weave));
    return 0.98+dot(sin(weave)*filtered,vec2(0.025))+roomNoise(p.xz*2.0)*0.03;
  }
  if (uRoomPattern<5.5) return 0.97+roomNoise(p.xy*4.0+p.zy*2.0)*0.06;
  return 0.985+roomNoise(p.xz*18.0+p.xy*12.0)*0.025;
}
`;
export function roomTexture(
  material: MeshStandardMaterial,
  paint: RoomPaint,
  phase: number,
  width: number,
  depth: number,
): { value: number } {
  const detail = { value: 0.8 };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      uRoomPattern: { value: MATERIAL_PATTERNS.indexOf(paint.pattern) },
      uRoomDetail: detail,
      uRoomPhase: { value: phase },
      uRoomWoodAxis: { value: paint.grainAlong === 'z' ? 1 : 0 },
      uRoomSize: { value: new Vector2(width, depth) },
    });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRoomSurface;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvRoomSurface=(modelMatrix*vec4(transformed,1.0)).xyz;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + SURFACE)
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\nfloat roomTexel=roomSurface(vRoomSurface);\ndiffuseColor.rgb*=mix(1.0,roomTexel,uRoomDetail);',
      )
      .replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor*(0.95+(roomTexel-1.0)*0.6),0.08,1.0);',
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        if(uRoomPattern>0.5) {
          vec3 dx=dFdx(-vViewPosition),dy=dFdy(-vViewPosition);
          vec3 rx=cross(dy,normal),ry=cross(normal,dx);
          float det=dot(dx,rx);
          float bump=uRoomPattern<2.5 ? 0.018 : 0.003;
          normal=normalize(abs(det)*normal-sign(det)*(dFdx(roomTexel)*rx+dFdy(roomTexel)*ry)*bump*uRoomDetail);
        }`,
      );
  };
  material.customProgramCacheKey = () => 'tabletop-material-detail-v1';
  return detail;
}
