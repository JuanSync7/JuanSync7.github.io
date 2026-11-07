/** The figure-facing dive API; domain models and painters stay in their owning kernels. */
export { diveCamera, journeyOpacity } from './dive-camera';
export { CHAINS, levelKind, makeDivePlan, type DiveChain, type DiveEra } from './dive-plan';
export { paintDiveLevel } from './dive-render';
export { nestConnections, type NestConnection } from './dive-connections';
