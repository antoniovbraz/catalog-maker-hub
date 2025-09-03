import { readdir, stat } from 'fs/promises';
import path from 'path';

const limit = 250 * 1024; // 250 KiB
const assetsDir = path.resolve('dist', 'assets');

const entries = await readdir(assetsDir);
let hasError = false;
for (const file of entries) {
  if (!file.endsWith('.js')) continue;
  const filePath = path.join(assetsDir, file);
  const { size } = await stat(filePath);
  const sizeKb = size / 1024;
  if (size > limit) {
    console.error(`\u274c ${file} is ${sizeKb.toFixed(2)} KiB (limit: ${limit / 1024} KiB)`);
    hasError = true;
  } else {
    console.log(`\u2705 ${file} is ${sizeKb.toFixed(2)} KiB`);
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('All bundles within size limit');
}
