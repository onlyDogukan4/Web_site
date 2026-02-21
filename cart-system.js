
// MODERRA UNIFIED CART SYSTEM
// This file synchronizes the cart across all pages.

let cart = JSON.parse(localStorage.getItem('cart') || '[]');

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function calculateCartTotal() {
    let subTotal = 0;
    let discountTotal = 0;

    cart.forEach(item => {
        let itemTotal = 0;
        if (item.isPackage) {
            itemTotal = item.packageItems.reduce((acc, si) => acc + (parseFloat(si.price) * si.quantity), 0);
            subTotal += itemTotal * item.quantity;
            discountTotal += (itemTotal * item.quantity) * ((item.discount || 0) / 100);
        } else {
            // Bulk discount logic for regular items
            const p = item.productRaw || {};
            let price = parseFloat(item.price);
            if (p.bulk_threshold && item.quantity >= p.bulk_threshold) {
                // We assume the stored price is already discounted or we apply it here
                // For simplicity, we assume 'price' is the unit price
            }
            itemTotal = price * item.quantity;
            subTotal += itemTotal;
        }
    });

    return { subTotal, discountTotal, total: subTotal - discountTotal };
}

function flyToCart(imgElement) {
    if (!imgElement) return;
    const cartIcon = document.getElementById('open-cart-modal');
    if (!cartIcon) return;

    const flyImg = imgElement.cloneNode(true);
    const rect = imgElement.getBoundingClientRect();

    flyImg.classList.add('flying-item');
    flyImg.style.position = 'fixed';
    flyImg.style.left = rect.left + 'px';
    flyImg.style.top = rect.top + 'px';
    flyImg.style.width = '100px';
    flyImg.style.height = '100px';
    flyImg.style.zIndex = '100000';
    flyImg.style.pointerEvents = 'none';
    flyImg.style.transition = 'all 0.8s cubic-bezier(0.19, 1, 0.22, 1)';

    document.body.appendChild(flyImg);

    const cartRect = cartIcon.getBoundingClientRect();

    requestAnimationFrame(() => {
        flyImg.style.transform = `translate(${cartRect.left - rect.left}px, ${cartRect.top - rect.top}px) scale(0.1)`;
        flyImg.style.opacity = '0.5';
    });

    setTimeout(() => {
        flyImg.remove();
        cartIcon.classList.add('shake');
        setTimeout(() => cartIcon.classList.remove('shake'), 500);
    }, 800);
}

function whatsappCheckout() {
    let minOrder = 500;
    try {
        const s = localStorage.getItem('settings');
        if (s) minOrder = JSON.parse(s).minOrder || 500;
    } catch (e) { }

    const { total } = calculateCartTotal();
    if (total < minOrder) {
        alert(`Minimum sipariş tutarı ₺${minOrder} TL'dir.`);
        return;
    }

    const userData = JSON.parse(localStorage.getItem('moderra_user_data') || '{}');
    if (!userData.name || !userData.phone || !userData.address) {
        alert("Lütfen sipariş için profil bilgilerinizi doldurun.");
        const pm = document.getElementById('profile-modal');
        if (pm) pm.style.display = 'block';
        return;
    }

    let message = "*Moderra - Yeni Sipariş*\n\n";
    cart.forEach(item => {
        message += `📦 ${item.quantity} x ${item.name} (₺${(item.price * item.quantity).toFixed(2)})\n`;
        if (item.note) message += `   └ 📝 Not: ${item.note}\n`;
        if (item.isConcept) message += `   └ ✨ VIP Tasarım\n`;
    });
    message += `\n*💰 Toplam: ₺${total.toFixed(2)}*\n\n`;
    message += `👤 Müşteri: ${userData.name}\n📞 Tel: ${userData.phone}\n🏠 Adres: ${userData.address}`;

    window.open(`https://wa.me/905304640120?text=${encodeURIComponent(message)}`, '_blank');
}

async function updateCartDisplay() {
    const list = document.getElementById('cart-items-list');
    const cartCount = document.getElementById('cart-count');
    const whatsappCheckout = document.getElementById('whatsapp-checkout');

    if (!list) return;
    list.innerHTML = '';

    // Get Settings
    let minOrder = 500;
    let freeShip = 1000;
    try {
        const s = localStorage.getItem('settings');
        if (s) {
            const parsed = JSON.parse(s);
            minOrder = parsed.minOrder || 500;
            freeShip = parsed.freeShipping || 1000;
        }
    } catch (e) { }

    const { total, subTotal, discountTotal } = calculateCartTotal();

    let shippingFee = 0;
    let shippingLimitMet = total >= freeShip;
    let minOrderMet = total >= minOrder;

    if (total > 0 && minOrderMet && !shippingLimitMet) {
        shippingFee = parsed.shippingFee || 50;
    }

    let headerHTML = '';
    if (total < minOrder) {
        headerHTML += `
            <div style="padding: 20px; background: #fff1f2; border-bottom: 1px solid #ffe4e6; margin: -20px -20px 20px -20px;">
                <div style="font-size:13px; color:#9f1239; margin-bottom:8px; font-weight:800; display:flex; justify-content:space-between;">
                    <span>Onay İçin Eksik:</span>
                    <span>₺${remainingMin.toLocaleString('tr-TR')}</span>
                </div>
                <div style="width:100%; height:8px; background:#ffe4e6; border-radius:10px; overflow:hidden;">
                    <div style="width:${minProgress}%; height:100%; background:#f43f5e; transition: width 0.6s;"></div>
                </div>
            </div>
        `;
    } else if (!shippingLimitMet) {
        headerHTML += `
            <div style="padding: 20px; background: ${shipBgColor}; border-bottom: 1px solid #fde047; margin: -20px -20px 20px -20px;">
                <div style="font-size:13px; color:#854d0e; margin-bottom:8px; font-weight:800; display:flex; justify-content:space-between;">
                    <span>🚀 Ücretsiz Kargo İçin:</span>
                    <span>₺${remainingShip.toLocaleString('tr-TR')}</span>
                </div>
                <div style="width:100%; height:8px; background:white; border-radius:10px; overflow:hidden;">
                    <div style="width:${shipProgress}%; height:100%; background:${shipBarColor}; transition: width 0.6s;"></div>
                </div>
            </div>
        `;
    } else {
        headerHTML += `
            <div style="padding: 20px; background: #ecfccb; border-bottom: 1px solid #d9f99d; text-align:center; margin: -20px -20px 20px -20px;">
                <div style="font-size:14px; color:#365314; font-weight:900;">🎉 KARGONUZ ŞİMDİ ÜCRETSİZ!</div>
            </div>
        `;
    }

    const sticky = document.getElementById('cart-progress-sticky');
    if (sticky) {
        sticky.innerHTML = headerHTML;
    } else {
        const progressContainer = document.createElement('div');
        progressContainer.id = 'cart-progress-container';
        progressContainer.innerHTML = headerHTML;
        list.prepend(progressContainer);
    }

    if (cart.length === 0) {
        list.innerHTML += '<div style="text-align:center; padding:100px 20px; color:#cbd5e1;"><i class="fas fa-shopping-basket" style="font-size:60px; margin-bottom:20px; display:block;"></i><p style="font-weight:700;">Sepetiniz şu an boş.</p></div>';
        if (cartCount) cartCount.style.display = 'none';
        if (whatsappCheckout) whatsappCheckout.style.display = 'none';
    } else {
        cart.forEach((item, index) => {
            const itemTotal = item.isPackage
                ? (item.packageItems.reduce((acc, si) => acc + (parseFloat(si.price) * si.quantity), 0) * (1 - ((item.discount || 0) / 100)) * item.quantity)
                : (parseFloat(item.price) * item.quantity);

            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item-card' + (item.isConcept ? ' vip-concept-frame' : '');

            if (item.isPackage) {
                itemElement.innerHTML = `
                    <div style="display:flex; align-items:flex-start; justify-content:space-between; width:100%; gap:15px;">
                        <div style="display:flex; gap:15px; flex:1;">
                            <img src="${item.image || 'images/box.png'}" style="width:70px; height:70px; object-fit:contain; border-radius:15px; background:#f8fafc; padding:10px; border:1px solid #eee;">
                            <div>
                                <div style="font-weight:900; font-size:16px; color:#1e293b; line-height:1.2;">${item.name}</div>
                                <div class="quantity-control" style="margin-top:10px; background:#f1f5f9; padding:2px; border-radius:8px;">
                                    <button class="qty-btn" style="width:24px; height:24px;" onclick="updateItemQuantity('${item.id}', -1)">-</button>
                                    <span style="font-weight:900; font-size:14px; min-width:30px; text-align:center;">${item.quantity}</span>
                                    <button class="qty-btn" style="width:24px; height:24px;" onclick="updateItemQuantity('${item.id}', 1)">+</button>
                                </div>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:18px; font-weight:900; color:var(--primary);">₺${itemTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                            <i class="fas fa-trash-alt" onclick="removeFromCart('${item.id}')" style="cursor:pointer; color:#cbd5e1; font-size:14px; margin-top:12px; transition:0.3s; padding:5px;"></i>
                        </div>
                    </div>
                `;
            } else {
                itemElement.innerHTML = `
                    ${item.isConcept ? `<div class="vip-badge"><i class="fas fa-crown"></i> PREMIUM CONCEPT</div>` : ''}
                    <div style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:15px;">
                        <div style="display:flex; align-items:center; gap:15px; flex:1;">
                            <div style="position:relative;">
                                <img src="${item.image || 'images/bardak.png'}" style="width:65px; height:65px; object-fit:contain; border-radius:18px; background:#f8fafc; border:1px solid ${item.isConcept ? '#d4af37' : '#eee'}; padding:5px;">
                                ${item.isConcept ? `<i class="fas fa-crown" style="position:absolute; top:-8px; left:-8px; color:#d4af37; font-size:14px;"></i>` : ''}
                            </div>
                            <div style="flex:1;">
                                <div style="font-weight:900; font-size:15px; color:${item.isConcept ? '#1a1a1a' : '#1e293b'}; line-height:1.2;">${item.name}</div>
                                ${item.note ? `<div style="font-size:11px; color:#64748b; background:#f8fafc; padding:6px 10px; border-radius:10px; margin-top:8px; font-style:italic; border-left:3px solid #d4af37; line-height:1.4;">"${item.note}"</div>` : ''}
                                <div class="quantity-control" style="margin-top:12px; background:#f1f5f9; padding:2px; border-radius:8px; display:inline-flex;">
                                    <button class="qty-btn" style="width:24px; height:24px;" onclick="updateItemQuantity('${item.id}', -1)">-</button>
                                    <span style="font-weight:900; font-size:14px; min-width:30px; text-align:center;">${item.quantity}</span>
                                    <button class="qty-btn" style="width:24px; height:24px;" onclick="updateItemQuantity('${item.id}', 1)">+</button>
                                </div>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:20px; font-weight:900; color:${item.isConcept ? '#d4af37' : 'var(--primary)'};">₺${itemTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                            <i class="fas fa-trash-alt" onclick="removeFromCart('${item.id}')" style="cursor:pointer; color:#cbd5e1; font-size:14px; margin-top:12px; transition: 0.3s; padding:5px;"></i>
                        </div>
                    </div>
                `;
            }
            list.appendChild(itemElement);
        });

        if (whatsappCheckout) whatsappCheckout.style.display = 'flex';
    }

    // Update Summary
    const summaryArea = document.getElementById('cart-total-price-area');
    if (summaryArea) {
        let settings_raw = localStorage.getItem('settings');
        let parsed_settings = settings_raw ? JSON.parse(settings_raw) : { minOrder: 500, freeShipping: 1000, shippingFee: 50 };
        const { total, subTotal, discountTotal } = calculateCartTotal();

        let shippingFee = 0;
        if (total > 0 && total >= parsed_settings.minOrder && total < parsed_settings.freeShipping) {
            shippingFee = parsed_settings.shippingFee || 50;
        }

        const finalTotal = total + shippingFee;

        summaryArea.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:10px; color:#64748b; font-size:14px;">
                <span>Ara Toplam:</span>
                <span>₺${subTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
            ${discountTotal > 0 ? `
            <div style="display:flex; justify-content:space-between; margin-bottom:10px; color:#ef4444; font-size:14px; font-weight:700;">
                <span>İndirim:</span>
                <span>-₺${discountTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>` : ''}
            <div style="display:flex; justify-content:space-between; margin-bottom:15px; color:#64748b; font-size:14px;">
                <span>Kargo:</span>
                <span style="${shippingFee === 0 ? 'color:#22c55e; font-weight:800;' : ''}">${shippingFee === 0 ? 'ÜCRETSİZ' : '₺' + shippingFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                <span style="font-weight:900; font-size:18px; color:#1e293b;">Toplam:</span>
                <span style="font-weight:900; font-size:24px; color:var(--primary);">₺${finalTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
        `;
    }
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalCount;
        cartCount.style.display = totalCount > 0 ? 'flex' : 'none';
    }
}

function addToCart(item, name, price, isConcept = false) {
    let finalItem = item;
    // Support for multiple calling patterns
    if (typeof item === 'string' && name && price !== undefined) {
        finalItem = {
            id: item,
            name: name,
            price: parseFloat(price),
            quantity: 1,
            isConcept: isConcept
        };
    } else {
        // If passed as an object, ensure isConcept is preserved
        if (isConcept) finalItem.isConcept = true;
    }

    const existing = cart.find(x => x.id === finalItem.id);
    if (existing) {
        existing.quantity += (finalItem.quantity || 1);
    } else {
        cart.push(finalItem);
    }

    saveCart();
    updateCartDisplay();

    if (finalItem.isConcept) {
        showVIPToast(finalItem.name);
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
    item.quantity += change;
    if (item.quantity <= 0) {
        removeFromCart(id);
    } else {
        saveCart();
        updateCartDisplay();
    }
}

// Global listener for cross-tab sync
window.addEventListener('storage', (e) => {
    if (e.key === 'cart') {
        cart = JSON.parse(e.newValue || '[]');
        updateCartDisplay();
    }
});

function showVIPToast(itemName) {
    const toast = document.createElement('div');
    toast.className = 'vip-toast';
    toast.innerHTML = `
        < div style = "display:flex; align-items:center; gap:15px;" >
            <div class="vip-toast-icon"><i class="fas fa-crown"></i></div>
            <div>
                <div style="font-size:10px; opacity:0.8; font-weight:800; text-transform:uppercase; letter-spacing:1px;">VIP PREMIUM ADDED</div>
                <div style="font-size:15px; font-weight:900;">${itemName}</div>
            </div>
        </div >
        `;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.add('active'); }, 100);
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// Global exposure for onclick handlers in HTML
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateItemQuantity = updateItemQuantity;
window.whatsappCheckout = whatsappCheckout;
window.flyToCart = flyToCart;
window.updateCartDisplay = updateCartDisplay;
