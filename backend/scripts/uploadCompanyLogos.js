/**
 * One-off uploader for the "Companies Working With Us" logos.
 *
 * Usage:
 *   1. Put the 9 logo images in backend/tmp-logos/ with EXACTLY these names:
 *        gau-organics.png, cesc-kedl.png, cesc-limited.png, cesc-bkesl.png,
 *        spinny.png, sigsense.png, meta.png, cyfuture.png, ices.png
 *      (any image extension is fine — change the names below to match.)
 *   2. Make sure backend/.env has IMAGEKIT_* credentials set.
 *   3. From the backend/ folder run:  node scripts/uploadCompanyLogos.js
 *
 * It uploads each file to the ImageKit folder /recruitkr/logos with a fixed
 * name (no random suffix), so the URLs are stable and predictable. The final
 * URLs are printed at the end — they are already wired into the frontend
 * component via IMAGEKIT_URL_ENDPOINT, so nothing else needs changing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { env } from '../src/config/env.js';
import { imagekit } from '../src/config/imagekit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = path.resolve(__dirname, '../tmp-logos');
const FOLDER = '/recruitkr/logos';

const files = [
  'gau-organics.png',
  'cesc-kedl.png',
  'cesc-limited.png',
  'cesc-bkesl.png',
  'spinny.png',
  'sigsense.png',
  'meta.png',
  'cyfuture.png',
  'ices.png',
];

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source folder not found: ${SOURCE_DIR}`);
    console.error('Create it and drop the 9 logo images inside, then re-run.');
    process.exit(1);
  }

  const results = [];
  for (const fileName of files) {
    const filePath = path.join(SOURCE_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`SKIP (missing): ${fileName}`);
      continue;
    }

    const buffer = fs.readFileSync(filePath);
    const res = await imagekit.upload({
      file: buffer,
      fileName,
      folder: FOLDER,
      useUniqueFileName: false,
      overwriteFile: true,
    });
    console.log(`Uploaded ${fileName} -> ${res.url}`);
    results.push({ fileName, url: res.url });
  }

  console.log('\nDone. URL endpoint in use:', env.IMAGEKIT_URL_ENDPOINT);
  console.log('Frontend will serve these from:', `${env.IMAGEKIT_URL_ENDPOINT}${FOLDER}/<filename>`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
