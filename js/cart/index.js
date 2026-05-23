import { fetchSettingsFromServer } from './store.js';
import { injectCartStyles } from './styles.js';
import { setupCartSync } from './sync.js';
import { addToCart, addPackageToCart, removeFromCart, updateItemQuantity } from './operations.js';
import { updateCartDisplay } from './display.js';
import { whatsappCheckout } from './checkout-whatsapp.js';
import { payWithPayTR } from './checkout-paytr.js';
import { flyToCart } from './animation.js';

injectCartStyles();
fetchSettingsFromServer();
setInterval(fetchSettingsFromServer, 60000);
setupCartSync();

Object.assign(window, {
    addToCart,
    addPackageToCart,
    removeFromCart,
    updateItemQuantity,
    updateCartDisplay,
    whatsappCheckout,
    payWithPayTR,
    flyToCart,
});
