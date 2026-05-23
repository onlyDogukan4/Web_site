import { isEnglish } from './lang.js';
import { state, PER_PAGE } from './state.js';

const CAT_MAP = { active: 'Standart', hot: 'Fırsat', discount: 'İndirimli', oos: 'Stok Dışı' };

export function renderProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;

    const isEn = isEnglish();
    const filtered =
        state.category === 'Tümü'
            ? state.products
            : state.products.filter((p) => (CAT_MAP[p.status] || 'Standart') === state.category);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    if (state.page > totalPages) state.page = 1;
    const page = filtered.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);

    renderCategoryNav();
    container.innerHTML = '';

    if (!page.length) {
        container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted);">
                <i class="fas fa-box-open fa-3x" style="opacity:.3;margin-bottom:15px;display:block;"></i>
                Bu kategoride ürün bulunamadı.
            </div>`;
        renderPagination(totalPages);
        return;
    }

    page.forEach((p) => {
        const name = isEn ? p.name_en || p.name_tr : p.name_tr;
        const isOOS = p.status === 'oos';
        const camp = state.campaigns.find((c) => String(c.id) === String(p.campaign_id));

        let badge = '';
        if (p.status === 'hot' && !camp)
            badge = `<div class="hot-badge"><i class="fas fa-fire"></i> FIRSAT</div>`;
        if (isOOS)
            badge = `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-15deg);background:rgba(0,0,0,0.8);color:white;padding:10px 20px;font-weight:900;z-index:30;border-radius:10px;border:2px solid #ef4444;font-size:14px;">TÜKENDİ</div>`;

        const card = document.createElement('div');
        card.className = 'product-card' + (isOOS ? ' oos-card' : '');
        card.style.position = 'relative';
        card.innerHTML = `
                <img src="${p.image || 'images/bardak.png'}" alt="${name}" class="product-img" loading="lazy"
                     width="400" height="280"
                     style="${isOOS ? 'filter:grayscale(1) opacity(.5);' : 'cursor:pointer;'}"
                     onclick="${isOOS ? '' : `openProductDetail('${p.id}')`}">
                ${badge}
                <div class="product-info">
                    <h3 class="product-title" style="${isOOS ? '' : 'cursor:pointer;'}"
                        onclick="${isOOS ? '' : `openProductDetail('${p.id}')`}">${name}</h3>
                    <div class="product-price">
                        ${p.old_price ? `<span style="text-decoration:line-through;font-size:14px;color:#94a3b8;margin-right:5px;">₺${parseFloat(p.old_price).toLocaleString('tr-TR')}</span>` : ''}
                        ₺${parseFloat(p.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </div>
                    <div class="product-actions" style="${isOOS ? 'pointer-events:none;opacity:.5;' : ''}">
                        <button class="add-to-cart" ${isOOS ? 'disabled' : ''}
                                onclick="addToCart('${p.id}','${p.name_tr.replace(/'/g, "\\'")}',${p.price})">
                            <i class="fas fa-shopping-cart"></i>
                            ${isOOS ? 'Stok Yok' : isEn ? 'Add to Cart' : 'Sepete Ekle'}
                        </button>
                        <button class="inspect-btn" onclick="openProductDetail('${p.id}')">
                            <i class="fas fa-expand-alt"></i>
                        </button>
                    </div>
                </div>`;
        container.appendChild(card);
    });

    renderPagination(totalPages);
}

function renderCategoryNav() {
    const nav = document.getElementById('product-category-nav');
    if (!nav) return;
    const cats = ['Tümü', ...new Set(state.products.map((p) => CAT_MAP[p.status] || 'Standart'))];
    nav.innerHTML = cats
        .map(
            (cat) => `
            <button onclick="filterCategory('${cat}')" style="
                padding:9px 22px;border-radius:50px;cursor:pointer;font-weight:700;font-size:14px;transition:.2s;
                border:2px solid ${cat === state.category ? 'var(--primary)' : 'var(--border)'};
                background:${cat === state.category ? 'var(--primary)' : 'transparent'};
                color:${cat === state.category ? 'white' : 'var(--text)'};">${cat}
            </button>`
        )
        .join('');
}

export function filterCategory(cat) {
    state.category = cat;
    state.page = 1;
    renderProducts();
}

function renderPagination(total) {
    const el = document.getElementById('product-pagination');
    if (!el) return;
    if (total <= 1) {
        el.innerHTML = '';
        return;
    }
    el.innerHTML = Array.from({ length: total }, (_, i) => i + 1)
        .map(
            (i) => `
            <button onclick="_page=${i};renderProducts()" style="
                width:42px;height:42px;border-radius:50%;cursor:pointer;font-weight:800;font-size:15px;transition:.2s;
                border:2px solid ${i === state.page ? 'var(--primary)' : 'var(--border)'};
                background:${i === state.page ? 'var(--primary)' : 'transparent'};
                color:${i === state.page ? 'white' : 'var(--text)'};">${i}
            </button>`
        )
        .join('');
}
