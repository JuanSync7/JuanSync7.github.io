import pipeline from './pipeline.json';
import type { World } from './types';

/** The documented sequence is the executable sequence. Missing handlers fail immediately. */
export function runPipeline(world: World, handlers: Record<string, () => void>): void {
  const expected = pipeline.stages.map((stage) => stage.id);
  if (expected.length !== new Set(expected).size || expected.length !== Object.keys(handlers).length)
    throw new Error('VXL-PIPELINE: stage ownership mismatch');
  for (const stage of expected) {
    const run = handlers[stage];
    if (!run) throw new Error(`VXL-PIPELINE: missing ${stage}`);
    run();
    world.report.stages.push(stage);
  }
}
