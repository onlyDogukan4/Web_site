
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
            itemTotal = parseFloat(item.price) * item.quantity;
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
        if (item.isConcept) message += `   └ ✨ VIP Özel Logo Tasarım\n`;
    });
    message += `\n*💰 Toplam: ₺${total.toFixed(2)}*\n\n`;
    message += `👤 Müşteri: ${userData.name}\n📞 Tel: ${userData.phone}\n🏠 Adres: ${userData.address}`;

    window.open(`https://wa.me/905304640120?text=${encodeURIComponent(message)}`, '_blank');
}

// Inject premium cart styles once
(function injectCartStyles() {
    if (document.getElementById('moderra-cart-styles')) return;
    const style = document.createElement('style');
    style.id = 'moderra-cart-styles';
    style.textContent = `
        /* === VIP CONCEPT ITEM === */
        .cart-item-card {
            background: white;
            border-radius: 20px;
            padding: 18px;
            margin-bottom: 14px;
            border: 1px solid #f1f5f9;
            transition: all 0.3s ease;
            position: relative;
            overflow: visible;
        }
        .cart-item-card:hover {
            border-color: #c7d2fe;
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.06);
        }
        .vip-concept-frame {
            background: linear-gradient(#fffdf5, #fffdf5) padding-box,
                        linear-gradient(135deg, #b8860b, #ffd700, #daa520, #ffd700, #b8860b) border-box !important;
            border: 2px solid transparent !important;
            box-shadow: 0 8px 28px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.9) !important;
            animation: vipPulse 3s ease-in-out infinite;
        }
        .vip-concept-frame:hover {
            box-shadow: 0 14px 40px rgba(212,175,55,0.35), inset 0 1px 0 rgba(255,255,255,0.9) !important;
            transform: translateY(-3px) !important;
        }
        @keyframes vipPulse {
            0%, 100% { box-shadow: 0 8px 28px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.9); }
            50% { box-shadow: 0 12px 36px rgba(212,175,55,0.40), inset 0 1px 0 rgba(255,255,255,0.9); }
        }

        /* === VIP TOP BADGE === */
        .vip-badge {
            position: absolute;
            top: -12px;
            left: 16px;
            background: linear-gradient(135deg, #b8860b, #ffd700, #daa520);
            color: #1a0e00;
            padding: 4px 14px;
            border-radius: 30px;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            z-index: 10;
            box-shadow: 0 4px 12px rgba(180,135,0,0.4);
            border: 1px solid rgba(255,255,255,0.5);
            display: flex;
            align-items: center;
            gap: 5px;
            white-space: nowrap;
        }

        /* === VIP TOAST NOTIFICATION === */
        .vip-toast {
            position: fixed;
            bottom: 30px;
            left: 50%;
            top: auto;
            right: auto;
            transform: translateX(-50%) translateY(100px);
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            color: white;
            padding: 18px 28px;
            border-radius: 20px;
            z-index: 999999;
            opacity: 0;
            transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            border: 1px solid rgba(212,175,55,0.4);
            box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(212,175,55,0.1);
            min-width: 320px;
            max-width: 90vw;
            backdrop-filter: blur(10px);
        }
        .vip-toast.active {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        .vip-toast-icon {
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #b8860b, #ffd700);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            color: #1a0e00;
            flex-shrink: 0;
            box-shadow: 0 4px 15px rgba(212,175,55,0.4);
        }
        .vip-toast-sparkle {
            position: absolute;
            top: -8px; right: -8px;
            font-size: 18px;
            animation: sparkleRotate 2s linear infinite;
        }
        @keyframes sparkleRotate {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.2); }
            100% { transform: rotate(360deg) scale(1); }
        }

        /* === QUANTITY CONTROLS === */
        .qty-btn {
            background: #f1f5f9;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 900;
            font-size: 16px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #1e293b;
        }
        .qty-btn:hover { background: var(--primary, #6366f1); color: white; transform: scale(1.1); }
        .quantity-control {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #f8fafc;
            border-radius: 12px;
            padding: 4px 8px;
            border: 1px solid #e2e8f0;
        }

        /* === CART AI ADVISOR === */
        .cart-ai-advisor {
            margin: 0 0 16px 0;
            padding: 14px 18px;
            background: linear-gradient(135deg, #f0f4ff, #e8edff);
            border-radius: 16px;
            border: 1px solid #c7d2fe;
            display: flex;
            gap: 12px;
            align-items: flex-start;
            min-height: 52px;
        }
        .cart-ai-avatar {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: linear-gradient(135deg, #6366f1, #818cf8);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
            box-shadow: 0 4px 10px rgba(99,102,241,0.3);
        }
        .cart-ai-text {
            font-size: 13px;
            color: #3730a3;
            font-weight: 600;
            line-height: 1.5;
            flex: 1;
        }
        .cart-ai-typing {
            display: flex;
            gap: 4px;
            align-items: center;
            height: 20px;
        }
        .cart-ai-typing span {
            width: 6px; height: 6px;
            border-radius: 50%;
            background: #6366f1;
            animation: cartTyping 1.2s ease-in-out infinite;
        }
        .cart-ai-typing span:nth-child(2) { animation-delay: 0.2s; }
        .cart-ai-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes cartTyping {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
            30% { transform: translateY(-6px); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
})();

async function updateCartDisplay() {
    const list = document.getElementById('cart-items-list');
    const cartCount = document.getElementById('cart-count');
    const checkoutBtn = document.getElementById('whatsapp-checkout');

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

    // Progress Bar Logic
    const shipProgress = Math.min((total / freeShip) * 100, 100);
    const remainingShip = freeShip - total;
    const minProgress = Math.min((total / minOrder) * 100, 100);
    const remainingMin = minOrder - total;

    let headerHTML = '';
    if (total < minOrder) {
        headerHTML = `
            <div style="padding:18px 20px; background:linear-gradient(135deg,#fff1f2,#ffe4e6); border-bottom:1px solid #fecdd3;">
                <div style="font-size:12px;color:#9f1239;margin-bottom:8px;font-weight:800;display:flex;justify-content:space-between;align-items:center;">
                    <span>⚠️ Minimum Sipariş için Eksik</span>
                    <span style="font-size:15px;">₺${remainingMin.toLocaleString('tr-TR')}</span>
                </div>
                <div style="width:100%;height:7px;background:#fecdd3;border-radius:10px;overflow:hidden;">
                    <div style="width:${minProgress}%;height:100%;background:linear-gradient(90deg,#f43f5e,#e11d48);border-radius:10px;transition:width 0.6s;"></div>
                </div>
            </div>
        `;
    } else if (total < freeShip) {
        headerHTML = `
            <div style="padding:18px 20px; background:linear-gradient(135deg,#fefce8,#fef9c3); border-bottom:1px solid #fde047;">
                <div style="font-size:12px;color:#854d0e;margin-bottom:8px;font-weight:800;display:flex;justify-content:space-between;align-items:center;">
                    <span>🚀 Ücretsiz Kargo İçin</span>
                    <span style="font-size:15px;">₺${remainingShip.toLocaleString('tr-TR')}</span>
                </div>
                <div style="width:100%;height:7px;background:rgba(255,255,255,0.6);border-radius:10px;overflow:hidden;">
                    <div style="width:${shipProgress}%;height:100%;background:linear-gradient(90deg,#f59e0b,#d97706);border-radius:10px;transition:width 0.6s;"></div>
                </div>
            </div>
        `;
    } else {
        headerHTML = `
            <div style="padding:18px 20px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-bottom:1px solid #bbf7d0;text-align:center;">
                <div style="font-size:14px;color:#166534;font-weight:900;display:flex;align-items:center;justify-content:center;gap:8px;">
                    <span style="font-size:20px;">🎉</span> KARGO BİZDEN! Ücretsiz teslimat kazandınız.
                </div>
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
        list.innerHTML += `
            <div style="text-align:center;padding:80px 20px;color:#cbd5e1;">
                <div style="font-size:64px;margin-bottom:20px;">🛒</div>
                <p style="font-weight:800;font-size:16px;color:#94a3b8;">Sepetiniz şu an boş</p>
                <p style="font-size:13px;color:#cbd5e1;margin-top:8px;">Ürünleri keşfetmek için alışverişe başlayın</p>
            </div>`;
        if (cartCount) cartCount.style.display = 'none';
        if (checkoutBtn) checkoutBtn.style.display = 'none';
    } else {
        // AI Advisor Panel (only if element exists in page)
        const aiAdvisorEl = document.getElementById('cart-ai-advisor-wrap');
        if (aiAdvisorEl) {
            aiAdvisorEl.innerHTML = `
                <div class="cart-ai-advisor">
                    <div class="cart-ai-avatar">🤖</div>
                    <div>
                        <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#6366f1;margin-bottom:4px;">Mr. Karton Öneriyor</div>
                        <div class="cart-ai-text" id="mr-karton-ai-text">
                            <div class="cart-ai-typing"><span></span><span></span><span></span></div>
                        </div>
                    </div>
                </div>
            `;
        }

        cart.forEach((item) => {
            const itemTotal = item.isPackage
                ? (item.packageItems.reduce((acc, si) => acc + (parseFloat(si.price) * si.quantity), 0) * (1 - ((item.discount || 0) / 100)) * item.quantity)
                : (parseFloat(item.price) * item.quantity);

            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item-card' + (item.isConcept ? ' vip-concept-frame' : '');

            if (item.isPackage) {
                itemElement.innerHTML = `
                    <div style="display:flex;align-items:flex-start;justify-content:space-between;width:100%;gap:15px;">
                        <div style="display:flex;gap:14px;flex:1;">
                            <img src="${item.image || 'images/box.png'}" style="width:68px;height:68px;object-fit:contain;border-radius:14px;background:#f8fafc;padding:8px;border:1px solid #e2e8f0;" loading="lazy">
                            <div>
                                <div style="font-weight:900;font-size:15px;color:#1e293b;line-height:1.3;">${item.name}</div>
                                <div style="font-size:11px;color:#64748b;margin-top:4px;">${item.packageItems ? item.packageItems.length + ' ürün dahil' : ''}</div>
                                <div class="quantity-control" style="margin-top:10px;">
                                    <button class="qty-btn" style="width:26px;height:26px;" onclick="updateItemQuantity('${item.id}', -1)">−</button>
                                    <span style="font-weight:900;font-size:14px;min-width:28px;text-align:center;">${item.quantity}</span>
                                    <button class="qty-btn" style="width:26px;height:26px;" onclick="updateItemQuantity('${item.id}', 1)">+</button>
                                </div>
                            </div>
                        </div>
                        <div style="text-align:right;flex-shrink:0;">
                            <div style="font-size:18px;font-weight:900;color:var(--primary);">₺${itemTotal.toLocaleString('tr-TR',{minimumFractionDigits:2})}</div>
                            <button onclick="removeFromCart('${item.id}')" style="background:none;border:none;cursor:pointer;color:#cbd5e1;font-size:13px;margin-top:10px;padding:4px;transition:0.3s;border-radius:6px;" onmouseover="this.style.color='#ef4444';this.style.background='#fff1f2'" onmouseout="this.style.color='#cbd5e1';this.style.background='none'">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `;
            } else if (item.isConcept) {
                // === PREMIUM VIP CONCEPT ITEM ===
                itemElement.innerHTML = `
                    <div class="vip-badge"><i class="fas fa-crown"></i> VIP ÖZEL LOGO</div>
                    <div style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:14px;padding-top:8px;">
                        <div style="display:flex;align-items:center;gap:14px;flex:1;">
                            <div style="position:relative;flex-shrink:0;">
                                <div style="width:72px;height:72px;border-radius:18px;background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid rgba(212,175,55,0.4);display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 4px 12px rgba(212,175,55,0.2);">
                                    <img src="${item.image || 'images/bardak.png'}" style="width:100%;height:100%;object-fit:contain;padding:6px;" loading="lazy">
                                </div>
                                <div style="position:absolute;bottom:-4px;right:-4px;width:22px;height:22px;background:linear-gradient(135deg,#b8860b,#ffd700);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.15);">
                                    <i class="fas fa-star" style="font-size:9px;color:#1a0e00;"></i>
                                </div>
                            </div>
                            <div style="flex:1;min-width:0;">
                                <div style="font-weight:900;font-size:14px;color:#1a1a1a;line-height:1.3;margin-bottom:4px;">${item.name}</div>
                                ${item.note ? `
                                <div style="font-size:11px;color:#7c5f00;background:linear-gradient(135deg,#fffbeb,#fef3c7);padding:6px 10px;border-radius:10px;margin-bottom:8px;border-left:3px solid #d4af37;font-style:italic;">"${item.note}"</div>
                                ` : ''}
                                <div class="quantity-control" style="margin-top:6px;border-color:rgba(212,175,55,0.3);">
                                    <button class="qty-btn" style="width:26px;height:26px;" onclick="updateItemQuantity('${item.id}', -1)">−</button>
                                    <span style="font-weight:900;font-size:14px;min-width:28px;text-align:center;color:#b8860b;">${item.quantity}</span>
                                    <button class="qty-btn" style="width:26px;height:26px;" onclick="updateItemQuantity('${item.id}', 1)">+</button>
                                </div>
                            </div>
                        </div>
                        <div style="text-align:right;flex-shrink:0;">
                            <div style="font-size:20px;font-weight:900;background:linear-gradient(135deg,#b8860b,#d4af37);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">₺${itemTotal.toLocaleString('tr-TR',{minimumFractionDigits:2})}</div>
                            <button onclick="removeFromCart('${item.id}')" style="background:none;border:none;cursor:pointer;color:#cbd5e1;font-size:12px;margin-top:10px;padding:4px;transition:0.3s;border-radius:6px;" onmouseover="this.style.color='#ef4444';this.style.background='#fff1f2'" onmouseout="this.style.color='#cbd5e1';this.style.background='none'">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `;
            } else {
                // === REGULAR ITEM ===
                itemElement.innerHTML = `
                    <div style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:14px;">
                        <div style="display:flex;align-items:center;gap:14px;flex:1;">
                            <img src="${item.image || 'images/bardak.png'}" style="width:66px;height:66px;object-fit:contain;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;padding:6px;flex-shrink:0;" loading="lazy">
                            <div style="flex:1;min-width:0;">
                                <div style="font-weight:800;font-size:14px;color:#1e293b;line-height:1.3;margin-bottom:8px;">${item.name}</div>
                                <div class="quantity-control">
                                    <button class="qty-btn" style="width:26px;height:26px;" onclick="updateItemQuantity('${item.id}', -1)">−</button>
                                    <span style="font-weight:900;font-size:14px;min-width:28px;text-align:center;">${item.quantity}</span>
                                    <button class="qty-btn" style="width:26px;height:26px;" onclick="updateItemQuantity('${item.id}', 1)">+</button>
                                </div>
                            </div>
                        </div>
                        <div style="text-align:right;flex-shrink:0;">
                            <div style="font-size:19px;font-weight:900;color:var(--primary);">₺${itemTotal.toLocaleString('tr-TR',{minimumFractionDigits:2})}</div>
                            <button onclick="removeFromCart('${item.id}')" style="background:none;border:none;cursor:pointer;color:#cbd5e1;font-size:12px;margin-top:10px;padding:4px;transition:0.3s;border-radius:6px;" onmouseover="this.style.color='#ef4444';this.style.background='#fff1f2'" onmouseout="this.style.color='#cbd5e1';this.style.background='none'">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `;
            }
            list.appendChild(itemElement);
        });

        if (checkoutBtn) checkoutBtn.style.display = 'flex';
    }

    // Update Summary
    const summaryArea = document.getElementById('cart-total-price-area');
    if (summaryArea) {
        summaryArea.innerHTML = `
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;color:#64748b;font-size:13px;">
                <span>Ara Toplam</span>
                <span>₺${subTotal.toLocaleString('tr-TR',{minimumFractionDigits:2})}</span>
            </div>
            ${discountTotal > 0 ? `
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;color:#16a34a;font-size:13px;font-weight:700;">
                <span>🎁 İndirim</span>
                <span>−₺${discountTotal.toLocaleString('tr-TR',{minimumFractionDigits:2})}</span>
            </div>` : ''}
            <div style="display:flex;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:2px dashed #e2e8f0;align-items:center;">
                <span style="font-weight:800;font-size:18px;color:#0f172a;">TOPLAM</span>
                <span style="font-weight:900;font-size:24px;color:var(--primary);">₺${total.toLocaleString('tr-TR',{minimumFractionDigits:2})}</span>
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
    if (typeof item === 'string' && name && price !== undefined) {
        finalItem = { id: item, name, price: parseFloat(price), quantity: 1, isConcept };
    } else {
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

// Cross-tab sync
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
        <div class="vip-toast-sparkle">✨</div>
        <div style="display:flex;align-items:center;gap:14px;">
            <div class="vip-toast-icon"><i class="fas fa-crown"></i></div>
            <div>
                <div style="font-size:9px;opacity:0.7;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#ffd700;margin-bottom:3px;">VIP PREMIUM SEPETE EKLENDİ</div>
                <div style="font-size:15px;font-weight:900;line-height:1.2;">${itemName}</div>
                <div style="font-size:11px;opacity:0.6;margin-top:3px;">Özel logolu tasarım siparişiniz alındı ✓</div>
            </div>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('active'), 50);
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 500);
    }, 4500);
}

// Global exposure
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateItemQuantity = updateItemQuantity;
window.whatsappCheckout = whatsappCheckout;
window.flyToCart = flyToCart;
window.updateCartDisplay = updateCartDisplay;
