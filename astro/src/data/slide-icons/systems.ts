export const systems = [
  {
    id: 'server',
    name: 'Server stack',
    group: 'systems',
    tags: 'server compute infrastructure machine',
  },
  {
    id: 'switch',
    name: 'Network switch',
    group: 'systems',
    tags: 'switch ethernet ports networking',
  },
  {
    id: 'storage',
    name: 'Storage',
    group: 'systems',
    tags: 'storage hard drive ssd disk persistent',
  },
  {
    id: 'cloud',
    name: 'Cloud',
    group: 'systems',
    tags: 'cloud remote distributed infrastructure',
  },
  {
    id: 'power',
    name: 'Power',
    group: 'systems',
    tags: 'power energy supply efficiency',
  },
  {
    id: 'satellite',
    name: 'Satellite',
    group: 'systems',
    tags: 'satellite space communications orbit',
  },
  {
    id: 'router',
    name: 'Router',
    group: 'systems',
    tags: 'router',
  },
  {
    id: 'network',
    name: 'Network',
    group: 'systems',
    tags: 'network',
  },
] as const;
