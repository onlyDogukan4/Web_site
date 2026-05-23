import { getCart, setCart, saveCart } from '../cart/store.js';
import { updateCartDisplay } from '../cart/display.js';

// ── Veri ─────────────────────────────────────────
let _products  = [];
    let _packages  = [];
    let _campaigns = [];
    let _lang      = localStorage.getItem('lang') || 'tr';
    let _category  = 'Tümü';
    let _page      = 1;
    const PER_PAGE = 6;
    window.onCardQuantities = {};

    // ── Başlangıç ────────────────────────────────────
    document.addEventListener('DOMContentLoaded', async () => {
        initTheme();
        initLang();
        initSlider();
        initNav();
        initCart();
        initProfile();
        initSearch();
        initDetailModal();
        await loadData();
        renderProducts();
        renderPackages();
        // ── Sepet fiyatlarını güncel ürün verileriyle senkronize et ──────────
        function syncCartPrices() {
            let changed = false;
            let next = getCart().map(item => {
                if (item.isConcept || item.isPackage) return item;
                const product = _products.find(p => String(p.id) === String(item.id));
                if (product) {
                    const newPrice = parseFloat(product.price);
                    if (!isNaN(newPrice) && newPrice !== parseFloat(item.price)) {
                        changed = true;
                        return { ...item, price: newPrice };
                    }
                }
                return item;
            });
            // Paket içindeki ürün fiyatlarını da güncelle
            next = next.map(item => {
                if (!item.isPackage || !Array.isArray(item.packageItems)) return item;
                let pkgChanged = false;
                const newItems = item.packageItems.map(si => {
                    const product = _products.find(p => String(p.id) === String(si.id));
                    if (product) {
                        const newPrice = parseFloat(product.price);
                        if (!isNaN(newPrice) && newPrice !== parseFloat(si.price)) {
                            pkgChanged = true;
                            return { ...si, price: newPrice };
                        }
                    }
                    return si;
                });
                if (pkgChanged) { changed = true; return { ...item, packageItems: newItems }; }
                return item;
            });
            if (changed) {
                setCart(next);
                updateCartDisplay();
            }
        }

        // Admin değişikliklerini anlık takip et: her 8 saniyede last-update kontrol et
        let _lastUpdateTime = null;
        async function checkForUpdates() {
            try {
                const r = await fetch('/api/settings?type=last-update&t=' + Date.now());
                if (!r.ok) return;
                const d = await r.json();
                if (_lastUpdateTime === null) { _lastUpdateTime = d.time; return; }
                if (d.time !== _lastUpdateTime) {
                    _lastUpdateTime = d.time;
                    await loadData();
                    syncCartPrices();
                    renderProducts();
                    renderPackages();
                }
            } catch(e) {}
        }
        setInterval(checkForUpdates, 8000);
    });

    // ── Veri Yükleme ─────────────────────────────────
    async function loadData() {
        try {
            const t = Date.now();
            const [pr, pkr, cr] = await Promise.all([
                fetch(`/api/products?t=${t}`),
                fetch(`/api/packages?t=${t}`),
                fetch(`/api/campaigns?t=${t}`)
            ]);
            const [prods, pkgs, camps] = await Promise.all([pr.json(), pkr.json(), cr.json()]);
            if (Array.isArray(prods) && prods.length) _products  = prods;
            if (Array.isArray(pkgs))                  _packages  = pkgs;
            if (Array.isArray(camps))                 _campaigns = camps;
        } catch (e) {
            console.warn('Veri yükleme hatası:', e.message);
        }
    }

    // ── Slider ───────────────────────────────────────
    function initSlider() {
        const slides = document.querySelector('.slides');
        const dots   = document.querySelectorAll('.slider-dot');
        if (!slides || !dots.length) return;
        let cur = 0;
        const go = i => {
            cur = i;
            slides.style.transform = `translateX(-${cur * 100}%)`;
            dots.forEach((d, idx) => d.classList.toggle('active', idx === cur));
        };
        dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
        setInterval(() => go((cur + 1) % dots.length), 5000);
    }

    // ── Navigasyon ───────────────────────────────────
    function initNav() {
        const path = location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-links a').forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === path);
        });
    }

    // ── Tema ─────────────────────────────────────────
    function initTheme() {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;
        if (localStorage.getItem('theme') === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            btn.classList.replace('fa-moon', 'fa-sun');
        }
        btn.addEventListener('click', () => {
            const dark = document.documentElement.getAttribute('data-theme') === 'dark';
            document.documentElement.toggleAttribute('data-theme', !dark);
            if (!dark) {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                btn.classList.replace('fa-moon', 'fa-sun');
            } else {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                btn.classList.replace('fa-sun', 'fa-moon');
            }
        });
    }

    // ── Dil ──────────────────────────────────────────
    function initLang() {
        applyLang();
        document.getElementById('lang-toggle')?.addEventListener('click', e => {
            e.preventDefault();
            _lang = _lang === 'tr' ? 'en' : 'tr';
            localStorage.setItem('lang', _lang);
            applyLang();
            renderProducts();
            renderPackages();
        });
    }

    function applyLang() {
        const t = document.getElementById('lang-toggle');
        if (t) t.textContent = _lang === 'tr' ? 'EN' : 'TR';
        document.querySelectorAll('[data-tr]').forEach(el => {
            const v = el.getAttribute(`data-${_lang}`);
            if (v) el.textContent = v;
        });
        document.querySelectorAll('[data-tr-placeholder]').forEach(el => {
            const v = _lang === 'tr' ? el.getAttribute('data-tr-placeholder') : el.getAttribute('data-en-placeholder');
            if (v) el.placeholder = v;
        });
    }

    // ── Sepet ────────────────────────────────────────
    function initCart() {
        document.getElementById('open-cart-modal')?.addEventListener('click', () => {
            document.body.classList.add('cart-open');
            updateCartDisplay();
        });
    }

    function flyToCart(imgEl) {
        const dest = document.getElementById('open-cart-modal');
        if (!imgEl || !dest) return;
        const clone = imgEl.cloneNode(true);
        const from  = imgEl.getBoundingClientRect();
        const to    = dest.getBoundingClientRect();
        Object.assign(clone.style, {
            position: 'fixed', left: from.left + 'px', top: from.top + 'px',
            width: from.width + 'px', height: from.height + 'px',
            zIndex: 99999, pointerEvents: 'none', borderRadius: '12px',
            objectFit: 'contain', transition: 'all 0.8s cubic-bezier(0.19,1,0.22,1)'
        });
        document.body.appendChild(clone);
        requestAnimationFrame(() => {
            clone.style.left    = to.left + 'px';
            clone.style.top     = to.top  + 'px';
            clone.style.width   = '24px';
            clone.style.height  = '24px';
            clone.style.opacity = '0.2';
        });
        setTimeout(() => {
            clone.remove();
            dest.style.transform = 'scale(1.35)';
            setTimeout(() => dest.style.transform = '', 200);
        }, 800);
    }

    // Sepete ürün ekle — ürün kartlarındaki butonlar buraya bağlı
    function addToCart(productId, productName, productPrice) {
        const p     = _products.find(x => String(x.id) === String(productId));
        const name  = p?.name_tr  || productName  || 'Ürün';
        const price = parseFloat(p?.price  ?? productPrice);
        const image = p?.image || 'images/bardak.png';
        if (isNaN(price)) return;

        // Uçan animasyon
        const btn = document.querySelector(`.add-to-cart[onclick*="'${productId}'"]`);
        const img = btn?.closest('.product-card')?.querySelector('img');
        if (img) flyToCart(img);

        // Cart array'i cart-system.js tarafından yönetiliyor
        const cartItems = getCart();
        const existing = cartItems.find(i => String(i.id) === String(productId));
        if (existing) {
            existing.quantity++;
        } else {
            cartItems.push({ id: String(productId), name, image, price, quantity: 1 });
        }
        saveCart();
        updateCartDisplay();
    }

    // Paketi sepete ekle
    function addPackageToCart(packageId) {
        const pkg = _packages.find(p => String(p.id) === String(packageId));
        if (!pkg) return;

        const itemIds = (pkg.items || '').split(',').map(s => s.trim());
        const packageItems = itemIds.map(id => {
            const p = _products.find(x => String(x.id) === id);
            if (!p) return null;
            const qty = (window.onCardQuantities[`${packageId}-${p.id}`]) || 1;
            return { id: p.id, name: p.name_tr, price: p.price, image: p.image, quantity: qty };
        }).filter(Boolean);

        const btn = document.querySelector(`button[onclick*="addPackageToCart('${packageId}')"]`);
        const img = btn?.closest('.package-card')?.querySelector('img');
        if (img) flyToCart(img);

        const cartItems = getCart();
        const idx = cartItems.findIndex(x => String(x.id) === String(pkg.id));
        if (idx > -1) {
            if (pkg.name.toLowerCase().includes('süper')) {
                cartItems[idx].packageItems = packageItems;
                cartItems[idx].quantity = 1;
            } else {
                cartItems[idx].quantity++;
            }
        } else {
            cartItems.push({
                id: String(pkg.id), name: pkg.name,
                image: pkg.image || 'images/bardak.png',
                discount: pkg.discount || 0,
                quantity: 1, isPackage: true, packageItems
            });
        }
        saveCart();
        setTimeout(() => {
            updateCartDisplay();
            document.body.classList.add('cart-open');
        }, 800);
    }

    // ── Profil ───────────────────────────────────────
    function initProfile() {
        const modal = document.getElementById('profile-modal');
        document.getElementById('open-profile-modal')?.addEventListener('click', () => modal.style.display = 'block');
        document.querySelector('.profile-close')?.addEventListener('click', () => modal.style.display = 'none');

        document.getElementById('profile-form')?.addEventListener('submit', e => {
            e.preventDefault();
            localStorage.setItem('moderra_user_data', JSON.stringify({
                name:    document.getElementById('user-name').value,
                phone:   document.getElementById('user-phone').value,
                address: document.getElementById('user-address').value
            }));
            modal.style.display = 'none';
        });

        const saved = JSON.parse(localStorage.getItem('moderra_user_data') || '{}');
        if (saved.name)    document.getElementById('user-name').value    = saved.name;
        if (saved.phone)   document.getElementById('user-phone').value   = saved.phone;
        if (saved.address) document.getElementById('user-address').value = saved.address;

        window.addEventListener('click', e => {
            if (e.target === modal) modal.style.display = 'none';
            const dm = document.getElementById('product-detail-modal');
            if (e.target === dm) dm.style.display = 'none';
        });
    }

    // ── Arama ────────────────────────────────────────
    function initSearch() {
        const bar   = document.getElementById('search-bar');
        const input = document.getElementById('search-input');
        const countEl = document.getElementById('search-count');

        function closeSearch() {
            bar.classList.remove('active');
            input.value = '';
            if (countEl) countEl.textContent = '';
            renderProducts();
        }

        document.getElementById('open-search')?.addEventListener('click', () => {
            bar.classList.add('active');
            input.value = '';
            if (countEl) countEl.textContent = '';
            setTimeout(() => input.focus(), 50);
        });

        document.getElementById('close-search')?.addEventListener('click', closeSearch);

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && bar.classList.contains('active')) closeSearch();
        });

        input?.addEventListener('input', () => {
            const term = input.value.toLowerCase().trim();
            const cards = document.querySelectorAll('.product-card');
            let visible = 0;
            cards.forEach(card => {
                const title = card.querySelector('.product-title')?.textContent.toLowerCase() || '';
                const show = !term || title.includes(term);
                card.style.display = show ? '' : 'none';
                if (show) visible++;
            });
            if (countEl) countEl.textContent = term ? `${visible} sonuç` : '';
        });
    }

    // ── Ürün Detay Modalı ────────────────────────────
    function initDetailModal() {
        document.querySelector('.detail-close')?.addEventListener('click', () => {
            document.getElementById('product-detail-modal').style.display = 'none';
        });
    }

    function openProductDetail(id) {
        const p = _products.find(x => String(x.id) === String(id));
        if (!p) return;
        const isEn = _lang === 'en';
        document.getElementById('detail-img').src      = p.image || 'images/bardak.png';
        document.getElementById('detail-title').textContent = isEn ? (p.name_en || p.name_tr) : p.name_tr;
        document.getElementById('detail-price').textContent = '₺' + parseFloat(p.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
        document.getElementById('detail-rating').innerHTML  = ratingStars(parseFloat(p.rating) || 5);
        document.getElementById('detail-desc').textContent  = isEn ? (p.description_en || p.description_tr || '') : (p.description_tr || '');
        document.getElementById('detail-add-btn').onclick = () => {
            addToCart(p.id, p.name_tr, p.price);
            document.getElementById('product-detail-modal').style.display = 'none';
        };
        document.getElementById('product-detail-modal').style.display = 'block';
    }

    function ratingStars(r) {
        let s = '';
        for (let i = 0; i < Math.floor(r); i++) s += '<i class="fas fa-star"></i>';
        if (r % 1 >= 0.5) s += '<i class="fas fa-star-half-alt"></i>';
        const empty = 5 - Math.ceil(r);
        for (let i = 0; i < empty; i++) s += '<i class="far fa-star"></i>';
        return s;
    }

    // ── Ürün Listesi ─────────────────────────────────
    function renderProducts() {
        const container = document.getElementById('products-container');
        if (!container) return;

        const catMap = { active: 'Standart', hot: 'Fırsat', discount: 'İndirimli', oos: 'Stok Dışı' };
        const isEn   = _lang === 'en';

        const filtered = _category === 'Tümü'
            ? _products
            : _products.filter(p => (catMap[p.status] || 'Standart') === _category);

        const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
        if (_page > totalPages) _page = 1;
        const page = filtered.slice((_page - 1) * PER_PAGE, _page * PER_PAGE);

        renderCategoryNav(catMap);
        container.innerHTML = '';

        if (!page.length) {
            container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted);">
                <i class="fas fa-box-open fa-3x" style="opacity:.3;margin-bottom:15px;display:block;"></i>
                Bu kategoride ürün bulunamadı.
            </div>`;
            renderPagination(totalPages);
            return;
        }

        page.forEach(p => {
            const name  = isEn ? (p.name_en || p.name_tr) : p.name_tr;
            const isOOS = p.status === 'oos';
            const camp  = _campaigns.find(c => String(c.id) === String(p.campaign_id));

            let badge = '';
            if (p.status === 'hot' && !camp) badge = `<div class="hot-badge"><i class="fas fa-fire"></i> FIRSAT</div>`;
            if (isOOS) badge = `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-15deg);background:rgba(0,0,0,0.8);color:white;padding:10px 20px;font-weight:900;z-index:30;border-radius:10px;border:2px solid #ef4444;font-size:14px;">TÜKENDİ</div>`;

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
                                onclick="addToCart('${p.id}','${p.name_tr.replace(/'/g,"\\'")}',${p.price})">
                            <i class="fas fa-shopping-cart"></i>
                            ${isOOS ? 'Stok Yok' : (isEn ? 'Add to Cart' : 'Sepete Ekle')}
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

    function renderCategoryNav(catMap) {
        const nav = document.getElementById('product-category-nav');
        if (!nav) return;
        const cats = ['Tümü', ...new Set(_products.map(p => catMap[p.status] || 'Standart'))];
        nav.innerHTML = cats.map(cat => `
            <button onclick="filterCategory('${cat}')" style="
                padding:9px 22px;border-radius:50px;cursor:pointer;font-weight:700;font-size:14px;transition:.2s;
                border:2px solid ${cat === _category ? 'var(--primary)' : 'var(--border)'};
                background:${cat === _category ? 'var(--primary)' : 'transparent'};
                color:${cat === _category ? 'white' : 'var(--text)'};">${cat}
            </button>`).join('');
    }

    function filterCategory(cat) {
        _category = cat;
        _page = 1;
        renderProducts();
    }

    function renderPagination(total) {
        const el = document.getElementById('product-pagination');
        if (!el) return;
        if (total <= 1) { el.innerHTML = ''; return; }
        el.innerHTML = Array.from({ length: total }, (_, i) => i + 1).map(i => `
            <button onclick="_page=${i};renderProducts()" style="
                width:42px;height:42px;border-radius:50%;cursor:pointer;font-weight:800;font-size:15px;transition:.2s;
                border:2px solid ${i === _page ? 'var(--primary)' : 'var(--border)'};
                background:${i === _page ? 'var(--primary)' : 'transparent'};
                color:${i === _page ? 'white' : 'var(--text)'};">${i}
            </button>`).join('');
    }

    function formatPkgPrice(amount) {
        return '₺' + Number(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // ── Paket Listesi ────────────────────────────────
    function renderPackages() {
        const container = document.getElementById('packages-container');
        if (!container) return;
        const isEn   = _lang === 'en';
        const visible = _packages.filter(p => p.published).sort((a, b) => (a.order || 0) - (b.order || 0));

        container.innerHTML = '';
        visible.forEach(pkg => {
            const itemIds = (pkg.items || '').split(',').map(s => s.trim()).filter(Boolean);
            let subTotal  = 0;
            itemIds.forEach(id => {
                const p = _products.find(x => String(x.id) === id);
                if (p) subTotal += parseFloat(p.price);
            });
            const discounted = subTotal * (1 - (pkg.discount || 0) / 100);
            const gridClass = itemIds.length === 3 ? 'package-items-grid items-3' : 'package-items-grid';

            const div = document.createElement('div');
            div.className = 'package-card';
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
                    ${itemIds.map(id => {
                        const p = _products.find(x => String(x.id) === id);
                        if (!p) return '';
                        const key = `${pkg.id}-${p.id}`;
                        const qty = window.onCardQuantities[key] || 1;
                        const label = isEn ? (p.name_en || p.name_tr) : p.name_tr;
                        return `
                            <div class="package-item">
                                <img src="${p.image || 'images/bardak.png'}" alt="">
                                <span class="package-item-name">${label}</span>
                                <div class="package-item-qty">
                                    <button type="button" class="qty-btn" onclick="adjustPkgQty('${pkg.id}','${p.id}',-1)" aria-label="Azalt">−</button>
                                    <span id="qty-${key}">${qty}</span>
                                    <button type="button" class="qty-btn" onclick="adjustPkgQty('${pkg.id}','${p.id}',1)" aria-label="Artır">+</button>
                                </div>
                            </div>`;
                    }).join('')}
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

    function adjustPkgQty(pkgId, prodId, delta) {
        const key = `${pkgId}-${prodId}`;
        window.onCardQuantities[key] = Math.max(1, (window.onCardQuantities[key] || 1) + delta);
        const el = document.getElementById(`qty-${key}`);
        if (el) el.textContent = window.onCardQuantities[key];

        const pkg = _packages.find(p => String(p.id) === String(pkgId));
        if (!pkg) return;
        let subTotal = 0;
        (pkg.items || '').split(',').map(s => s.trim()).forEach(id => {
            const p = _products.find(x => String(x.id) === id);
            if (p) subTotal += parseFloat(p.price) * (window.onCardQuantities[`${pkgId}-${p.id}`] || 1);
        });
        const priceEl = document.getElementById(`pkg-price-${pkgId}`);
        if (priceEl) priceEl.textContent = formatPkgPrice(subTotal * (1 - (pkg.discount || 0) / 100));
    }

    // ── Chatbot için global yardımcılar ──────────────
    window.addToCartByMatch = keyword => {
        const p = _products.find(x => x.name_tr.toLowerCase().includes(keyword.toLowerCase()));
        if (p) { addToCart(p.id, p.name_tr, p.price); return { success: true, name: p.name_tr }; }
        return { success: false };
    };

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
