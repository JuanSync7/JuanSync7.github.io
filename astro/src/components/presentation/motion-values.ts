export function readMotionToken(style: CSSStyleDeclaration, name: string, units: readonly string[]): number {
  const value = style.getPropertyValue(name).trim();
  // Production CSS serializes 650ms as .65s; both represent the same duration.
  const match = /^((?:\d+(?:\.\d+)?|\.\d+))(ms|s|px|%|deg)$/.exec(value);
  if (!match || !units.includes(match[2])) throw new Error(`Invalid presentation token ${name}`);
  const number = Number(match[1]);
  if (!Number.isFinite(number)) throw new Error(`Non-finite presentation token ${name}`);
  return number / (match[2] === 'ms' ? 1000 : 1);
}
