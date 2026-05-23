/**
 * Ortak navbar + sepet kabuğu + site scriptlerini HTML sayfalarına yazar.
 * Kullanım: npm run sync:navbars
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const navbar = fs.readFileSync(path.join(root, 'partials/site/navbar.html'), 'utf8').trim();
const cartShell = fs.readFileSync(path.join(root, 'partials/site/cart-shell.html'), 'utf8').trim();

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
const OLD_CART_RE =
    /<!-- (?:Sepet Drawer|Unified Cart Drawer)[\s\S]*?<div class="cart-overlay"[\s\S]*?<\/div>/g;

const SITE_SCRIPTS = `    <script type="module" src="js/cart/index.js"></script>
    <script src="js/site/nav-active.js" defer></script>
    <script src="js/mobile.js" defer></script>`;

function stripBrokenCartHandlers(html) {
    return html
        .replace(
            /<script>\s*document\.getElementById\('open-cart-modal'\)[\s\S]*?<\/script>\s*/g,
            ''
        )
        .replace(/<style>\s*\.cart-drawer[\s\S]*?<\/style>\s*/g, '');
}

function ensureCartShell(html) {
    let next = html.replace(OLD_CART_RE, '');
    if (!next.includes('id="cart-modal"')) {
        next = next.replace(/<\/body>/i, `\n${cartShell}\n\n${SITE_SCRIPTS}\n</body>`);
    }
    return next;
}

function ensureSiteScripts(html) {
    let next = html;
    if (next.includes('js/cart/index.js') && next.includes('js/site/nav-active.js')) {
        return next;
    }
    next = next.replace(/<script type="module" src="js\/cart\/index\.js"><\/script>\s*/g, '');
    next = next.replace(/<script src="js\/site\/nav-active\.js" defer><\/script>\s*/g, '');
    next = next.replace(/<script src="js\/mobile\.js" defer><\/script>\s*/g, '');
    if (!next.includes('js/cart/index.js')) {
        next = next.replace(/<\/body>/i, `\n${SITE_SCRIPTS}\n</body>`);
    }
    return next;
}

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
    html = stripBrokenCartHandlers(html);
    html = ensureCartShell(html);
    html = ensureSiteScripts(html);
    fs.writeFileSync(full, html);
    console.log('✓', file);
}

console.log('Site kabuğu senkron tamam.');
