import { getCart, getSettings, calculateCartTotal } from './store.js';
import { getShippingFee } from './store.js';

export function updateCartDisplay() {
    const list = document.getElementById('cart-items-list');
    const cartCount = document.getElementById('cart-count');
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

    if (getCart().length === 0) {
        list.innerHTML = `
            <div style="text-align:center;padding:80px 20px;color:#cbd5e1;">
                <div style="font-size:60px;margin-bottom:16px;">🛒</div>
                <p style="font-weight:800;font-size:15px;color:#94a3b8;">Sepetiniz boş</p>
                <p style="font-size:13px;color:#cbd5e1;margin-top:6px;">Ürünleri keşfetmek için alışverişe başlayın</p>
            </div>`;
        if (cartCount) cartCount.style.display = 'none';
        _renderSummary(0, 0, 0);
        return;
    }

    getCart().forEach(item => {
        const el = document.createElement('div');
        el.dataset.cartItemId = item.id;

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
                                <span class="qty-value" style="font-weight:900;font-size:14px;min-width:24px;text-align:center;color:#1e293b;">${item.quantity}</span>
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
                                <span class="qty-value" style="font-weight:900;font-size:14px;min-width:24px;text-align:center;color:#1e293b;">${item.quantity}</span>
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

    const totalCount = getCart().reduce((s, i) => s + i.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalCount;
        cartCount.style.display = totalCount > 0 ? 'flex' : 'none';
    }
}

export function _renderSummary(subTotal, discountTotal, total) {
    const area = document.getElementById('cart-total-price-area');
    if (!area) return;
    const shipping  = getShippingFee(total);
    const grandTotal = total + shipping;
    const kdvAmount = Math.round((grandTotal - grandTotal / 1.2) * 100) / 100;
    area.innerHTML = `
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#64748b;font-size:13px;">
            <span>Ürünler (ara toplam)</span>
            <span>₺${subTotal.toLocaleString('tr-TR',{minimumFractionDigits:2})}</span>
        </div>
        ${discountTotal > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#16a34a;font-size:13px;font-weight:700;">
            <span>🎁 İndirim</span>
            <span>−₺${discountTotal.toLocaleString('tr-TR',{minimumFractionDigits:2})}</span>
        </div>` : ''}
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#475569;font-size:13px;">
            <span>Ürün tutarı</span>
            <span>₺${total.toLocaleString('tr-TR',{minimumFractionDigits:2})}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:${shipping > 0 ? '#dc2626' : '#16a34a'};font-size:13px;font-weight:700;">
            <span>${shipping > 0 ? '🚚 Kargo' : '🎉 Kargo (Ücretsiz)'}</span>
            <span>${shipping > 0 ? '₺' + shipping.toLocaleString('tr-TR') : 'Ücretsiz'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#64748b;font-size:11px;">
            <span>KDV (%20, dahil)</span>
            <span>₺${kdvAmount.toLocaleString('tr-TR',{minimumFractionDigits:2})}</span>
        </div>
            <div style="display:flex;justify-content:space-between;color:var(--primary);font-weight:900;font-size:18px;margin-top:10px;padding-top:10px;border-top:2px solid #f1f5f9;">
                <span>ÖDENECEK TOPLAM</span>
                <span style="font-weight:900;font-size:22px;color:var(--primary);">₺${grandTotal.toLocaleString('tr-TR',{minimumFractionDigits:2})}</span>
            </div>
            ${
                total > 0
                    ? `<div id="checkout-options">
                <button type="button" onclick="whatsappCheckout()">
                    <i class="fab fa-whatsapp" aria-hidden="true"></i>
                    <span>WhatsApp</span>
                </button>
                <button type="button" onclick="payWithPayTR()">
                    <i class="fas fa-credit-card" aria-hidden="true"></i>
                    <span>Kredi Kartı</span>
                </button>
            </div>`
                    : ''
            }
`;
}