import { getCart, saveCart } from '../cart/store.js';
import { updateCartDisplay } from '../cart/display.js';
import { flyToCart } from '../cart/animation.js';
import { state } from './state.js';

export function addToCart(productId, productName, productPrice) {
    const p = state.products.find((x) => String(x.id) === String(productId));
    const name = p?.name_tr || productName || 'Ürün';
    const price = parseFloat(p?.price ?? productPrice);
    const image = p?.image || 'images/bardak.png';
    if (isNaN(price)) return;

    let img = null;
    const modal = document.getElementById('product-detail-modal');
    if (modal && modal.style.display === 'block') {
        img = document.getElementById('detail-img');
    }
    if (!img) {
        const btn = document.querySelector(`.add-to-cart[onclick*="'${productId}'"]`);
        img = btn?.closest('.product-card')?.querySelector('img');
    }
    if (img) flyToCart(img);

    const cartItems = getCart();
    const existing = cartItems.find((i) => String(i.id) === String(productId));
    if (existing) {
        existing.quantity++;
    } else {
        cartItems.push({ id: String(productId), name, image, price, quantity: 1 });
    }
    saveCart();
    updateCartDisplay();
    document.body.classList.add('cart-open');
}

export function addPackageToCart(packageId) {
    const pkg = state.packages.find((p) => String(p.id) === String(packageId));
    if (!pkg) return;

    const itemIds = (pkg.items || '').split(',').map((s) => s.trim());
    const packageItems = itemIds
        .map((id) => {
            const p = state.products.find((x) => String(x.id) === id);
            if (!p) return null;
            const qty = window.onCardQuantities[`${packageId}-${p.id}`] || 1;
            return { id: p.id, name: p.name_tr, price: p.price, image: p.image, quantity: qty };
        })
        .filter(Boolean);

    const btn = document.querySelector(`button[onclick*="addPackageToCart('${packageId}')"]`);
    const img = btn?.closest('.package-card')?.querySelector('img');
    if (img) flyToCart(img);

    const cartItems = getCart();
    const idx = cartItems.findIndex((x) => String(x.id) === String(pkg.id));
    if (idx > -1) {
        if (pkg.name.toLowerCase().includes('süper')) {
            cartItems[idx].packageItems = packageItems;
            cartItems[idx].quantity = 1;
        } else {
            cartItems[idx].quantity++;
        }
    } else {
        cartItems.push({
            id: String(pkg.id),
            name: pkg.name,
            image: pkg.image || 'images/bardak.png',
            discount: pkg.discount || 0,
            quantity: 1,
            isPackage: true,
            packageItems,
        });
    }
    saveCart();
    updateCartDisplay();
    document.body.classList.add('cart-open');
}

export function registerChatbotBridge() {
    window.addToCartByMatch = (keyword) => {
        const p = state.products.find((x) => x.name_tr.toLowerCase().includes(keyword.toLowerCase()));
        if (p) {
            addToCart(p.id, p.name_tr, p.price);
            return { success: true, name: p.name_tr, id: String(p.id) };
        }
        return { success: false };
    };
}
