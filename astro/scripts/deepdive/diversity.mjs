import { createHash } from 'node:crypto';

/** Metadata and unused random parameters cannot masquerade as visible variation. */
export function geometrySignature(plan) {
  const visible = { segs: plan.segs, dots: plan.dots, w: plan.w, detail: plan.detail, interfaces: plan.interfaces };
  return createHash('sha256')
    .update(JSON.stringify(visible, (_key, value) => (typeof value === 'number' ? Math.round(value * 512) : value)))
    .digest('hex');
}

export function inspectDiversity(groups, minimum) {
  const issues = [];
  for (const [group, signatures] of groups) {
    if (signatures.size < minimum)
      issues.push(`${group}: only ${signatures.size} distinct drawings; expected at least ${minimum}`);
  }
  if (!groups.size) issues.push('no drawing families measured');
  return issues;
}
