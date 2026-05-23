/**
 * templates + partials klasörlerinden kök index.html ve admin.html üretir.
 * Kullanım: npm run build:html
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const INCLUDE_RE = /<!--\s*@include\s+([^\s]+)\s*-->/g;
const GENERATED_BANNER =
    '<!-- Otomatik üretilir — düzenlemek için templates/ ve partials/ kullanın; npm run build:html -->\n';

function assemble(html, stack = []) {
    return html.replace(INCLUDE_RE, (_, rel) => {
        const normalized = rel.trim().replace(/\\/g, '/');
        if (stack.includes(normalized)) {
            throw new Error(`Döngüsel include: ${stack.join(' → ')} → ${normalized}`);
        }
        const full = path.join(root, normalized);
        if (!fs.existsSync(full)) {
            throw new Error(`Partial bulunamadı: ${normalized}`);
        }
        const content = fs.readFileSync(full, 'utf8');
        return assemble(content, [...stack, normalized]);
    });
}

function build(templateFile, outputFile) {
    const tplPath = path.join(root, 'templates', templateFile);
    const outPath = path.join(root, outputFile);
    if (!fs.existsSync(tplPath)) {
        throw new Error(`Şablon yok: templates/${templateFile}`);
    }
    const html = GENERATED_BANNER + assemble(fs.readFileSync(tplPath, 'utf8'));
    fs.writeFileSync(outPath, html);
    const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
    console.log(`✓ ${outputFile} (${kb} KB)`);
}

function extractIndexPageCss() {
    const legacy = path.join(root, 'index.html');
    if (!fs.existsSync(legacy)) return;
    const m = fs.readFileSync(legacy, 'utf8').match(/<style>([\s\S]*?)<\/style>/);
    if (!m) return;
    const out = path.join(root, 'css', 'index-page.css');
    if (!fs.existsSync(out)) {
        fs.writeFileSync(out, m[1].trim() + '\n');
        console.log('✓ css/index-page.css (ilk çıkarım)');
    }
}

function extractIndexPageJs() {
    const out = path.join(root, 'js', 'pages', 'index.js');
    if (fs.existsSync(out)) return;
    const legacy = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const m = legacy.match(/<!-- ── Ana Uygulama Scripti[\s\S]*?<script>\s*([\s\S]*?)<\/script>\s*\n\s*<script src="js\/mobile/);
    if (!m) return;
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const body = m[1].trim();
    const wrapped = `${body}

// Global (onclick / chatbot)
Object.assign(window, {
    addToCart,
    addPackageToCart,
    openProductDetail,
    filterCategory,
    adjustPkgQty,
    renderProducts,
});
Object.defineProperty(window, '_page', {
    get: () => _page,
    set: (v) => { _page = v; },
});
window.onCardQuantities = window.onCardQuantities || {};
`;
    fs.writeFileSync(out, wrapped);
    console.log('✓ js/pages/index.js (ilk çıkarım)');
}

/** Mevcut monolitik HTML'den partials oluştur (bir kez veya --force) */
function bootstrapFromLegacy(force = false) {
    const indexPath = path.join(root, 'index.html');
    const adminPath = path.join(root, 'admin.html');
    if (!fs.existsSync(indexPath) || !fs.existsSync(adminPath)) return;

    const html = fs.readFileSync(indexPath, 'utf8');
    const adminHtml = fs.readFileSync(adminPath, 'utf8');

    const writePartial = (rel, content) => {
        const full = path.join(root, rel);
        if (!force && fs.existsSync(full)) return;
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, content.trim() + '\n');
    };

    const between = (src, start, end) => {
        const a = src.indexOf(start);
        const b = src.indexOf(end, a + start.length);
        if (a === -1 || b === -1) throw new Error(`Marker bulunamadı: ${start}`);
        return src.slice(a, b);
    };

    // ── index partials ──
    writePartial('partials/site/search-bar.html', between(html, '<!-- Arama (sticky bar) -->', '<!-- Navbar -->'));
    writePartial('partials/site/navbar.html', between(html, '<!-- Navbar -->', '<main>'));
    writePartial('partials/index/hero-slider.html', between(html, '<!-- Slider -->', '<!-- Ürünler -->'));
    writePartial('partials/index/products-section.html', between(html, '<!-- Ürünler -->', '<!-- Paketler -->'));
    writePartial('partials/index/packages-section.html', between(html, '<!-- Paketler -->', '</main>'));
    writePartial('partials/index/cart-drawer.html', between(html, '<!-- Sepet Drawer -->', '<!-- Profil Modalı -->'));
    writePartial('partials/index/profile-modal.html', between(html, '<!-- Profil Modalı -->', '<!-- Ürün Detay Modalı -->'));
    writePartial('partials/index/product-detail-modal.html', between(html, '<!-- Ürün Detay Modalı -->', '<!-- Footer -->'));
    writePartial('partials/site/footer.html', between(html, '<!-- Footer -->', '<!-- ── Sepet Sistemi'));

    // ── admin partials ──
    writePartial('partials/admin/login.html', between(adminHtml, '<div id="login-overlay">', '<!-- PRODUCT MODAL -->'));
    writePartial('partials/admin/modals/product.html', between(adminHtml, '<!-- PRODUCT MODAL -->', '<!-- CAMPAIGN MODAL'));
    writePartial('partials/admin/modals/campaign.html', between(adminHtml, '<!-- CAMPAIGN MODAL', '<!-- CONCEPT MODAL -->'));
    writePartial('partials/admin/modals/concept.html', between(adminHtml, '<!-- CONCEPT MODAL -->', '<!-- PACKAGE MODAL -->'));
    writePartial('partials/admin/modals/package.html', between(adminHtml, '<!-- PACKAGE MODAL -->', '<!-- ORDER MODAL'));
    writePartial('partials/admin/modals/order.html', between(adminHtml, '<!-- ORDER MODAL', '<aside class="sidebar">'));
    writePartial('partials/admin/sidebar.html', between(adminHtml, '<aside class="sidebar">', '<main class="main-content">'));
    writePartial('partials/admin/sections/products.html', between(adminHtml, '<!-- Ürünler Bölümü -->', '<!-- Paketler (YENİ) -->'));
    writePartial('partials/admin/sections/packages.html', between(adminHtml, '<!-- Paketler (YENİ) -->', '<!-- Konseptler (YENİ) -->'));
    writePartial('partials/admin/sections/concepts.html', between(adminHtml, '<!-- Konseptler (YENİ) -->', '<!-- KAMPANYALAR BÖLÜMÜ'));
    writePartial('partials/admin/sections/campaigns.html', between(adminHtml, '<!-- KAMPANYALAR BÖLÜMÜ', '<!-- Siparişler Bölümü -->'));
    writePartial('partials/admin/sections/orders.html', between(adminHtml, '<!-- Siparişler Bölümü -->', '<!-- Genel Ayarlar Bölümü -->'));
    writePartial('partials/admin/sections/settings.html', between(adminHtml, '<!-- Genel Ayarlar Bölümü -->', '</main>'));

    extractIndexPageCss();
    extractIndexPageJs();
    console.log('Partials hazır (templates/ + partials/)');
}

const forceBootstrap = process.argv.includes('--bootstrap');
bootstrapFromLegacy(forceBootstrap);

build('index.html', 'index.html');
build('admin.html', 'admin.html');
