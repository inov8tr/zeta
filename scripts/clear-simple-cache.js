#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function tryUnlink(p) {
  try {
    fs.unlinkSync(p);
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      throw err;
    }
  }
}

function touchFile(p) {
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, '', { flag: 'w' });
  } catch (err) {
    console.warn('Failed to touch', p, err);
  }
}

const root = process.cwd();
['.next/server/app/action-manifest.json', '.next/server/app/actions.json'].forEach((rel) => {
  const full = path.join(root, rel);
  tryUnlink(full);
});

// Touch a known client entry to bump hash so dev picks up new actions
const entry = path.join(root, 'src/app/student/page.tsx');
touchFile(entry);

console.log('Cleared action manifest cache and touched student page.');
