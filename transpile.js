#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'frontend', 'src');
const DEST = path.join(__dirname, 'assets', 'js', 'app.js');
const PART_PATTERN = /^\d{2}-.*\.js$/;

function listFilesRecursive(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listFilesRecursive(full);
      }
      return [full];
    });
}

function getSourceFiles() {
  return listFilesRecursive(SRC_DIR)
    .filter((file) => PART_PATTERN.test(path.basename(file)))
    .sort((a, b) => {
      const relA = path.relative(SRC_DIR, a).replace(/\\/g, '/');
      const relB = path.relative(SRC_DIR, b).replace(/\\/g, '/');
      return relA.localeCompare(relB);
    });
}

function build() {
  const files = getSourceFiles();
  if (!files.length) {
    throw new Error('No frontend source parts found in ' + SRC_DIR);
  }

  const src = files
    .map((file) => {
      const rel = path.relative(__dirname, file).replace(/\\/g, '/');
      return '/* Source: ' + rel + ' */\n' + fs.readFileSync(file, 'utf8').trimEnd();
    })
    .join('\n\n');

  const out = '/* Built: ' + new Date().toISOString() + ' */\n' + src + '\n';
  fs.writeFileSync(DEST, out, 'utf8');
  console.log('[CSPSR-CLEAN] Transpiled -> ' + DEST + ' (' + Math.round(out.length / 1024) + ' KB)');
}

build();

if (process.argv[2] === '--watch') {
  console.log('[CSPSR-CLEAN] Watching ' + SRC_DIR + '...');
  fs.watch(SRC_DIR, function (_eventType, filename) {
    if (!filename || !PART_PATTERN.test(filename)) {
      return;
    }
    try {
      build();
    } catch (error) {
      console.error(error.message);
    }
  });
}
