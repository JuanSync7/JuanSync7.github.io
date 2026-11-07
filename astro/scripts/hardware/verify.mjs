import { spawnSync } from 'node:child_process';

// Exit on the first failed stage; a later screenshot cannot hide an earlier failure.
for (const script of ['check','hardware:check','build','hardware:export','hardware:browser']) {
  const result = spawnSync('npm', ['run', script], {
    stdio: 'inherit', env: {...process.env, ASTRO_TELEMETRY_DISABLED:'1'},
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
