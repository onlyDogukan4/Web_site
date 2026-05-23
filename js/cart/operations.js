import { getCart, setCart, saveCart } from './store.js';
import { updateCartDisplay } from './display.js';
import { flyToCart } from './animation.js';
import { showVIPToast } from './toast.js';

export function addToCart(idOrItem, name, price, isConcept = false) {
    let item = idOrItem;
    if (typeof idOrItem === 'string' || typeof idOrItem === 'number') {
        item = { id: String(idOrItem), name, price: parseFloat(price), quantity: 1, isConcept };
    } else {
        item = { ...item };
        if (isConcept) item.isConcept = true;
        if (!item.quantity) item.quantity = 1;
    }

    const existing = getCart().find(x => x.id === item.id);
    if (existing) {
        existing.quantity += (item.quantity || 1);
    } else {
        getCart().push(item);
    }

    saveCart();
    updateCartDisplay();

    if (item.isConcept) {
        if (typeof showVIPToast === 'function') showVIPToast(item.name);
    }
}

export async function addPackageToCart(packageId) {
    try {
        const [pkgRes, prodRes] = await Promise.all([
            fetch('/api/packages'),
            fetch('/api/products')
        ]);
        const packages = await pkgRes.json();
        const products = await prodRes.json();

        const pkg = packages.find(p => String(p.id) === String(packageId));
        if (!pkg) return;

        const itemIds = (pkg.items || '').split(',').map(id => id.trim()).filter(Boolean);
        const packageItems = itemIds.reduce((acc, id) => {
            const p = products.find(x => String(x.id) === id);
            if (p) {
                const qty = (window.onCardQuantities || {})[`${packageId}-${p.id}`] || 1;
                acc.push({ id: p.id, name: p.name_tr, price: p.price, image: p.image, quantity: qty });
            }
            return acc;
        }, []);

        const card = document.querySelector(`button[onclick*="addPackageToCart('${packageId}')"]`)?.closest('.package-card');
        const img = card ? card.querySelector('img') : null;
        if (img) flyToCart(img);

        const existingIdx = getCart().findIndex(x => String(x.id) === String(pkg.id));
        const isUnique = (pkg.name || '').toLowerCase().includes('süper');

        if (existingIdx > -1) {
            if (isUnique) {
                getCart()[existingIdx].packageItems = packageItems;
                getCart()[existingIdx].quantity = 1;
            } else {
                getCart()[existingIdx].quantity++;
            }
        } else {
            getCart().push({
                id: String(pkg.id), name: pkg.name,
                image: pkg.image || 'images/bardak.png',
                discount: pkg.discount || 0,
                quantity: 1, isPackage: true, packageItems
            });
        }

        saveCart();
        setTimeout(() => {
            updateCartDisplay();
            document.body.classList.add('cart-open');
        }, 800);
    } catch (e) {
        console.error('addPackageToCart hatası:', e);
    }
}

export function removeFromCart(id) {
    setCart(getCart().filter((item) => item.id !== id));
    updateCartDisplay();
}

export function updateItemQuantity(id, change) {
    const item = getCart().find(x => x.id === id);
    if (!item) return;
    item.quantity = Math.max(0, item.quantity + change);
    if (item.quantity === 0) {
        removeFromCart(id);
    } else {
        saveCart();
        updateCartDisplay();
    }
}