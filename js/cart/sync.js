import { setCart } from './store.js';
import { updateCartDisplay } from './display.js';

export function setupCartSync() {
    window.addEventListener('storage', (e) => {
        if (e.key === 'cart') {
            setCart(JSON.parse(e.newValue || '[]'));
            updateCartDisplay();
        }
    });
}
