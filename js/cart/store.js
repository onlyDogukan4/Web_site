// source of truth
if (typeof window !== 'undefined') {
    if (!window.moderraCart) {
        window.moderraCart = (JSON.parse(localStorage.getItem('cart') || '[]')).map((item) => ({
            ...item,
            price: isNaN(parseFloat(item.price)) || parseFloat(item.price) <= 0 ? 15.0 : parseFloat(item.price),
        }));
    }
}

export function getCart() {
    if (typeof window !== 'undefined') {
        return window.moderraCart;
    }
    // Fallback for Node/Vitest tests
    if (!global.moderraCart) {
        global.moderraCart = (JSON.parse(localStorage.getItem('cart') || '[]')).map((item) => ({
            ...item,
            price: isNaN(parseFloat(item.price)) || parseFloat(item.price) <= 0 ? 15.0 : parseFloat(item.price),
        }));
    }
    return global.moderraCart;
}

export function setCart(next) {
    if (typeof window !== 'undefined') {
        window.moderraCart = next;
    } else {
        global.moderraCart = next;
    }
    saveCart();
}

export function saveCart() {
    const activeCart = getCart();
    if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(activeCart));
    }
}
export function getSettings() {
    try {
        const s = localStorage.getItem('moderra_settings') || localStorage.getItem('settings');
        if (s) return JSON.parse(s);
    } catch (e) {}
    return { minOrder: 500, freeShipping: 1000 };
}
export async function fetchSettingsFromServer() {
    try {
        const res = await fetch('/api/settings?t=' + Date.now());
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('moderra_settings', JSON.stringify(data));
            if (typeof updateCartDisplay === 'function') updateCartDisplay();
        }
    } catch (e) { console.warn('Ayarlar sunucudan alınamadı:', e); }
}
export function calculateCartTotal() {
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

export function getShippingFee(productTotal) {
    const { freeShipping } = getSettings();
    return productTotal < freeShipping ? 150 : 0;
}

/** Türkiye — fiyatlar KDV dahil gösterilir (%20) */
export const KDV_RATE = 0.2;

export function formatMoney(amount) {
    return `₺${parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Ödeme ekranı / sepet özeti için tutar dökümü */
export function calculatePaymentBreakdown() {
    const { subTotal, discountTotal, total } = calculateCartTotal();
    const shipping = getShippingFee(total);
    const grandTotal = total + shipping;
    const kdvAmount = grandTotal - grandTotal / (1 + KDV_RATE);

    return {
        subTotal,
        discountTotal,
        productTotal: total,
        shipping,
        grandTotal,
        kdvAmount: Math.round(kdvAmount * 100) / 100,
        kdvRatePercent: Math.round(KDV_RATE * 100),
        freeShippingLimit: getSettings().freeShipping,
    };
}
