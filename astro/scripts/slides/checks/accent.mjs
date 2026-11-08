// Read the source contract independently. Never call the construction kernel.
const canonical=node=>JSON.stringify({tag:node.tag,attrs:Object.fromEntries(Object.entries(node.attrs).sort(([a],[b])=>a.localeCompare(b)))});
export function accentFeatures(icon){
 if(icon.accent.mode==='none')return [];
 const indices=icon.accent.mode==='whole'?Array.from(icon.nodes.keys()):icon.parts[icon.accent.part];
 return indices.map(index=>icon.nodes[index]);
}
export function checkAccentCoverage(icon,accents){
 const expected=accentFeatures(icon).map(canonical).sort(),actual=accents.map(canonical).sort();
 return JSON.stringify(expected)===JSON.stringify(actual)?[]:[{
  rule:'ACCENT',message:'Color exactly the complete declared semantic unit: every member, no partial strokes or extra parts; none means no highlight'
 }];
}
