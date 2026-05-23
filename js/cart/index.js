import { fetchSettingsFromServer } from './store.js';
import { injectCartStyles } from './styles.js';
import { setupCartSync } from './sync.js';
import { addToCart, addPackageToCart, removeFromCart, updateItemQuantity } from './operations.js';
import { updateCartDisplay } from './display.js';
import { whatsappCheckout } from './checkout-whatsapp.js';
import { payWithPayTR } from './checkout-paytr.js';
import { flyToCart } from './animation.js';

function openCart() {
    document.body.classList.add('cart-open');
    updateCartDisplay();
}

function closeCart() {
    document.body.classList.remove('cart-open');
}

function bindCartUi() {
    document.getElementById('open-cart-modal')?.addEventListener('click', openCart);
    document.getElementById('cart-close-btn')?.addEventListener('click', closeCart);
    document.getElementById('cart-overlay')?.addEventListener('click', closeCart);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('cart-open')) closeCart();
    });
}

function scheduleSettingsSync() {
    if (document.hidden) return;
    fetchSettingsFromServer();
}

injectCartStyles();
bindCartUi();
setupCartSync();
scheduleSettingsSync();
updateCartDisplay();

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleSettingsSync();
});

setInterval(scheduleSettingsSync, 60000);

Object.assign(window, {
    addToCart,
    addPackageToCart,
    removeFromCart,
    updateItemQuantity,
    updateCartDisplay,
    whatsappCheckout,
    payWithPayTR,
    flyToCart,
    openCart,
    closeCart,
});
