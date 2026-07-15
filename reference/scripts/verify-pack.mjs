// Guards the npm tarball contents. `files` in package.json is an allowlist by
// intent, but nothing enforces it stays tight — this does. Runs in CI and via
// prepublishOnly, so an accidental inclusion (tests, tsconfig, source, env
// files) fails the pipeline instead of shipping to the registry.

import { execFileSync } from 'node:child_process';

const ALLOWED = [
  /^package\.json$/,
  /^README\.md$/i,
  /^LICENSE$/i,
  /^dist\/[^/]+\.js$/,
  /^dist\/[^/]+\.d\.ts$/,
];

const REQUIRED = ['package.json', 'README.md', 'LICENSE', 'dist/index.js', 'dist/index.d.ts'];

const out = execFileSync('npm', ['pack', '--dry-run', '--json'], { encoding: 'utf8' });
const [report] = JSON.parse(out);
const shipped = report.files.map((f) => f.path);

const unexpected = shipped.filter((p) => !ALLOWED.some((re) => re.test(p)));
const missing = REQUIRED.filter((p) => !shipped.includes(p));

if (unexpected.length > 0) {
  console.error('✖ Tarball contains files outside the allowlist:');
  for (const p of unexpected) console.error(`    ${p}`);
}
if (missing.length > 0) {
  console.error('✖ Tarball is missing required files:');
  for (const p of missing) console.error(`    ${p}`);
}
if (unexpected.length > 0 || missing.length > 0) process.exit(1);

console.log(`✔ Tarball clean: ${shipped.length} files, all within dist/ + package metadata.`);
