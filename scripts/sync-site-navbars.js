/**
 * Ortak navbar partial'ını belirtilen HTML dosyalarına yazar.
 * Kullanım: node scripts/sync-site-navbars.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const navbar = fs.readFileSync(path.join(root, 'partials/site/navbar.html'), 'utf8').trim();

const targets = [
    'yilbasi.html',
    'bayram.html',
    'dugun.html',
    'toplanti.html',
    'dogum-gunu.html',
    'fuar.html',
    'about.html',
    'sss.html',
    'konsept-bardaklar.html',
    'index.html',
    'takip.html',
];

const NAV_RE = /<nav class="navbar">[\s\S]*?<\/nav>/;

const NAV_SCRIPTS = `    <script src="js/site/nav-active.js" defer></script>
    <script src="js/mobile.js" defer></script>`;

for (const file of targets) {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) {
        console.warn('Atlandı (yok):', file);
        continue;
    }
    let html = fs.readFileSync(full, 'utf8');
    if (!NAV_RE.test(html)) {
        console.warn('Navbar bulunamadı:', file);
        continue;
    }
    html = html.replace(NAV_RE, navbar);
    if (!html.includes('js/site/nav-active.js')) {
        html = html.replace(/<script src="js\/mobile\.js" defer><\/script>/, NAV_SCRIPTS);
    }
    fs.writeFileSync(full, html);
    console.log('✓', file);
}

console.log('Navbar senkron tamam.');
