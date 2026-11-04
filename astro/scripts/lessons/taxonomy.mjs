import { readFile } from 'node:fs/promises';

const identifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const nonempty = (value) => typeof value === 'string' && value.trim() === value && value.length > 0;

export function validateRegistry(registry) {
  if (!registry || registry.version !== 1) throw new Error('Expected lesson taxonomy version 1');
  for (const key of ['categories', 'tags', 'tagTypes']) {
    if (!Array.isArray(registry[key]) || !registry[key].length) throw new Error(`Empty taxonomy ${key}`);
    const ids = new Set();
    const labels = new Set();
    for (const entry of registry[key]) {
      if (!entry || typeof entry.id !== 'string' || !identifier.test(entry.id) || !nonempty(entry.label)
        || ids.has(entry.id) || labels.has(entry.label.toLowerCase())) {
        throw new Error(`Invalid or duplicate taxonomy ${key} entry`);
      }
      ids.add(entry.id);
      labels.add(entry.label.toLowerCase());
    }
  }
  for (const category of registry.categories) {
    if (!nonempty(category.description)) throw new Error(`Missing category description: ${category.id}`);
  }
  const types = new Set(registry.tagTypes.map((type) => type.id));
  for (const tag of registry.tags) if (!types.has(tag.type)) throw new Error(`Unknown tag type: ${tag.id}`);
  return registry;
}

export async function readRegistry(path) {
  return validateRegistry(JSON.parse(await readFile(path, 'utf8')));
}

export function validateClassification(data, registry, id) {
  if (!registry.categories.some((entry) => entry.id === data.category)) throw new Error(`${id}: unknown category`);
  if (!Array.isArray(data.tags) || !data.tags.length || data.tags.length > 5 || new Set(data.tags).size !== data.tags.length) {
    throw new Error(`${id}: expected one to five distinct tags`);
  }
  const allowed = new Set(registry.tags.map((entry) => entry.id));
  if (data.tags.some((tag) => typeof tag !== 'string' || !allowed.has(tag))) throw new Error(`${id}: unknown tag`);
}
