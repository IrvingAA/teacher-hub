const fs = require('fs');
const path = require('path');

const root = process.cwd();
const targetDir = path.join(root, 'public', 'assets');
const target = path.join(targetDir, 'iconify.min.js');
const candidates = [
  path.join(root, 'node_modules', 'iconify-icon', 'dist', 'iconify-icon.min.js'),
  path.join(root, 'node_modules', '@iconify', 'iconify', 'dist', 'iconify.min.js'),
];
const source = candidates.find((candidate) => fs.existsSync(candidate));

if (!source) {
  console.error('Iconify source not found in:', candidates.join(', '));
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(source, target);
console.log(`Iconify synced to ${target}`);
