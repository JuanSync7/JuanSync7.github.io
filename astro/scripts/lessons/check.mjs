import { readdir, readFile } from 'node:fs/promises';
import { readRegistry, validateClassification } from './taxonomy.mjs';

try {
  const registry = await readRegistry(new URL('../../src/config/lesson-taxonomy.json', import.meta.url));
  const source = new URL('../../src/content/lessons/', import.meta.url);
  const files = (await readdir(source)).filter((name) => name.endsWith('.yaml'));
  if (!files.length) throw new Error('No lessons checked');
  for (const name of files) {
    const data = JSON.parse(await readFile(new URL(name, source), 'utf8'));
    validateClassification(data, registry, name);
  }
  console.log(`Lesson taxonomy: ${files.length} lessons, ${registry.categories.length} categories, ${registry.tags.length} allowed tags.`);
} catch (error) {
  console.error(`Lesson taxonomy refused: ${error.message}`);
  process.exitCode = 1;
}
