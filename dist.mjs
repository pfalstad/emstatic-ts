// Builds a versioned distribution, mirroring the old GWT workflow: everything except
// EMStatic.html goes into an incrementing emstaticN/ directory (so a fresh deploy can't
// serve stale cached assets under old URLs), and dist/EMStatic.html is generated with a
// <base href="./emstaticN/"> tag so every relative script/link/fetch in the page
// resolves into that directory. (index.html is a separate landing page that loads
// EMStatic.html in an iframe - not part of this build.)

import { build } from 'vite';
import { readFileSync, writeFileSync, existsSync, rmSync } from 'fs';
import path from 'path';

const versionFile = '.dist-version';
const last = existsSync(versionFile) ? parseInt(readFileSync(versionFile, 'utf8').trim(), 10) : 4;
const next = last + 1;

const dirName = `emstatic${next}`;
const outDir = path.join('dist', dirName);

rmSync('dist', { recursive: true, force: true });

await build({ build: { outDir } });

const builtHtmlPath = path.join(outDir, 'index.html');
let html = readFileSync(builtHtmlPath, 'utf8');
html = html.replace('<head>', `<head>\n<base href="./${dirName}/">`);
writeFileSync(path.join('dist', 'EMStatic.html'), html);
rmSync(builtHtmlPath);

writeFileSync(versionFile, String(next) + '\n');

console.log(`Built dist/EMStatic.html -> ./${dirName}/`);
