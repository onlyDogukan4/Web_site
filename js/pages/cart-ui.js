import { updateCartDisplay } from '../cart/display.js';

export function initCart() {
    document.getElementById('open-cart-modal')?.addEventListener('click', () => {
        document.body.classList.add('cart-open');
        updateCartDisplay();
    });
}
