import { hardwareDrawing } from './project';
import { hardwareModel } from './models';
import { HARDWARE_KINDS, type HardwareModel, type HardwareOptions } from './types';

export const SVG_SIZE = 256;
export const escapeXml = (value: string): string =>
  value.replace(
    /[<>&"']/g,
    (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char] ?? char,
  );
/** SVG 1.1 consumers need separate opacity, rather than CSS rgba() paint values. */
function paint(role: 'fill' | 'stroke', value: string): string {
  const match = /^rgba\((\d+),(\d+),(\d+),([\d.]+)\)$/.exec(value);
  return match
    ? `${role}="rgb(${match[1]},${match[2]},${match[3]})" ${role}-opacity="${match[4]}"`
    : `${role}="${value}"`;
}
const attributes = (model: HardwareModel, options: HardwareOptions): string =>
  hardwareDrawing(model, options, SVG_SIZE, SVG_SIZE)
    .paths.map((p) => `<path d="${p.d}" ${paint('fill', p.fill)} ${paint('stroke', p.stroke)}/>`)
    .join('');
export function hardwareSvg(model: HardwareModel, options: HardwareOptions): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}" fill="none" stroke-width="1" stroke-linejoin="round" stroke-linecap="round" role="img"><title>${escapeXml(model.kind)} · ${options.mode}</title>${attributes(model, options)}</svg>`;
}
/** A single portable file containing both looks of all twelve objects. */
export function hardwareSprite(options: HardwareOptions): string {
  const symbols = HARDWARE_KINDS.flatMap((kind) =>
    (['isometric', 'wireframe'] as const).map(
      (mode) =>
        `<symbol id="${kind}-${mode}" viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}"><title>${kind} · ${mode}</title>${attributes(hardwareModel(kind), { ...options, mode, open: 0, pick: -1 })}</symbol>`,
    ),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"><title>Juan Kok · hardware atlas · 24 symbols</title><defs>${symbols.join('')}</defs></svg>`;
}
