// Construction API: accentOf(spec) copies complete semantic parts, or no strokes.
// A part may contain several primitives. Asset authors supply the intent, never loose accent geometry.
export function accentOf(icon){
 const {mode,part}=icon.accent;
 const indices=mode==='none'?[]:mode==='whole'?icon.nodes.map((_,index)=>index):icon.parts[part];
 return indices.map(index=>structuredClone(icon.nodes[index]));
}
