'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const jsDir = path.join(__dirname, '..', 'src', 'js');

function collectJsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectJsFiles(fullPath);
    return entry.name.endsWith('.js') ? [fullPath] : [];
  });
}

const files = collectJsFiles(jsDir);

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log(`frontend syntax check passed (${files.length} files)`);
