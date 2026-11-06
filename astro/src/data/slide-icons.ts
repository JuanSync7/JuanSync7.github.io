export const SLIDE_ICONS = [
  { id: 'processor', name: 'Processor', group: 'compute', tags: 'cpu silicon core chip' },
  { id: 'memory', name: 'Memory', group: 'compute', tags: 'dram hbm layers stack' },
  { id: 'wafer', name: 'Wafer', group: 'compute', tags: 'fabrication silicon manufacturing' },
  { id: 'accelerator', name: 'Accelerator', group: 'compute', tags: 'gpu ai compute card' },
  { id: 'circuit-board', name: 'Circuit board', group: 'compute', tags: 'pcb electronics embedded' },
  { id: 'chiplets', name: 'Chiplets', group: 'compute', tags: 'package interposer integration dies' },
  { id: 'server', name: 'Server', group: 'systems', tags: 'compute infrastructure machine' },
  { id: 'switch', name: 'Network switch', group: 'systems', tags: 'ethernet ports networking' },
  { id: 'storage', name: 'Storage', group: 'systems', tags: 'ssd disk persistent drive' },
  { id: 'cloud', name: 'Cloud', group: 'systems', tags: 'remote distributed infrastructure' },
  { id: 'power', name: 'Power', group: 'systems', tags: 'energy supply efficiency' },
  { id: 'satellite', name: 'Satellite', group: 'systems', tags: 'space communications orbit' },
  { id: 'database', name: 'Database', group: 'data', tags: 'records query store' },
  { id: 'dataset', name: 'Dataset', group: 'data', tags: 'table samples training records' },
  { id: 'document', name: 'Document', group: 'data', tags: 'file report specification' },
  { id: 'folder', name: 'Folder', group: 'data', tags: 'directory project collection' },
  { id: 'archive', name: 'Archive', group: 'data', tags: 'package backup repository box' },
  { id: 'terminal', name: 'Terminal', group: 'data', tags: 'code cli command software' },
  { id: 'notebook', name: 'Notebook', group: 'research', tags: 'notes journal experiment' },
  { id: 'chart', name: 'Chart', group: 'research', tags: 'benchmark measurement results' },
  { id: 'flask', name: 'Flask', group: 'research', tags: 'lab experiment chemistry' },
  { id: 'microscope', name: 'Microscope', group: 'research', tags: 'inspect analysis research' },
  { id: 'calipers', name: 'Calipers', group: 'research', tags: 'measure dimension precision' },
  { id: 'compass', name: 'Drafting compass', group: 'research', tags: 'design geometry plan' },
] as const;

export type SlideIconId = (typeof SLIDE_ICONS)[number]['id'];
export type SlideGroup = (typeof SLIDE_ICONS)[number]['group'];
export const SLIDE_GROUPS: readonly SlideGroup[] = ['compute', 'systems', 'data', 'research'];
export function isSlideIcon(value: unknown): value is SlideIconId {
  return SLIDE_ICONS.some((icon) => icon.id === value);
}
