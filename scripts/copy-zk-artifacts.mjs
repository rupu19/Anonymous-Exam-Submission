import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const managed = resolve(root, 'managed', 'counter');
const publicDir = resolve(root, 'public');

for (const dir of ['keys', 'zkir', 'compiler']) {
  const src = resolve(managed, dir);
  const dest = resolve(publicDir, dir);
  if (!existsSync(src)) {
    console.warn(`Skipping missing artifact dir: ${src}`);
    continue;
  }
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`Copied ${dir}/ → public/${dir}/`);
}
