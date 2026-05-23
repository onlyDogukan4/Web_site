import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const lines = fs.readFileSync(path.join(root, 'style.css'), 'utf8').split('\n');

const sections = [
    { name: 'base', start: 0, end: 49 },
    { name: 'vip', start: 49, end: 108 },
    { name: 'layout', start: 108, end: 217 },
    { name: 'search-modals', start: 217, end: 365 },
    { name: 'navbar', start: 365, end: 545 },
    { name: 'concepts-campaigns', start: 545, end: 729 },
    { name: 'hero-products', start: 729, end: 954 },
    { name: 'product-detail', start: 954, end: 1147 },
    { name: 'cart-footer', start: 1147, end: 1291 },
    { name: 'responsive', start: 1291, end: lines.length },
];

const cssDir = path.join(root, 'css');
fs.mkdirSync(cssDir, { recursive: true });

for (const s of sections) {
    fs.writeFileSync(path.join(cssDir, `${s.name}.css`), lines.slice(s.start, s.end).join('\n'));
}

const imports = sections.map((s) => `@import url('css/${s.name}.css');`).join('\n');
fs.writeFileSync(
    path.join(root, 'style.css'),
    '/* Moderra — ana stil dosyası (parçalı yapı, css/ klasörü) */\n' + imports + '\n'
);

console.log('CSS bölündü:', sections.map((s) => s.name).join(', '));
