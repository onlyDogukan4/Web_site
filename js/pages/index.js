import { addToCart, addPackageToCart, registerChatbotBridge } from './cart-actions.js';
import { initCart } from './cart-ui.js';
import { loadData, startUpdatePolling } from './data.js';
import { initLang } from './lang.js';
import { initActiveNav } from './nav-active.js';
import { adjustPkgQty, renderPackages } from './packages.js';
import { initDetailModal, openProductDetail } from './product-detail.js';
import { initProfile } from './profile.js';
import { filterCategory, renderProducts } from './products.js';
import { initSearch } from './search.js';
import { initSlider } from './slider.js';
import { state } from './state.js';
import { syncCartPrices } from './sync-cart.js';
import { initTheme } from './theme.js';

document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    initLang(() => {
        renderProducts();
        renderPackages();
    });
    initSlider();
    initActiveNav();
    initCart();
    initProfile();
    initSearch();
    initDetailModal();
    registerChatbotBridge();

    await loadData();
    renderProducts();
    renderPackages();

    startUpdatePolling({
        syncCartPrices,
        renderProducts,
        renderPackages,
    });
});

Object.assign(window, {
    addToCart,
    addPackageToCart,
    openProductDetail,
    filterCategory,
    adjustPkgQty,
    renderProducts,
});

Object.defineProperty(window, '_page', {
    get: () => state.page,
    set: (v) => {
        state.page = v;
    },
});
