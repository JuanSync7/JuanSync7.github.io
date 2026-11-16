import { BLUEPRINTS } from './index';
import { inWindow, measureIn, widths, type Measured } from './measure';
import { blueprintSheet } from './sheet';
import type { Blueprint, View } from './types';

/** Measures every blueprint on its real page, for /lab/blueprints/check/ and the scripts that read
 *  it (`npm run blueprint:check`, `blueprint:selftest`, `blueprint -- <id> --store`). Each view's
 *  page loads in a hidden same-origin frame at the view's window size, so the check runs on the
 *  built site as well as the dev server. A template is measured a second time 160 px wider to see
 *  which parts fill. Results go into the page as JSON, sheets as images. */

const WIDER = 160;
const frames = new Map<string, Promise<HTMLIFrameElement>>();

function frame(host: HTMLElement, view: View, css: string): Promise<HTMLIFrameElement> {
  const key = `${view.route}@${view.width}`;
  const known = frames.get(key);
  if (known) return known;
  const made = new Promise<HTMLIFrameElement>((done) => {
    const f = document.createElement('iframe');
    f.style.cssText = `position:absolute;left:-20000px;top:0;border:0;width:${view.width}px;height:${view.height}px`;
    f.addEventListener('load', () => {
      const doc = f.contentDocument;
      if (doc && css) doc.head.append(Object.assign(doc.createElement('style'), { textContent: css }));
      void doc?.fonts.ready.then(() => setTimeout(() => done(f), 400));
    });
    f.src = view.route;
    host.appendChild(f);
  });
  frames.set(key, made);
  return made;
}

const frameTick = (f: HTMLIFrameElement): Promise<void> =>
  new Promise((done) => (f.contentWindow ?? window).requestAnimationFrame(() => done()));

async function measureView(host: HTMLElement, spec: Blueprint, view: View, css: string): Promise<Measured> {
  const f = await frame(host, view, css);
  const doc = f.contentDocument;
  if (!doc) return { spec, view, top: 0, boxes: {}, sizes: [], sizing: [], problems: [`${view.route} did not load`] };
  if (spec.kind === 'component') return measureIn(doc, spec, view, 'clone');
  f.style.width = `${view.width + WIDER}px`;
  await frameTick(f);
  const wide = widths(doc, spec, view);
  f.style.width = `${view.width}px`;
  await frameTick(f);
  return measureIn(doc, spec, view, wide);
}

/** Ways to break a spec or the code on purpose; the check must catch each (`?break=<name>`). */
export const FIXTURES: Record<string, { spec?: (b: Record<string, Blueprint>) => void; css?: string }> = {
  'a size set by the wrong token': { spec: (b) => void (b['paper-action']?.sizes[1] && (b['paper-action'].sizes[1].token = '--pa-padding-x')) }, // prettier-ignore
  'a part that fills marked hug': { spec: (b) => void (b['paper-action']?.parts[1] && (b['paper-action'].parts[1].sizing = 'hug')) }, // prettier-ignore
  'a slot that hugs marked fill': { spec: (b) => void (b['paper-action']?.parts[2] && (b['paper-action'].parts[2].sizing = 'fill')) }, // prettier-ignore
  'a literal that equals the token': { css: '.paper-action .pa-face { padding-left: 20px !important }' },
  'a template part that is not there': { spec: (b) => void (b['blog-post']?.parts[1] && (b['blog-post'].parts[1].selector = '.no-such-pane')) }, // prettier-ignore
  'a fixed column marked fill': { spec: (b) => void (b['blog-post']?.parts[2] && (b['blog-post'].parts[2].sizing = 'fill')) }, // prettier-ignore
};

export interface Result {
  id: string;
  view: string;
  problems: string[];
  sheet?: string;
}

export async function run(
  host: HTMLElement,
  opts: { only?: string; sheets?: boolean; fixture?: string },
): Promise<Result[]> {
  const specs: Record<string, Blueprint> = structuredClone(BLUEPRINTS);
  const fx = opts.fixture ? FIXTURES[opts.fixture] : undefined;
  fx?.spec?.(specs);
  const out: Result[] = [];
  if (opts.sheets) await document.fonts.load("10px 'ISO Lettering B'");
  for (const spec of Object.values(specs)) {
    if (opts.only && spec.id !== opts.only) continue;
    for (const view of spec.views) {
      const m = await measureView(host, spec, view, fx?.css ?? '');
      const r: Result = { id: spec.id, view: view.name, problems: m.problems };
      if (opts.sheets && m.boxes[1]) r.sheet = blueprintSheet(inWindow(m));
      out.push(r);
    }
  }
  return out;
}
