import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

export function saveArtifact(directory, file, bytes) {
  writeFileSync(join(directory, file), bytes);
  return { file, sha256: createHash('sha256').update(bytes).digest('hex') };
}

export function inspectArtifacts(directory, artifacts) {
  return artifacts.flatMap(({ file, sha256 }) => {
    const path = resolve(directory, file);
    if (relative(directory, path).startsWith('..') || !existsSync(path) || !statSync(path).isFile())
      return [`missing artifact: ${file}`];
    if (createHash('sha256').update(readFileSync(path)).digest('hex') !== sha256) return [`changed artifact: ${file}`];
    return [];
  });
}
