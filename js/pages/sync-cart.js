import { getCart, setCart } from '../cart/store.js';
import { updateCartDisplay } from '../cart/display.js';
import { state } from './state.js';

export function syncCartPrices() {
    let changed = false;
    let next = getCart().map((item) => {
        if (item.isConcept || item.isPackage) return item;
        const product = state.products.find((p) => String(p.id) === String(item.id));
        if (product) {
            const newPrice = parseFloat(product.price);
            if (!isNaN(newPrice) && newPrice !== parseFloat(item.price)) {
                changed = true;
                return { ...item, price: newPrice };
            }
        }
        return item;
    });

    next = next.map((item) => {
        if (!item.isPackage || !Array.isArray(item.packageItems)) return item;
        let pkgChanged = false;
        const newItems = item.packageItems.map((si) => {
            const product = state.products.find((p) => String(p.id) === String(si.id));
            if (product) {
                const newPrice = parseFloat(product.price);
                if (!isNaN(newPrice) && newPrice !== parseFloat(si.price)) {
                    pkgChanged = true;
                    return { ...si, price: newPrice };
                }
            }
            return si;
        });
        if (pkgChanged) {
            changed = true;
            return { ...item, packageItems: newItems };
        }
        return item;
    });

    if (changed) {
        setCart(next);
        updateCartDisplay();
    }
}
