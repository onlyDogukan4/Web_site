import { isEnglish } from './lang.js';
import { state } from './state.js';

function formatPkgPrice(amount) {
    return '₺' + Number(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function isWeddingPackage(pkg) {
    const hay = `${pkg.name || ''} ${pkg.id || ''} ${pkg.description || ''}`.toLowerCase();
    return /düğün|dugun|wedding|gelin|damat/.test(hay);
}

export function renderPackages() {
    const container = document.getElementById('packages-container');
    if (!container) return;
    const isEn = isEnglish();
    const visible = state.packages.filter((p) => p.published).sort((a, b) => (a.order || 0) - (b.order || 0));

    container.innerHTML = '';
    visible.forEach((pkg) => {
        const itemIds = (pkg.items || '').split(',').map((s) => s.trim()).filter(Boolean);
        let subTotal = 0;
        itemIds.forEach((id) => {
            const p = state.products.find((x) => String(x.id) === id);
            if (p) subTotal += parseFloat(p.price);
        });
        const discounted = subTotal * (1 - (pkg.discount || 0) / 100);
        const gridClass = itemIds.length === 3 ? 'package-items-grid items-3' : 'package-items-grid';

        const div = document.createElement('div');
        div.className = isWeddingPackage(pkg) ? 'package-card package-card--wedding' : 'package-card';
        div.innerHTML = `
                <div class="package-card-badge">%${pkg.discount || 0} İNDİRİM</div>
                <div class="package-card-head">
                    <img src="${pkg.image || 'images/bardak.png'}" alt="">
                    <div>
                        <h3>${pkg.name}</h3>
                        ${pkg.description ? `<p>${pkg.description}</p>` : ''}
                    </div>
                </div>
                <div class="${gridClass}">
                    ${itemIds
                        .map((id) => {
                            const p = state.products.find((x) => String(x.id) === id);
                            if (!p) return '';
                            const key = `${pkg.id}-${p.id}`;
                            const qty = window.onCardQuantities[key] || 1;
                            const label = isEn ? p.name_en || p.name_tr : p.name_tr;
                            return `
                            <div class="package-item">
                                <img src="${p.image || 'images/bardak.png'}" alt="">
                                <span class="package-item-name">${label}</span>
                                <div class="package-item-qty">
                                    <button type="button" class="qty-btn" onclick="adjustPkgQty('${pkg.id}','${p.id}',-1)" aria-label="Azalt">−</button>
                                    <span class="qty-value" id="qty-${key}">${qty}</span>
                                    <button type="button" class="qty-btn" onclick="adjustPkgQty('${pkg.id}','${p.id}',1)" aria-label="Artır">+</button>
                                </div>
                            </div>`;
                        })
                        .join('')}
                </div>
                <div class="package-footer">
                    <div class="package-price-block">
                        <div class="package-price" id="pkg-price-${pkg.id}">${formatPkgPrice(discounted)}</div>
                        <div class="package-price-note">Set avantajıyla tasarruf edin!</div>
                    </div>
                    <button type="button" class="btn-primary package-add-btn" onclick="addPackageToCart('${pkg.id}')">
                        <i class="fas fa-cart-plus"></i> ${isEn ? 'Buy Set' : 'Paketi Sepete Ekle'}
                    </button>
                </div>`;
        container.appendChild(div);
    });
}

export function adjustPkgQty(pkgId, prodId, delta) {
    const key = `${pkgId}-${prodId}`;
    window.onCardQuantities[key] = Math.max(1, (window.onCardQuantities[key] || 1) + delta);
    const el = document.getElementById(`qty-${key}`);
    if (el) el.textContent = window.onCardQuantities[key];

    const pkg = state.packages.find((p) => String(p.id) === String(pkgId));
    if (!pkg) return;
    let subTotal = 0;
    (pkg.items || '')
        .split(',')
        .map((s) => s.trim())
        .forEach((id) => {
            const p = state.products.find((x) => String(x.id) === id);
            if (p) subTotal += parseFloat(p.price) * (window.onCardQuantities[`${pkgId}-${p.id}`] || 1);
        });
    const priceEl = document.getElementById(`pkg-price-${pkgId}`);
    if (priceEl) priceEl.textContent = formatPkgPrice(subTotal * (1 - (pkg.discount || 0) / 100));
}
