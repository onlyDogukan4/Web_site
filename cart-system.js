// MODERRA SEPET SİSTEMİ

let cart = (JSON.parse(localStorage.getItem('cart') || '[]')).map(item => ({
    ...item,
    price: (isNaN(parseFloat(item.price)) || parseFloat(item.price) <= 0) ? 15.0 : parseFloat(item.price)
}));

// ── Yardımcılar ─────────────────────────────────────────────────────────────

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function getSettings() {
    try {
        const s = localStorage.getItem('moderra_settings') || localStorage.getItem('settings');
        if (s) return JSON.parse(s);
    } catch (e) {}
    return { minOrder: 500, freeShipping: 1000 };
}

async function fetchSettingsFromServer() {
    try {
        const res = await fetch('/api/settings?t=' + Date.now());
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('moderra_settings', JSON.stringify(data));
            if (typeof updateCartDisplay === 'function') updateCartDisplay();
        }
    } catch (e) { console.warn('Ayarlar sunucudan alınamadı:', e); }
}
// Sayfa yüklendiğinde ayarları tazele
fetchSettingsFromServer();
setInterval(fetchSettingsFromServer, 60000);

function calculateCartTotal() {
    let subTotal = 0;
    let discountTotal = 0;
    cart.forEach(item => {
        const itemPrice = parseFloat(item.price) || 0;
        if (item.isPackage && Array.isArray(item.packageItems)) {
            const base = item.packageItems.reduce((a, si) => a + (parseFloat(si.price) || 0) * (si.quantity || 1), 0);
            subTotal += base * (item.quantity || 1);
            discountTotal += base * (item.quantity || 1) * ((parseFloat(item.discount) || 0) / 100);
        } else {
            subTotal += itemPrice * (item.quantity || 1);
        }
    });
    const total = Math.max(0, subTotal - discountTotal);
    return { subTotal, discountTotal, total };
}

// ── VIP Toast Bildirimi ──────────────────────────────────────────────────────

function showVIPToast(itemName) {
    const existing = document.getElementById('vip-toast-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'vip-toast-overlay';
    overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 999999;
        display: flex; align-items: center; justify-content: center;
        pointer-events: none;
    `;

    overlay.innerHTML = `
        <div id="vip-toast-card" style="
            background: linear-gradient(145deg, #0f0c29, #1a1040, #24243e);
            border: 2px solid rgba(212,175,55,0.6);
            border-radius: 28px;
            padding: 40px 50px;
            text-align: center;
            box-shadow: 0 0 60px rgba(212,175,55,0.3), 0 30px 60px rgba(0,0,0,0.5);
            opacity: 0;
            transform: scale(0.8) translateY(30px);
            transition: all 0.5s cubic-bezier(0.34,1.56,0.64,1);
            min-width: 340px;
            max-width: 90vw;
            position: relative;
            overflow: hidden;
        ">
            <!-- Shimmer arka plan -->
            <div style="
                position: absolute; inset: 0;
                background: linear-gradient(105deg, transparent 40%, rgba(212,175,55,0.07) 50%, transparent 60%);
                animation: vip-shimmer 2.5s infinite;
                pointer-events: none;
            "></div>

            <!-- Köşe süsleme -->
            <div style="position:absolute;top:12px;left:18px;color:rgba(212,175,55,0.4);font-size:18px;">✦</div>
            <div style="position:absolute;top:12px;right:18px;color:rgba(212,175,55,0.4);font-size:18px;">✦</div>
            <div style="position:absolute;bottom:12px;left:18px;color:rgba(212,175,55,0.4);font-size:14px;">✦</div>
            <div style="position:absolute;bottom:12px;right:18px;color:rgba(212,175,55,0.4);font-size:14px;">✦</div>

            <!-- Crown ikonu -->
            <div style="
                width: 80px; height: 80px; border-radius: 50%;
                background: linear-gradient(135deg, #b8860b, #ffd700, #daa520);
                display: flex; align-items: center; justify-content: center;
                margin: 0 auto 20px;
                box-shadow: 0 0 30px rgba(212,175,55,0.5);
                animation: vip-pulse 1.5s ease-in-out infinite;
            ">
                <i class="fas fa-crown" style="color:#1a0e00; font-size:34px;"></i>
            </div>

            <!-- Başlık -->
            <div style="
                font-size: 11px; font-weight: 800; letter-spacing: 3px;
                color: #d4af37; margin-bottom: 10px; text-transform: uppercase;
            ">✦ VIP Premium Siparişe Eklendi ✦</div>

            <!-- Ürün adı -->
            <div style="
                font-size: 20px; font-weight: 900; color: white;
                margin-bottom: 8px; line-height: 1.3;
            ">${itemName}</div>

            <div style="
                font-size: 13px; color: rgba(212,175,55,0.8);
                font-style: italic; margin-bottom: 24px;
            ">Özel tasarımınız sepete eklendi</div>

            <!-- İlerleme çubuğu -->
            <div style="width:100%; height:3px; background:rgba(255,255,255,0.1); border-radius:10px; overflow:hidden;">
                <div id="vip-toast-bar" style="
                    height:100%;
                    background: linear-gradient(90deg, #b8860b, #ffd700);
                    width: 100%;
                    border-radius: 10px;
                    transition: width 3s linear;
                "></div>
            </div>
        </div>

        <style>
            @keyframes vip-shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
            }
            @keyframes vip-pulse {
                0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(212,175,55,0.5); }
                50% { transform: scale(1.08); box-shadow: 0 0 50px rgba(212,175,55,0.8); }
            }
        </style>
    `;

    document.body.appendChild(overlay);

    // Giriş animasyonu
    requestAnimationFrame(() => {
        const card = document.getElementById('vip-toast-card');
        if (card) {
            card.style.opacity = '1';
            card.style.transform = 'scale(1) translateY(0)';
        }
        // Progress bar'ı sıfırla
        setTimeout(() => {
            const bar = document.getElementById('vip-toast-bar');
            if (bar) bar.style.width = '0%';
        }, 100);
    });

    // Kapatma
    setTimeout(() => {
        const card = document.getElementById('vip-toast-card');
        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9) translateY(-20px)';
        }
        setTimeout(() => overlay.remove(), 500);
    }, 3200);
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

        if (item.isPackage) {
            el.className = 'cart-item-card';
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
            // ── VIP Premium Konsept Ürün ──────────────────────────────
            const itemTotal = (parseFloat(item.price) || 0) * (item.quantity || 1);
            el.style.cssText = `
                background: linear-gradient(145deg, #fffdf5, #fef9e7);
                border-radius: 20px;
                margin-bottom: 14px;
                border: 2px solid transparent;
                background-clip: padding-box;
                position: relative;
                overflow: visible;
                box-shadow: 0 8px 32px rgba(212,175,55,0.2);
            `;

            // Dış altın çerçeve için pseudo-element yerine wrapper
            el.style.background = 'linear-gradient(145deg, #fffdf5, #fef9e7)';
            el.style.outline = '2px solid #d4af37';
            el.style.outlineOffset = '0px';
            el.style.borderRadius = '20px';
            el.style.marginBottom = '14px';
            el.style.position = 'relative';
            el.style.overflow = 'visible';
            el.style.boxShadow = '0 8px 32px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.8)';

            const isPDF = item.logo && item.logo.startsWith('data:application/pdf');
            const logoHTML = item.logo
                ? `<div style="margin-top:10px;">
                    <div style="font-size:10px;font-weight:800;color:#b8860b;margin-bottom:4px;text-transform:uppercase;"><i class="fas fa-check-circle" style="color:#22c55e;"></i> Yüklenen Dosya:</div>
                    ${isPDF
                        ? `<div style="display:flex;align-items:center;gap:6px;background:rgba(239,68,68,0.1);border-radius:8px;padding:6px 10px;border:1px solid rgba(239,68,68,0.3);">
                               <i class="fas fa-file-pdf" style="color:#ef4444;font-size:18px;"></i>
                               <span style="font-size:11px;color:#d4af37;word-break:break-all;">${item.logoName || 'logo.pdf'}</span>
                           </div>`
                        : `<img src="${item.logo}" style="max-width:80px;max-height:50px;object-fit:contain;border-radius:8px;border:1px solid rgba(212,175,55,0.3);">`
                    }
                   </div>`
                : `<div style="margin-top:8px;font-size:10px;color:#d4af37;font-style:italic;"><i class="fas fa-upload"></i> Logo henüz yüklenmedi</div>`;

            el.innerHTML = `
                <!-- VIP Başlık Şeridi — Her zaman görünür, taşmaz -->
                <div style="
                    background: linear-gradient(90deg, #b8860b, #daa520, #ffd700, #daa520, #b8860b);
                    border-radius: 16px 16px 0 0;
                    padding: 8px 16px;
                    display: flex; align-items: center; gap: 8px;
                    margin: -2px -2px 0 -2px;
                ">
                    <i class="fas fa-crown" style="color:#1a0e00;font-size:14px;"></i>
                    <span style="font-size:10px;font-weight:900;letter-spacing:2px;color:#1a0e00;text-transform:uppercase;">VIP Premium Özel Sipariş</span>
                    <span style="margin-left:auto;font-size:10px;color:rgba(26,14,0,0.7);">✦</span>
                </div>

                <!-- İçerik -->
                <div style="padding:14px 16px 16px;">
                    <div style="display:flex;align-items:flex-start;gap:14px;">
                        <!-- Ürün görseli -->
                        <div style="
                            width:72px;height:72px;border-radius:14px;
                            background:linear-gradient(135deg,#fffbeb,#fef3c7);
                            border:2px solid rgba(212,175,55,0.4);
                            display:flex;align-items:center;justify-content:center;
                            overflow:hidden;flex-shrink:0;
                        ">
                            <img src="${item.image || 'images/bardak.png'}" style="width:100%;height:100%;object-fit:contain;padding:6px;" loading="lazy">
                        </div>

                        <!-- Bilgiler -->
                        <div style="flex:1;min-width:0;">
                            <div style="font-weight:900;font-size:15px;color:#1a1a1a;margin-bottom:4px;line-height:1.3;">${item.name}</div>

                            ${item.note ? `
                            <div style="
                                font-size:11px;color:#7c5f00;background:#fffbeb;
                                padding:6px 10px;border-radius:8px;margin-bottom:8px;
                                border-left:3px solid #d4af37;font-style:italic;
                            ">"${item.note}"</div>` : ''}

                            ${logoHTML}

                            <!-- Adet kontrolü -->
                            <div style="
                                display:inline-flex;align-items:center;gap:8px;
                                background:#fffbeb;border-radius:10px;padding:4px 10px;
                                border:1px solid rgba(212,175,55,0.4);margin-top:10px;
                            ">
                                <button class="qty-btn" onclick="updateItemQuantity('${item.id}',-1)" style="background:rgba(212,175,55,0.2);">−</button>
                                <span style="font-weight:900;font-size:15px;min-width:24px;text-align:center;color:#b8860b;">${item.quantity}</span>
                                <button class="qty-btn" onclick="updateItemQuantity('${item.id}',1)" style="background:rgba(212,175,55,0.2);">+</button>
                            </div>
                        </div>

                        <!-- Fiyat + Sil -->
                        <div style="text-align:right;flex-shrink:0;">
                            <div style="
                                font-size:20px;font-weight:900;
                                background:linear-gradient(135deg,#b8860b,#d4af37);
                                -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                                background-clip:text;
                            ">₺${itemTotal.toLocaleString('tr-TR',{minimumFractionDigits:2})}</div>
                            <div style="font-size:10px;color:#b8860b;margin-top:2px;">adet başına</div>
                            <button onclick="removeFromCart('${item.id}')" style="
                                background:none;border:none;cursor:pointer;font-size:16px;
                                opacity:0.5;transition:opacity 0.2s;display:block;margin:8px 0 0 auto;
                            " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.5'">🗑</button>
                        </div>
                    </div>
                </div>`;

        } else {
            el.className = 'cart-item-card';
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

function getShippingFee(productTotal) {
    const { freeShipping } = getSettings();
    return productTotal < freeShipping ? 150 : 0;
}

function _renderSummary(subTotal, discountTotal, total) {
    const area = document.getElementById('cart-total-price-area');
    if (!area) return;
    const shipping  = getShippingFee(total);
    const grandTotal = total + shipping;
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
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:${shipping > 0 ? '#dc2626' : '#16a34a'};font-size:13px;font-weight:700;">
            <span>${shipping > 0 ? '🚚 Kargo' : '🎉 Kargo (Ücretsiz)'}</span>
            <span>${shipping > 0 ? '₺' + shipping.toLocaleString('tr-TR') : 'Ücretsiz'}</span>
        </div>
            <div style="display:flex;justify-content:space-between;color:var(--primary);font-weight:900;font-size:18px;margin-top:10px;padding-top:10px;border-top:2px solid #f1f5f9;">
                <span>TOPLAM</span>
                <span style="font-weight:900;font-size:22px;color:var(--primary);">₺${grandTotal.toLocaleString('tr-TR',{minimumFractionDigits:2})}</span>
            </div>
            <div id="checkout-options" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:20px;">
                <button onclick="whatsappCheckout()" style="padding:16px; border-radius:15px; background:linear-gradient(135deg,#22c55e,#16a34a); border:none; cursor:pointer; color:white; font-size:13px; font-weight:800; display:flex; flex-direction:column; align-items:center; gap:5px;">
                    <i class="fab fa-whatsapp" style="font-size:20px;"></i> WHATSAPP
                </button>
                <button onclick="payWithPayTR()" style="padding:16px; border-radius:15px; background:linear-gradient(135deg,#6366f1,#4f46e5); border:none; cursor:pointer; color:white; font-size:13px; font-weight:800; display:flex; flex-direction:column; align-items:center; gap:5px;">
                    <i class="fas fa-credit-card" style="font-size:20px;"></i> KREDİ KARTI
                </button>
            </div>
`;
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

    if (item.isConcept) {
        if (typeof showVIPToast === 'function') showVIPToast(item.name);
    }
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
    } catch (e) {
        console.error('addPackageToCart hatası:', e);
    }
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

    const shipping   = getShippingFee(total);
    const grandTotal = total + shipping;

    let msg = '*Moderra — Yeni Sipariş*\n\n';
    cart.forEach(item => {
        const itemQty = item.quantity || 1;
        const lineTotal = item.isPackage
            ? item.packageItems.reduce((a, si) => a + (parseFloat(si.price) || 0) * (si.quantity || 1), 0)
              * (1 - (parseFloat(item.discount) || 0) / 100) * itemQty
            : (parseFloat(item.price) || 0) * itemQty;
        msg += `📦 ${item.quantity}× ${item.name} — ₺${lineTotal.toLocaleString('tr-TR', {minimumFractionDigits:2})}\n`;
        if (item.note) msg += `   └ 📝 Not: ${item.note}\n`;
        if (item.isConcept) msg += `   └ 👑 VIP Premium Özel Tasarım\n`;
        if (item.logo) msg += `   └ 🖼️ Logo yüklendi (WhatsApp üzerinden iletilecek)\n`;
    });
    if (shipping > 0) msg += `\n🚚 Kargo: ₺${shipping.toLocaleString('tr-TR')}\n`;
    msg += `\n*💰 Toplam: ₺${grandTotal.toLocaleString('tr-TR', {minimumFractionDigits:2})}*\n\n`;
    msg += `👤 ${user.name}\n📞 ${user.phone}\n🏠 ${user.address}`;

    window.open(`https://wa.me/905304640120?text=${encodeURIComponent(msg)}`, '_blank');
}

// Cross-tab senkronizasyon
window.addEventListener('storage', e => {
    if (e.key === 'cart') {
        cart = JSON.parse(e.newValue || '[]');
        updateCartDisplay();
    }
});

// Stiller
(function injectStyles() {
    if (document.getElementById('moderra-cart-styles')) return;
    const s = document.createElement('style');
    s.id = 'moderra-cart-styles';
    s.textContent = `
        .cart-item-card {
            background: white; border-radius: 18px; padding: 16px;
            margin-bottom: 12px; border: 1px solid #f1f5f9;
            transition: all 0.25s ease; position: relative; overflow: visible;
        }
        .cart-item-card:hover { border-color: #c7d2fe; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.06); }
        .qty-btn {
            background: #f1f5f9; border: none; border-radius: 7px; cursor: pointer;
            font-weight: 900; font-size: 15px; width: 26px; height: 26px;
            display: flex; align-items: center; justify-content: center;
            color: #1e293b; transition: all 0.2s;
        }
        .qty-btn:hover { background: var(--primary,#6366f1); color: white; }
        .trash-btn {
            background: none; border: none; cursor: pointer; font-size: 15px;
            margin-top: 8px; padding: 4px; border-radius: 6px; opacity: 0.5;
            transition: opacity 0.2s; display: block; margin-left: auto;
        }
        .trash-btn:hover { opacity: 1; }
        @keyframes shake {
            0%,100% { transform: rotate(0deg); }
            20%,60% { transform: rotate(-10deg); }
            40%,80% { transform: rotate(10deg); }
        }
        .shake { animation: shake 0.5s ease; }
    `;
    document.head.appendChild(s);
})();

// Global erişim
window.addToCart = addToCart;
window.addToCartConcept = addToCartConcept;
window.addPackageToCart = addPackageToCart;
window.removeFromCart = removeFromCart;
window.updateItemQuantity = updateItemQuantity;
window.whatsappCheckout = whatsappCheckout;
window.flyToCart = flyToCart;
async function showInstallmentTable() {
    const { total } = calculateCartTotal();
    if (total <= 0) return;

    let modal = document.getElementById('installment-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'installment-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:15px;';
    modal.innerHTML = `
        <div style="width:100%;max-width:800px;background:white;border-radius:24px;overflow-y:auto;position:relative;max-height:90vh;display:flex;flex-direction:column;padding:30px;">
            <div style="margin-bottom:25px;display:flex;justify-content:space-between;align-items:center;">
                <h3 style="margin:0;color:#1e293b;font-size:18px;font-weight:900;">💳 Taksit Seçenekleri (₺${total.toLocaleString('tr-TR')})</h3>
                <button onclick="document.getElementById('installment-modal').remove()" style="background:none;border:none;font-size:28px;cursor:pointer;color:#94a3b8;">&times;</button>
            </div>
            <div id="paytr_taksit_tablosu"></div>
            <p style="margin-top:20px; font-size:11px; color:#64748b; text-align:center;">Ödeme ekranında kredi kartınızı girdiğinizde bu taksit seçenekleri sunulacaktır.</p>
        </div>
    `;
    document.body.appendChild(modal);

    // Style and Script injection
    const style = document.createElement('style');
    style.innerHTML = `
        #paytr_taksit_tablosu{clear: both;font-size: 12px;width: 100%;text-align: center;font-family: 'Segoe UI', sans-serif;}
        .taksit-tablosu-wrapper{margin: 10px;width: auto;min-width:180px;padding: 15px;cursor: default;text-align: center;display: inline-block;border: 1px solid #e2e8f0;border-radius:12px;background:#f8fafc;}
        .taksit-logo img{max-height: 24px;padding-bottom: 12px;}
        .taksit-tutari-text{float: left;width: 50%;color: #64748b;margin-bottom: 5px;font-size:10px;text-align:left;}
        .taksit-tutar-wrapper{display: block;background-color: #fff;border-radius:8px;border:1px solid #cbd5e1;overflow:hidden;}
        .taksit-tutari{float: left;width: 50%;padding: 10px 0;color: #1e293b;border: 1px solid #f1f5f9;font-size:13px;}
        .taksit-tutari-bold{font-weight: bold;color:var(--primary);}
        @media all and (max-width: 600px) {.taksit-tablosu-wrapper {margin: 5px 0; display:block; width:100%;}}
    `;
    document.head.appendChild(style);

    const script = document.createElement('script');
    const token = 'e980c8427df5c612465f3cd69d3cf703cdfe0b98f3df0fed04b919a2605b01c0';
    script.src = `https://www.paytr.com/odeme/taksit-tablosu/v2?token=${token}&merchant_id=678000&amount=${total}&taksit=0&tumu=0`;
    document.body.appendChild(script);
}

window.showInstallmentTable = showInstallmentTable;

async function payWithPayTR() {
    const { minOrder } = getSettings();
    const { total } = calculateCartTotal();

    if (total < minOrder) {
        alert(`Minimum sipariş tutarı ₺${minOrder.toLocaleString('tr-TR')} TL'dir.`);
        return;
    }

    const shipping   = getShippingFee(total);
    const grandTotal = total + shipping;

    const userData = JSON.parse(localStorage.getItem('moderra_user_data') || '{}');
    if (!userData.name || !userData.phone || !userData.address) {
        alert('Lütfen ödeme için profil bilgilerinizi doldurun.');
        const pm = document.getElementById('profile-modal');
        if (pm) pm.style.display = 'block';
        return;
    }

    // ── Bilgi Onay Modalı ────────────────────────────────────────────────────
    const confirmed = await new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.7);backdrop-filter:blur(8px);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;';
        overlay.innerHTML = `
            <div style="background:white;border-radius:24px;padding:0;max-width:480px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.3);overflow:hidden;">
                <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px 28px;color:white;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div style="width:42px;height:42px;background:rgba(255,255,255,0.15);border-radius:12px;display:flex;align-items:center;justify-content:center;">
                            <i class="fas fa-user-check" style="font-size:18px;"></i>
                        </div>
                        <div>
                            <h3 style="margin:0;font-size:17px;font-weight:900;">Teslimat Bilgilerini Onayla</h3>
                            <p style="margin:3px 0 0;font-size:12px;opacity:0.8;">Bilgileriniz doğru mu kontrol edin</p>
                        </div>
                    </div>
                </div>
                <div style="padding:24px 28px;display:flex;flex-direction:column;gap:14px;">
                    <div style="background:#f8fafc;border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:12px;">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <div style="width:34px;height:34px;background:#ede9fe;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                <i class="fas fa-user" style="color:#7c3aed;font-size:14px;"></i>
                            </div>
                            <div>
                                <div style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Ad Soyad</div>
                                <div style="font-size:15px;font-weight:800;color:#1e293b;">${userData.name}</div>
                            </div>
                        </div>
                        <div style="height:1px;background:#e2e8f0;"></div>
                        <div style="display:flex;align-items:center;gap:12px;">
                            <div style="width:34px;height:34px;background:#ede9fe;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                <i class="fas fa-phone" style="color:#7c3aed;font-size:14px;"></i>
                            </div>
                            <div>
                                <div style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Telefon</div>
                                <div style="font-size:15px;font-weight:800;color:#1e293b;">${userData.phone}</div>
                            </div>
                        </div>
                        <div style="height:1px;background:#e2e8f0;"></div>
                        <div style="display:flex;align-items:flex-start;gap:12px;">
                            <div style="width:34px;height:34px;background:#ede9fe;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">
                                <i class="fas fa-map-marker-alt" style="color:#7c3aed;font-size:14px;"></i>
                            </div>
                            <div>
                                <div style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Teslimat Adresi</div>
                                <div style="font-size:14px;font-weight:700;color:#1e293b;line-height:1.4;">${userData.address}</div>
                            </div>
                        </div>
                    </div>
                    <p style="margin:0;font-size:11px;color:#64748b;text-align:center;">Bilgileri değiştirmek istiyorsanız aşağıdaki butona tıklayın.</p>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                        <button id="conf-edit-btn" style="padding:14px;border-radius:12px;border:2px solid #e2e8f0;background:white;cursor:pointer;font-weight:700;font-size:14px;color:#64748b;transition:all 0.2s;" onmouseover="this.style.borderColor='#4f46e5';this.style.color='#4f46e5'" onmouseout="this.style.borderColor='#e2e8f0';this.style.color='#64748b'">
                            <i class="fas fa-edit"></i> Düzenle
                        </button>
                        <button id="conf-ok-btn" style="padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#4f46e5,#7c3aed);cursor:pointer;font-weight:900;font-size:14px;color:white;box-shadow:0 4px 15px rgba(79,70,229,0.4);transition:all 0.2s;">
                            <i class="fas fa-check"></i> Onayla ve Öde
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        document.getElementById('conf-ok-btn').onclick = () => { overlay.remove(); resolve(true); };
        document.getElementById('conf-edit-btn').onclick = () => {
            overlay.remove();
            const pm = document.getElementById('profile-modal');
            if (pm) pm.style.display = 'block';
            resolve(false);
        };
        overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
    });
    if (!confirmed) return;

    const btn = document.querySelector('button[onclick="payWithPayTR()"]');
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> BEKLEYİN...';

    try {
        const response = await fetch('/api/paytr-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cart: cart,
                user: userData,
                totalAmount: grandTotal
            })
        });

        const data = await response.json();
        if (data.token) {
            // PayTR İframe + Taksit Tablosu Modal Oluştur
            let modal = document.getElementById('paytr-modal');
            if (modal) modal.remove();

            modal = document.createElement('div');
            modal.id = 'paytr-modal';
            modal.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.9);backdrop-filter:blur(20px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:10px;';
            modal.innerHTML = `
                <div style="width:100%;max-width:1200px;background:#f8fafc;border-radius:28px;overflow:hidden;position:relative;height:95vh;display:flex;flex-direction:column;box-shadow:0 40px 80px -12px rgba(0,0,0,0.7);">

                    <!-- Header -->
                    <div style="padding:18px 28px;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#1e293b 0%,#334155 100%);flex-shrink:0;">
                        <div style="display:flex;align-items:center;gap:14px;">
                            <div style="width:44px;height:44px;background:rgba(16,185,129,0.15);border:1.5px solid rgba(16,185,129,0.5);border-radius:14px;display:flex;align-items:center;justify-content:center;">
                                <i class="fas fa-shield-halved" style="color:#10b981;font-size:20px;"></i>
                            </div>
                            <div>
                                <h3 style="margin:0;color:white;font-size:17px;font-weight:900;letter-spacing:-0.3px;">Güvenli Ödeme</h3>
                                <p style="margin:3px 0 0 0;font-size:11px;color:#94a3b8;"><i class="fas fa-lock" style="font-size:9px;"></i> 256-bit SSL ile şifreleniyor</p>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:20px;">
                            <div style="text-align:right;">
                                <p style="margin:0;font-size:11px;color:#64748b;">Toplam Tutar</p>
                                <p style="margin:2px 0 0 0;font-size:22px;font-weight:900;color:#10b981;">₺${total.toLocaleString('tr-TR')}</p>
                            </div>
                            <button onclick="document.getElementById('paytr-modal').remove()" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);width:38px;height:38px;border-radius:50%;font-size:22px;cursor:pointer;color:#94a3b8;display:flex;align-items:center;justify-content:center;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">&times;</button>
                        </div>
                    </div>

                    <!-- Body: İki Sütun -->
                    <div style="flex:1;display:flex;overflow:hidden;">

                        <!-- Sol Panel: Bilgi + Taksit Tablosu -->
                        <div style="width:360px;flex-shrink:0;background:#f1f5f9;border-right:1px solid #e2e8f0;display:flex;flex-direction:column;overflow-y:auto;">

                            <!-- Test Kartları -->
                            <div style="margin:16px 16px 0 16px;background:linear-gradient(135deg,#dbeafe,#ede9fe);border-radius:16px;border:1px solid #c7d2fe;overflow:hidden;">
                                <div style="padding:12px 14px;background:rgba(99,102,241,0.1);border-bottom:1px solid #c7d2fe;">
                                    <p style="margin:0;font-size:11px;font-weight:800;color:#4338ca;text-transform:uppercase;letter-spacing:0.8px;">
                                        <i class="fas fa-flask"></i> Test Modu — Taksit Denemek İçin
                                    </p>
                                    <p style="margin:4px 0 0 0;font-size:10px;color:#6366f1;">Kart numarasını silip aşağıdakini girin → Taksitler görünür</p>
                                </div>
                                <div style="padding:10px 14px;display:flex;flex-direction:column;gap:6px;">
                                    <div onclick="(function(){navigator.clipboard.writeText('4506000000000001');var el=event.currentTarget;el.style.background='#d1fae5';setTimeout(()=>el.style.background='white',1500);})()" style="background:white;padding:9px 12px;border-radius:10px;font-size:11px;cursor:pointer;border:1px solid #e0e7ff;display:flex;justify-content:space-between;align-items:center;transition:all 0.2s;" onmouseover="this.style.boxShadow='0 2px 8px rgba(99,102,241,0.2)'" onmouseout="this.style.boxShadow='none'">
                                        <div><span style="color:#64748b;font-size:9px;display:block;">YKB · World · 3-12 Taksit</span><b style="color:#1e293b;">4506 0000 0000 0001</b></div>
                                        <i class="far fa-copy" style="color:#6366f1;"></i>
                                    </div>
                                    <div onclick="(function(){navigator.clipboard.writeText('4444444444444444');var el=event.currentTarget;el.style.background='#d1fae5';setTimeout(()=>el.style.background='white',1500);})()" style="background:white;padding:9px 12px;border-radius:10px;font-size:11px;cursor:pointer;border:1px solid #e0e7ff;display:flex;justify-content:space-between;align-items:center;transition:all 0.2s;" onmouseover="this.style.boxShadow='0 2px 8px rgba(99,102,241,0.2)'" onmouseout="this.style.boxShadow='none'">
                                        <div><span style="color:#64748b;font-size:9px;display:block;">İş Bankası · Maximum · 3-12 Taksit</span><b style="color:#1e293b;">4444 4444 4444 4444</b></div>
                                        <i class="far fa-copy" style="color:#6366f1;"></i>
                                    </div>
                                    <div onclick="(function(){navigator.clipboard.writeText('5400000000000002');var el=event.currentTarget;el.style.background='#d1fae5';setTimeout(()=>el.style.background='white',1500);})()" style="background:white;padding:9px 12px;border-radius:10px;font-size:11px;cursor:pointer;border:1px solid #e0e7ff;display:flex;justify-content:space-between;align-items:center;transition:all 0.2s;" onmouseover="this.style.boxShadow='0 2px 8px rgba(99,102,241,0.2)'" onmouseout="this.style.boxShadow='none'">
                                        <div><span style="color:#64748b;font-size:9px;display:block;">Garanti · Bonus · 3-12 Taksit</span><b style="color:#1e293b;">5400 0000 0000 0002</b></div>
                                        <i class="far fa-copy" style="color:#6366f1;"></i>
                                    </div>
                                    <p style="margin:2px 0 0 0;font-size:10px;color:#6366f1;text-align:center;"><i class="fas fa-calendar-alt"></i> Son tarih: 12/99 &nbsp;|&nbsp; CVV: 000</p>
                                </div>
                            </div>

                            <!-- Taksit Tablosu (Daraltılabilir) -->
                            <div style="margin:12px 16px 0 16px;background:white;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
                                <div onclick="(function(el){var body=el.nextElementSibling;var icon=el.querySelector('.tt-chevron');var open=body.style.display!=='none';body.style.display=open?'none':'block';icon.style.transform=open?'rotate(0deg)':'rotate(180deg)';})(this)" style="padding:12px 14px;background:linear-gradient(135deg,#f8fafc,#f1f5f9);cursor:pointer;display:flex;justify-content:space-between;align-items:center;user-select:none;" onmouseover="this.style.background='linear-gradient(135deg,#f1f5f9,#e2e8f0)'" onmouseout="this.style.background='linear-gradient(135deg,#f8fafc,#f1f5f9)'">
                                    <p style="margin:0;font-size:11px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:0.8px;">
                                        <i class="fas fa-credit-card" style="color:#6366f1;"></i> Taksit Seçenekleri
                                    </p>
                                    <i class="fas fa-chevron-down tt-chevron" style="color:#6366f1;font-size:12px;transition:transform 0.25s;transform:rotate(0deg);"></i>
                                </div>
                                <div style="display:none;padding:12px 10px;">
                                    <div id="paytr_taksit_tablosu"></div>
                                </div>
                            </div>

                            <!-- Güvenlik -->
                            <div style="margin:12px 16px 16px 16px;background:white;border-radius:16px;border:1px solid #e2e8f0;padding:14px;">
                                <div style="display:flex;gap:10px;align-items:flex-start;">
                                    <i class="fas fa-shield-check" style="color:#10b981;font-size:18px;margin-top:1px;"></i>
                                    <div>
                                        <p style="margin:0 0 4px 0;font-size:11px;font-weight:800;color:#1e293b;">%100 Güvenli Ödeme</p>
                                        <p style="margin:0;font-size:10px;color:#64748b;line-height:1.5;">Kart bilgileriniz PayTR güvencesiyle şifrelenir. Verileriniz tarafımızca saklanmaz.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Sağ Panel: PayTR iFrame -->
                        <div style="flex:1;display:flex;flex-direction:column;background:white;">
                            <iframe src="https://www.paytr.com/odeme/guvenli/${data.token}" id="paytr-iframe" style="width:100%;flex:1;border:none;display:block;"></iframe>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Taksit Tablosu CSS
            const style = document.createElement('style');
            style.innerHTML = `
                #paytr_taksit_tablosu{clear:both;font-size:10px;width:100%;text-align:center;font-family:inherit;}
                .taksit-tablosu-wrapper{margin:4px;padding:8px 6px;cursor:default;text-align:center;display:inline-block;border:1px solid #f1f5f9;border-radius:10px;background:#fafafa;width:calc(50% - 12px);box-sizing:border-box;vertical-align:top;}
                .taksit-logo img{max-height:18px;padding-bottom:6px;}
                .taksit-tutari-text{float:left;width:50%;color:#94a3b8;margin-bottom:4px;font-size:9px;text-align:left;padding-left:2px;}
                .taksit-tutar-wrapper{display:block;background:#f8fafc;border-radius:6px;border:1px solid #f1f5f9;overflow:hidden;clear:both;}
                .taksit-tutari{float:left;width:50%;padding:5px 0;color:#334155;border:1px solid #f1f5f9;font-size:10px;}
                .taksit-tutari-bold{font-weight:900;color:#4f46e5;}
                @media(max-width:600px){.taksit-tablosu-wrapper{width:100%;display:block;margin:4px 0;}}
            `;
            document.head.appendChild(style);

            // Taksit Tablosu Script — taksit=12, tumu=1 (tüm seçenekler)
            const script = document.createElement('script');
            const tt_token = 'e980c8427df5c612465f3cd69d3cf703cdfe0b98f3df0fed04b919a2605b01c0';
            script.src = `https://www.paytr.com/odeme/taksit-tablosu/v2?token=${tt_token}&merchant_id=678000&amount=${total}&taksit=12&tumu=1`;
            document.body.appendChild(script);

            // Sipariş ID sakla
            localStorage.setItem('last_order_id', data.orderId);
        } else {
            alert('Ödeme başlatılamadı: ' + (data.error || 'Bilinmeyen hata'));
        }
    } catch (e) {
        console.error('PayTR hatası:', e);
        alert('Ödeme sistemine bağlanılamadı.');
    } finally {
        if (btn) {
           btn.disabled = false;
           btn.innerHTML = originalContent;
        }
    }
}
