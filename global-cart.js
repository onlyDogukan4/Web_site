/**
 * MODERRA GLOBAL CART SYSTEM v2.0
 * Unified Cart UI and Logic for all pages
 */

// --- INITIALIZE GLOBAL CART UI ---
(function initCartUI() {
    const cartHTML = `
        <div class="cart-overlay" id="cart-overlay"></div>
        <div id="cart-modal" class="cart-drawer">
            <div class="cart-header">
                <h2 style="display:flex; align-items:center; gap:12px;">
                    <i class="fas fa-shopping-bag" style="color:var(--primary);"></i>
                    <span data-tr="Sepetim" data-en="My Cart">Sepetim</span>
                </h2>
                <i class="fas fa-times cart-close" id="global-cart-close" style="font-size:24px; cursor:pointer; color:#64748b; transition:0.3s; padding:10px;"></i>
            </div>
            
            <div id="cart-items-list" style="flex:1; overflow-y:auto; padding:30px;">
                <div style="text-align:center; padding:60px 20px;">
                    <i class="fas fa-shopping-basket" style="font-size:48px; color:#e2e8f0; margin-bottom:20px; display:block;"></i>
                    <p style="color:#64748b; font-weight:600;" data-tr="Sepetiniz şu an boş." data-en="Your cart is empty.">Sepetiniz şu an boş.</p>
                </div>
            </div>

            <div class="cart-footer">
                <div id="cart-summary-table" style="margin-bottom:20px;">
                    <!-- Price summary injected here -->
                </div>
                <button id="whatsapp-checkout" class="btn" style="width:100%; padding:18px; border-radius:18px; background:#25d366; color:white; font-size:16px; font-weight:900; box-shadow:0 10px 20px rgba(37,211,102,0.2); border:none; display:none;">
                    <i class="fab fa-whatsapp" style="font-size:20px; margin-right:8px;"></i> 
                    <span data-tr="WhatsApp ile Sipariş Ver" data-en="Order via WhatsApp">WhatsApp ile Sipariş Ver</span>
                </button>
            </div>
        </div>
    `;

    if (!document.getElementById('cart-modal')) {
        const div = document.createElement('div');
        div.innerHTML = cartHTML;
        document.body.appendChild(div);
    }
})();

// --- CART LOGIC ---
window.cart = JSON.parse(localStorage.getItem('cart') || '[]');

window.calculateCartTotal = function () {
    let subTotal = 0;
    let discountTotal = 0;

    window.cart.forEach(item => {
        let itemTotal = 0;
        if (item.packageItems) {
            item.packageItems.forEach(si => {
                itemTotal += (parseFloat(si.price) * si.quantity);
            });
            subTotal += itemTotal * item.quantity;
            discountTotal += (itemTotal * item.quantity) * (parseFloat(item.discount || 0) / 100);
        } else {
            // Bulk Discount Check (for standard products)
            let basePrice = parseFloat(item.price);
            let finalPrice = basePrice;
            if (item.bulk_threshold && item.quantity >= item.bulk_threshold) {
                finalPrice = basePrice * (1 - (item.bulk_rate / 100));
                discountTotal += (basePrice - finalPrice) * item.quantity;
            }
            subTotal += basePrice * item.quantity;
        }
    });

    return { subTotal, discountTotal, total: subTotal - discountTotal };
}

window.updateCartDisplay = async function () {
    const list = document.getElementById('cart-items-list');
    const summary = document.getElementById('cart-summary-table');
    const countEl = document.getElementById('cart-count');
    const whatsappBtn = document.getElementById('whatsapp-checkout');

    if (!list) return;

    list.innerHTML = '';
    const { subTotal, discountTotal, total } = window.calculateCartTotal();
    const currentLang = localStorage.getItem('lang') || 'tr';

    if (window.cart.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding:60px 20px;">
                <i class="fas fa-shopping-basket" style="font-size:48px; color:#e2e8f0; margin-bottom:20px; display:block;"></i>
                <p style="color:#64748b; font-weight:600;" data-tr="Sepetiniz şu an boş." data-en="Your cart is empty.">
                    ${currentLang === 'tr' ? 'Sepetiniz şu an boş.' : 'Your cart is empty.'}
                </p>
            </div>
        `;
        if (countEl) countEl.style.display = 'none';
        if (whatsappBtn) whatsappBtn.style.display = 'none';
        if (summary) summary.innerHTML = '';
    } else {
        window.cart.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'cart-item-card';
            if (item.isConcept) el.classList.add('vip-concept-frame');

            let itemTotal = 0;
            let discountLabel = "";
            let basePrice = parseFloat(item.price);

            if (item.packageItems) {
                item.packageItems.forEach(si => itemTotal += (parseFloat(si.price) * si.quantity));
                itemTotal = itemTotal * item.quantity;
                const dAmt = itemTotal * (parseFloat(item.discount || 0) / 100);
                itemTotal -= dAmt;
            } else {
                if (item.bulk_threshold && item.quantity >= item.bulk_threshold) {
                    const finalPrice = basePrice * (1 - (item.bulk_rate / 100));
                    itemTotal = finalPrice * item.quantity;
                    discountLabel = `%${item.bulk_rate} ${currentLang === 'tr' ? 'Çoklu Alım İndirimi' : 'Bulk Discount'}`;
                } else {
                    itemTotal = basePrice * item.quantity;
                }
            }

            el.innerHTML = `
                ${item.isConcept ? `<div class="vip-badge"><i class="fas fa-crown"></i> PREMIUM CONCEPT</div>` : ''}
                <div style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:15px;">
                    <div style="display:flex; align-items:center; gap:15px; flex:1;">
                        <div style="position:relative;">
                            <img src="${item.image || 'images/bardak.png'}" style="width:65px; height:65px; object-fit:contain; border-radius:18px; background:#f8fafc; border:1px solid ${item.isConcept ? '#d4af37' : '#eee'}; padding:5px;">
                            ${item.isConcept ? `<i class="fas fa-crown" style="position:absolute; top:-8px; left:-8px; color:#d4af37; font-size:14px; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2));"></i>` : ''}
                        </div>
                        <div style="flex:1;">
                            <div style="font-weight:900; font-size:15px; color:${item.isConcept ? '#1a1a1a' : '#1e293b'}; line-height:1.2; display:flex; align-items:center; gap:8px;">
                                ${item.name}
                            </div>
                            ${item.isConcept ? `
                                <div style="font-size:10px; color:#d4af37; font-weight:900; display:flex; align-items:center; gap:4px; margin-top:4px;">
                                    <i class="fas fa-magic"></i> ${currentLang === 'tr' ? 'ÖZEL TASARIM' : 'CUSTOM DESIGN'}
                                </div>
                                ${item.note ? `<div style="font-size:11px; color:#64748b; background:#f8fafc; padding:6px 10px; border-radius:10px; margin-top:8px; font-style:italic; border-left:3px solid #d4af37; line-height:1.4;">"${item.note}"</div>` : ''}
                            `: ''}
                            ${item.packageItems ? `
                                <details style="margin-top:10px; background:#f8fafc; border-radius:12px; border:1px solid #eee;">
                                    <summary style="padding:8px 12px; font-size:11px; font-weight:800; color:#64748b; cursor:pointer; list-style:none; display:flex; justify-content:space-between;">
                                        <span>${currentLang === 'tr' ? 'Paket İçeriği' : 'Package Content'}</span>
                                        <i class="fas fa-chevron-down"></i>
                                    </summary>
                                    <div style="padding:10px;">
                                        ${item.packageItems.map(si => `
                                            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:5px;">
                                                <span>${si.name}</span>
                                                <span style="font-weight:800;">x${si.quantity}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </details>
                            ` : ''}
                            <div class="quantity-control" style="margin-top:12px;">
                                <button class="qty-btn" onclick="window.updateItemQuantity('${item.id}', -1)">-</button>
                                <span style="font-weight:900; font-size:14px; min-width:30px; text-align:center;">${item.quantity}</span>
                                <button class="qty-btn" onclick="window.updateItemQuantity('${item.id}', 1)">+</button>
                            </div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:18px; font-weight:900; color:${item.isConcept ? '#d4af37' : 'var(--primary)'};">₺${itemTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                        ${discountLabel ? `<div style="font-size:10px; color:#16a34a; font-weight:800; margin-top:4px;">${discountLabel}</div>` : ''}
                        <i class="fas fa-trash-alt" onclick="window.removeFromCart('${item.id}')" style="cursor:pointer; color:#cbd5e1; font-size:14px; margin-top:12px; transition:0.3s; padding:5px;"></i>
                    </div>
                </div>
            `;
            list.appendChild(el);
        });

        if (countEl) {
            const totalQty = window.cart.reduce((s, i) => s + i.quantity, 0);
            countEl.innerText = totalQty;
            countEl.style.display = 'flex';
        }
        if (whatsappBtn) whatsappBtn.style.display = 'block';

        // Summary Area
        if (summary) {
            summary.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:10px; color:#64748b; font-size:14px;">
                    <span>${currentLang === 'tr' ? 'Ara Toplam:' : 'Subtotal:'}</span>
                    <span>₺${subTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
                ${discountTotal > 0 ? `
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px; color:#16a34a; font-size:14px; font-weight:700;">
                        <span>${currentLang === 'tr' ? 'İndirim:' : 'Discount:'}</span>
                        <span>-₺${discountTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                ` : ''}
                <div style="display:flex; justify-content:space-between; margin-top:15px; padding-top:15px; border-top:2px dashed #e2e8f0; align-items:center;">
                    <span style="font-weight:800; font-size:20px;">${currentLang === 'tr' ? 'TOPLAM:' : 'TOTAL:'}</span>
                    <span style="font-weight:900; font-size:24px; color:var(--primary);">₺${total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
            `;
        }
    }
    localStorage.setItem('cart', JSON.stringify(window.cart));
}

window.updateItemQuantity = function (id, delta) {
    const item = window.cart.find(x => x.id === id);
    if (item) {
        item.quantity = Math.max(1, item.quantity + delta);
        window.updateCartDisplay();
    }
}

window.removeFromCart = function (id) {
    window.cart = window.cart.filter(x => x.id !== id);
    window.updateCartDisplay();
}

window.addToCart = function (id, name, price, image = 'images/bardak.png') {
    const existingItem = window.cart.find(item => item.id == id);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        window.cart.push({
            id,
            name,
            price: parseFloat(price),
            image: image,
            quantity: 1
        });
    }

    window.updateCartDisplay();

    // Fly to cart effect (if flyToCart exists)
    if (typeof flyToCart === 'function') {
        // Try to find the image to animate
        const sourceImg = document.querySelector(`[data-id="${id}"]`)?.closest('.product-card')?.querySelector('.product-img');
        if (sourceImg) flyToCart(sourceImg);
    }
}

window.toggleCart = function (open = true) {
    if (open) {
        document.body.classList.add('cart-open');
        window.updateCartDisplay();
    } else {
        document.body.classList.remove('cart-open');
    }
}

// Ensure events are attached
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('global-cart-close');
    const overlay = document.getElementById('cart-overlay');
    const openBtn = document.getElementById('open-cart-modal');

    if (closeBtn) closeBtn.onclick = () => toggleCart(false);
    if (overlay) overlay.onclick = () => toggleCart(false);
    if (openBtn) openBtn.onclick = () => toggleCart(true);

    const whatsappBtn = document.getElementById('whatsapp-checkout');
    if (whatsappBtn) {
        whatsappBtn.onclick = () => {
            const { total } = calculateCartTotal();
            const currentLang = localStorage.getItem('lang') || 'tr';
            let msg = currentLang === 'tr' ? `Merhaba, yeni bir siparişim var!\n\n` : `Hello, I have a new order!\n\n`;

            cart.forEach(item => {
                msg += `• ${item.quantity} adet ${item.name}\n`;
                if (item.note) msg += `  Not: ${item.note}\n`;
            });

            msg += `\nToplam: ₺${total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
            window.open(`https://wa.me/905307004410?text=${encodeURIComponent(msg)}`);
        };
    }
});

// Sync Cart Count on load
updateCartDisplay();
