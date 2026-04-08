// MODERRA SEPET SİSTEMİ
// Tüm sepet işlemleri bu dosyada tanımlıdır.

let cart = JSON.parse(localStorage.getItem('cart') || '[]');

// ── Yardımcılar ─────────────────────────────────────────────────────────────

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function getSettings() {
    try {
        const s = localStorage.getItem('settings');
        if (s) return JSON.parse(s);
    } catch (e) {}
    return { minOrder: 500, freeShipping: 1000 };
}

function calculateCartTotal() {
    let subTotal = 0;
    let discountTotal = 0;

    cart.forEach(item => {
        if (item.isPackage) {
            const itemBase = item.packageItems.reduce(
                (acc, si) => acc + parseFloat(si.price) * si.quantity, 0
            );
            subTotal += itemBase * item.quantity;
            discountTotal += itemBase * item.quantity * ((item.discount || 0) / 100);
        } else {
            subTotal += parseFloat(item.price) * item.quantity;
        }
    });

    return { subTotal, discountTotal, total: subTotal - discountTotal };
}

// ── Animasyon ────────────────────────────────────────────────────────────────

function flyToCart(imgElement) {
    if (!imgElement) return;
    const cartIcon = document.getElementById('open-cart-modal');
    if (!cartIcon) return;

    const flyImg = imgElement.cloneNode(true);
    const rect = imgElement.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    Object.assign(flyImg.style, {
        position: 'fixed',
        left: rect.left + 'px',
        top: rect.top + 'px',
        width: '80px',
        height: '80px',
        zIndex: '100000',
        pointerEvents: 'none',
        transition: 'all 0.75s cubic-bezier(0.19, 1, 0.22, 1)',
        borderRadius: '12px',
        objectFit: 'contain'
    });

    document.body.appendChild(flyImg);

    requestAnimationFrame(() => {
        flyImg.style.transform = `translate(${cartRect.left - rect.left}px, ${cartRect.top - rect.top}px) scale(0.1)`;
        flyImg.style.opacity = '0.4';
    });

    setTimeout(() => {
        flyImg.remove();
        cartIcon.classList.add('shake');
        setTimeout(() => cartIcon.classList.remove('shake'), 500);
    }, 750);
}

function showVIPToast(itemName) {
    const existing = document.getElementById('vip-cart-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'vip-cart-toast';
    toast.style.cssText = `
        position:fixed; bottom:30px; left:50%; transform:translateX(-50%) translateY(80px);
        background:linear-gradient(135deg,#1a1a2e,#16213e);
        color:white; padding:16px 24px; border-radius:18px;
        z-index:999999; opacity:0;
        transition:all 0.45s cubic-bezier(0.34,1.56,0.64,1);
        border:1px solid rgba(212,175,55,0.4);
        box-shadow:0 20px 60px rgba(0,0,0,0.4);
        min-width:280px; max-width:90vw;
        display:flex; align-items:center; gap:14px;
    `;
    toast.innerHTML = `
        <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#b8860b,#ffd700);
                    display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <i class="fas fa-crown" style="color:#1a0e00;font-size:16px;"></i>
        </div>
        <div>
            <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#ffd700;margin-bottom:2px;">VIP SEPETE EKLENDİ</div>
            <div style="font-size:14px;font-weight:900;">${itemName}</div>
            <div style="font-size:11px;opacity:0.6;margin-top:2px;">Özel logo siparişiniz alındı ✓</div>
        </div>
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(80px)';
        setTimeout(() => toast.remove(), 450);
    }, 4000);
}

// ── Sepet Gösterimi ──────────────────────────────────────────────────────────

function updateCartDisplay() {
    const list = document.getElementById('cart-items-list');
    const cartCount = document.getElementById('cart-count');
    const checkoutBtn = document.getElementById('whatsapp-checkout');
    if (!list) return;

    const { minOrder, freeShipping } = getSettings();
    const { subTotal, discountTotal, total } = calculateCartTotal();

    // İlerleme çubuğu
    const sticky = document.getElementById('cart-progress-sticky');
    if (sticky) {
        if (total === 0) {
            sticky.innerHTML = '';
        } else if (total < minOrder) {
            const pct = Math.min((total / minOrder) * 100, 100);
            sticky.innerHTML = `
                <div style="padding:14px 20px;background:linear-gradient(135deg,#fff1f2,#ffe4e6);border-bottom:1px solid #fecdd3;">
                    <div style="font-size:12px;color:#9f1239;font-weight:800;display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span>⚠️ Minimum sipariş için eksik</span>
                        <span>₺${(minOrder - total).toLocaleString('tr-TR')}</span>
                    </div>
                    <div style="width:100%;height:6px;background:#fecdd3;border-radius:10px;overflow:hidden;">
                        <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#f43f5e,#e11d48);border-radius:10px;transition:width 0.5s;"></div>
                    </div>
                </div>`;
        } else if (total < freeShipping) {
            const pct = Math.min((total / freeShipping) * 100, 100);
            sticky.innerHTML = `
                <div style="padding:14px 20px;background:linear-gradient(135deg,#fefce8,#fef9c3);border-bottom:1px solid #fde047;">
                    <div style="font-size:12px;color:#854d0e;font-weight:800;display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span>🚀 Ücretsiz kargo için eksik</span>
                        <span>₺${(freeShipping - total).toLocaleString('tr-TR')}</span>
                    </div>
                    <div style="width:100%;height:6px;background:rgba(0,0,0,0.1);border-radius:10px;overflow:hidden;">
                        <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#f59e0b,#d97706);border-radius:10px;transition:width 0.5s;"></div>
                    </div>
                </div>`;
        } else {
            sticky.innerHTML = `
                <div style="padding:14px 20px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-bottom:1px solid #bbf7d0;text-align:center;">
                    <span style="font-size:14px;color:#166534;font-weight:900;">🎉 KARGO BİZDEN! Ücretsiz teslimat kazandınız.</span>
                </div>`;
        }
    }

    // Ürün listesi
    list.innerHTML = '';

    if (cart.length === 0) {
        list.innerHTML = `
            <div style="text-align:center;padding:80px 20px;color:#cbd5e1;">
                <div style="font-size:60px;margin-bottom:16px;">🛒</div>
                <p style="font-weight:800;font-size:15px;color:#94a3b8;">Sepetiniz boş</p>
                <p style="font-size:13px;color:#cbd5e1;margin-top:6px;">Ürünleri keşfetmek için alışverişe başlayın</p>
            </div>`;
        if (cartCount) cartCount.style.display = 'none';
        if (checkoutBtn) checkoutBtn.style.display = 'none';
        _renderSummary(0, 0, 0);
        return;
    }

    cart.forEach(item => {
        const el = document.createElement('div');
        el.className = 'cart-item-card' + (item.isConcept ? ' vip-concept-frame' : '');

        if (item.isPackage) {
            const itemTotal = item.packageItems.reduce(
                (acc, si) => acc + parseFloat(si.price) * si.quantity, 0
            ) * (1 - (item.discount || 0) / 100) * item.quantity;

            el.innerHTML = `
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;">
                    <div style="display:flex;gap:12px;flex:1;">
                        <img src="${item.image || 'images/bardak.png'}" style="width:64px;height:64px;object-fit:contain;border-radius:12px;background:#f8fafc;padding:6px;border:1px solid #e2e8f0;flex-shrink:0;" loading="lazy">
                        <div>
                            <div style="font-weight:900;font-size:14px;color:#1e293b;line-height:1.3;">${item.name}</div>
                            <div style="font-size:11px;color:#64748b;margin-top:3px;">${item.packageItems ? item.packageItems.length + ' ürün' : ''} · %${item.discount || 0} indirim</div>
                            <div class="qty-ctrl" style="margin-top:10px;display:inline-flex;align-items:center;gap:8px;background:#f8fafc;border-radius:10px;padding:3px 8px;border:1px solid #e2e8f0;">
                                <button class="qty-btn" onclick="updateItemQuantity('${item.id}',-1)">−</button>
                                <span style="font-weight:900;font-size:14px;min-width:24px;text-align:center;">${item.quantity}</span>
                                <button class="qty-btn" onclick="updateItemQuantity('${item.id}',1)">+</button>
                            </div>
                        </div>
                    </div>
                    <div style="text-align:right;flex-shrink:0;">
                        <div style="font-size:17px;font-weight:900;color:var(--primary);">₺${itemTotal.toLocaleString('tr-TR',{minimumFractionDigits:2})}</div>
                        <button onclick="removeFromCart('${item.id}')" class="trash-btn">🗑</button>
                    </div>
                </div>`;
        } else if (item.isConcept) {
            const itemTotal = parseFloat(item.price) * item.quantity;
            el.innerHTML = `
                <div class="vip-badge"><i class="fas fa-crown"></i> VIP ÖZEL LOGO</div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:10px;">
                    <div style="display:flex;align-items:center;gap:12px;flex:1;">
                        <div style="width:68px;height:68px;border-radius:16px;background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid rgba(212,175,55,0.4);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
                            <img src="${item.image || 'images/bardak.png'}" style="width:100%;height:100%;object-fit:contain;padding:6px;" loading="lazy">
                        </div>
                        <div style="flex:1;min-width:0;">
                            <div style="font-weight:900;font-size:14px;color:#1a1a1a;margin-bottom:4px;">${item.name}</div>
                            ${item.note ? `<div style="font-size:11px;color:#7c5f00;background:#fffbeb;padding:5px 9px;border-radius:8px;margin-bottom:6px;border-left:3px solid #d4af37;font-style:italic;">"${item.note}"</div>` : ''}
                            <div class="qty-ctrl" style="display:inline-flex;align-items:center;gap:8px;background:#fffbeb;border-radius:10px;padding:3px 8px;border:1px solid rgba(212,175,55,0.3);">
                                <button class="qty-btn" onclick="updateItemQuantity('${item.id}',-1)">−</button>
                                <span style="font-weight:900;font-size:14px;min-width:24px;text-align:center;color:#b8860b;">${item.quantity}</span>
                                <button class="qty-btn" onclick="updateItemQuantity('${item.id}',1)">+</button>
                            </div>
                        </div>
                    </div>
                    <div style="text-align:right;flex-shrink:0;">
                        <div style="font-size:18px;font-weight:900;background:linear-gradient(135deg,#b8860b,#d4af37);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">₺${itemTotal.toLocaleString('tr-TR',{minimumFractionDigits:2})}</div>
                        <button onclick="removeFromCart('${item.id}')" class="trash-btn">🗑</button>
                    </div>
                </div>`;
        } else {
            const itemTotal = parseFloat(item.price) * item.quantity;
            el.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
                    <div style="display:flex;align-items:center;gap:12px;flex:1;">
                        <img src="${item.image || 'images/bardak.png'}" style="width:64px;height:64px;object-fit:contain;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;padding:6px;flex-shrink:0;" loading="lazy">
                        <div style="flex:1;min-width:0;">
                            <div style="font-weight:800;font-size:14px;color:#1e293b;line-height:1.3;margin-bottom:8px;">${item.name}</div>
                            <div class="qty-ctrl" style="display:inline-flex;align-items:center;gap:8px;background:#f8fafc;border-radius:10px;padding:3px 8px;border:1px solid #e2e8f0;">
                                <button class="qty-btn" onclick="updateItemQuantity('${item.id}',-1)">−</button>
                                <span style="font-weight:900;font-size:14px;min-width:24px;text-align:center;">${item.quantity}</span>
                                <button class="qty-btn" onclick="updateItemQuantity('${item.id}',1)">+</button>
                            </div>
                        </div>
                    </div>
                    <div style="text-align:right;flex-shrink:0;">
                        <div style="font-size:17px;font-weight:900;color:var(--primary);">₺${itemTotal.toLocaleString('tr-TR',{minimumFractionDigits:2})}</div>
                        <button onclick="removeFromCart('${item.id}')" class="trash-btn">🗑</button>
                    </div>
                </div>`;
        }

        list.appendChild(el);
    });

    _renderSummary(subTotal, discountTotal, total);

    const totalCount = cart.reduce((s, i) => s + i.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalCount;
        cartCount.style.display = totalCount > 0 ? 'flex' : 'none';
    }
    if (checkoutBtn) checkoutBtn.style.display = 'flex';
}

function _renderSummary(subTotal, discountTotal, total) {
    const area = document.getElementById('cart-total-price-area');
    if (!area) return;
    area.innerHTML = `
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#64748b;font-size:13px;">
            <span>Ara Toplam</span>
            <span>₺${subTotal.toLocaleString('tr-TR',{minimumFractionDigits:2})}</span>
        </div>
        ${discountTotal > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#16a34a;font-size:13px;font-weight:700;">
            <span>🎁 İndirim</span>
            <span>−₺${discountTotal.toLocaleString('tr-TR',{minimumFractionDigits:2})}</span>
        </div>` : ''}
        <div style="display:flex;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:2px dashed #e2e8f0;align-items:center;">
            <span style="font-weight:800;font-size:17px;color:#0f172a;">TOPLAM</span>
            <span style="font-weight:900;font-size:22px;color:var(--primary);">₺${total.toLocaleString('tr-TR',{minimumFractionDigits:2})}</span>
        </div>`;
}

// ── Sepet İşlemleri ──────────────────────────────────────────────────────────

function addToCart(idOrItem, name, price, isConcept = false) {
    let item = idOrItem;
    if (typeof idOrItem === 'string' || typeof idOrItem === 'number') {
        item = { id: String(idOrItem), name, price: parseFloat(price), quantity: 1, isConcept };
    } else {
        item = { ...item };
        if (isConcept) item.isConcept = true;
        if (!item.quantity) item.quantity = 1;
    }

    const existing = cart.find(x => x.id === item.id);
    if (existing) {
        existing.quantity += (item.quantity || 1);
    } else {
        cart.push(item);
    }

    saveCart();
    updateCartDisplay();

    if (item.isConcept) showVIPToast(item.name);
}

function addToCartConcept(item) {
    addToCart(item, null, null, true);
}

async function addPackageToCart(packageId) {
    try {
        const [pkgRes, prodRes] = await Promise.all([
            fetch('/api/packages'),
            fetch('/api/products')
        ]);
        const packages = await pkgRes.json();
        const products = await prodRes.json();

        const pkg = packages.find(p => String(p.id) === String(packageId));
        if (!pkg) return;

        const itemIds = (pkg.items || '').split(',').map(id => id.trim()).filter(Boolean);
        const packageItems = itemIds.reduce((acc, id) => {
            const p = products.find(x => String(x.id) === id);
            if (p) {
                const qty = (window.onCardQuantities || {})[`${packageId}-${p.id}`] || 1;
                acc.push({ id: p.id, name: p.name_tr, price: p.price, image: p.image, quantity: qty });
            }
            return acc;
        }, []);

        // Uçan animasyon
        const card = document.querySelector(`button[onclick*="addPackageToCart('${packageId}')"]`)?.closest('.package-card');
        const img = card ? card.querySelector('img') : null;
        if (img) flyToCart(img);

        const existingIdx = cart.findIndex(x => String(x.id) === String(pkg.id));
        const isUnique = (pkg.name || '').toLowerCase().includes('süper');

        if (existingIdx > -1) {
            if (isUnique) {
                cart[existingIdx].packageItems = packageItems;
                cart[existingIdx].quantity = 1;
            } else {
                cart[existingIdx].quantity++;
            }
        } else {
            cart.push({
                id: String(pkg.id),
                name: pkg.name,
                image: pkg.image || 'images/bardak.png',
                discount: pkg.discount || 0,
                quantity: 1,
                isPackage: true,
                packageItems
            });
        }

        saveCart();

        setTimeout(() => {
            updateCartDisplay();
            const cartModal = document.getElementById('cart-modal');
            if (cartModal) {
                cartModal.style.display = 'block';
                document.body.classList.add('cart-open');
            }
        }, 800);
    } catch (e) {
        console.error('addPackageToCart hatası:', e);
    }
}

function updateSubItemQuantity(pkgId, subId, delta) {
    const pkg = cart.find(x => String(x.id) === String(pkgId));
    if (!pkg || !pkg.packageItems) return;
    const sub = pkg.packageItems.find(si => String(si.id) === String(subId));
    if (!sub) return;
    sub.quantity = Math.max(1, sub.quantity + delta);
    saveCart();
    updateCartDisplay();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartDisplay();
}

function updateItemQuantity(id, change) {
    const item = cart.find(x => x.id === id);
    if (!item) return;
    item.quantity = Math.max(0, item.quantity + change);
    if (item.quantity === 0) {
        removeFromCart(id);
    } else {
        saveCart();
        updateCartDisplay();
    }
}

function whatsappCheckout() {
    const { minOrder } = getSettings();
    const { total } = calculateCartTotal();

    if (total < minOrder) {
        alert(`Minimum sipariş tutarı ₺${minOrder.toLocaleString('tr-TR')} TL'dir.`);
        return;
    }

    const user = JSON.parse(localStorage.getItem('moderra_user_data') || '{}');
    if (!user.name || !user.phone || !user.address) {
        alert('Lütfen sipariş için profil bilgilerinizi doldurun.');
        const pm = document.getElementById('profile-modal');
        if (pm) pm.style.display = 'block';
        return;
    }

    let msg = '*Moderra — Yeni Sipariş*\n\n';
    cart.forEach(item => {
        const lineTotal = item.isPackage
            ? item.packageItems.reduce((a, si) => a + parseFloat(si.price) * si.quantity, 0)
              * (1 - (item.discount || 0) / 100) * item.quantity
            : parseFloat(item.price) * item.quantity;
        msg += `📦 ${item.quantity}× ${item.name} — ₺${lineTotal.toLocaleString('tr-TR', {minimumFractionDigits:2})}\n`;
        if (item.note) msg += `   └ 📝 ${item.note}\n`;
        if (item.isConcept) msg += `   └ ✨ VIP Özel Logo Tasarım\n`;
    });
    msg += `\n*💰 Toplam: ₺${total.toLocaleString('tr-TR', {minimumFractionDigits:2})}*\n\n`;
    msg += `👤 ${user.name}\n📞 ${user.phone}\n🏠 ${user.address}`;

    window.open(`https://wa.me/905304640120?text=${encodeURIComponent(msg)}`, '_blank');
}

// ── Cross-tab senkronizasyonu ────────────────────────────────────────────────

window.addEventListener('storage', e => {
    if (e.key === 'cart') {
        cart = JSON.parse(e.newValue || '[]');
        updateCartDisplay();
    }
});

// ── Stiller ─────────────────────────────────────────────────────────────────

(function injectStyles() {
    if (document.getElementById('moderra-cart-styles')) return;
    const s = document.createElement('style');
    s.id = 'moderra-cart-styles';
    s.textContent = `
        .cart-item-card {
            background: white;
            border-radius: 18px;
            padding: 16px;
            margin-bottom: 12px;
            border: 1px solid #f1f5f9;
            transition: all 0.25s ease;
            position: relative;
            overflow: visible;
        }
        .cart-item-card:hover {
            border-color: #c7d2fe;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.06);
        }
        .vip-concept-frame {
            background: linear-gradient(#fffdf5,#fffdf5) padding-box,
                        linear-gradient(135deg,#b8860b,#ffd700,#daa520,#ffd700,#b8860b) border-box !important;
            border: 2px solid transparent !important;
            box-shadow: 0 8px 28px rgba(212,175,55,0.22) !important;
        }
        .vip-badge {
            position: absolute;
            top: -11px; left: 14px;
            background: linear-gradient(135deg,#b8860b,#ffd700,#daa520);
            color: #1a0e00;
            padding: 3px 12px;
            border-radius: 30px;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            z-index: 10;
            box-shadow: 0 4px 12px rgba(180,135,0,0.35);
            border: 1px solid rgba(255,255,255,0.5);
            display: flex; align-items: center; gap: 5px;
        }
        .qty-btn {
            background: #f1f5f9;
            border: none;
            border-radius: 7px;
            cursor: pointer;
            font-weight: 900;
            font-size: 15px;
            width: 26px; height: 26px;
            display: flex; align-items: center; justify-content: center;
            color: #1e293b;
            transition: all 0.2s;
        }
        .qty-btn:hover { background: var(--primary,#6366f1); color: white; }
        .trash-btn {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 15px;
            margin-top: 8px;
            padding: 4px;
            border-radius: 6px;
            opacity: 0.5;
            transition: opacity 0.2s;
            display: block;
            margin-left: auto;
        }
        .trash-btn:hover { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Global erişim ────────────────────────────────────────────────────────────

window.addToCart = addToCart;
window.addToCartConcept = addToCartConcept;
window.addPackageToCart = addPackageToCart;
window.updateSubItemQuantity = updateSubItemQuantity;
window.removeFromCart = removeFromCart;
window.updateItemQuantity = updateItemQuantity;
window.whatsappCheckout = whatsappCheckout;
window.flyToCart = flyToCart;
window.updateCartDisplay = updateCartDisplay;
window.calculateCartTotal = calculateCartTotal;
