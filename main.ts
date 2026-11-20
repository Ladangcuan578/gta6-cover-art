// Neon Shore Cover Lab — hand-in program for gta6-cover-art-01.
// Node 22, standard library only. It takes the offline app (app/) and the
// screenshots (screenshots/) from beside this file, copies them into the
// output directory, and writes dossier.json there with the vendored make.fun
// library. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Serve the app locally first with `node serve.ts`, then open
// http://localhost:8080 to try it in desktop Chrome.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the rest refuse an entry the scorer would refuse — more than 4
// screenshots or one over 256 KiB, more than 993 files in app/ or 48 MiB of
// app files in all, or a path under app/ over 1000 bytes.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function fail(message) {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

function copyTree(source, target) {
  if (!existsSync(source)) fail(`missing ${source} — the repository is incomplete`);
  cpSync(source, target, { recursive: true });
}

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const shotNames = existsSync(join(repoRoot, 'screenshots'))
  ? readdirSync(join(repoRoot, 'screenshots')).filter((n) => !n.startsWith('.'))
  : [];
if (shotNames.length < 3 || shotNames.length > DOSSIER_LIMITS.screenshots.max) {
  fail(`expected 3 or 4 screenshots, found ${shotNames.length}`);
}

mkdirSync(outDir, { recursive: true });
copyTree(join(repoRoot, 'app'), join(outDir, 'app'));
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
copyTree(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));

writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, DOSSIER_LIMITS));
console.log(`main.ts: wrote ${shotNames.length} screenshots and dossier.json to ${outDir}`);
