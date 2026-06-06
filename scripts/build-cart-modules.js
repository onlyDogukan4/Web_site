import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const lines = fs.readFileSync(path.join(root, 'cart-system.js'), 'utf8').split('\n');
const slice = (a, b) => lines.slice(a, b).join('\n');
const out = path.join(root, 'js', 'cart');
fs.mkdirSync(out, { recursive: true });

fs.writeFileSync(
    path.join(out, 'store.js'),
    `/** Sepet durumu ve hesaplamalar */
let cart = (JSON.parse(localStorage.getItem('cart') || '[]')).map((item) => ({
    ...item,
    price: isNaN(parseFloat(item.price)) || parseFloat(item.price) <= 0 ? 15.0 : parseFloat(item.price),
}));

export function getCart() {
    return cart;
}

export function setCart(next) {
    cart = next;
    saveCart();
}

${slice(9, 12).replace('function saveCart', 'export function saveCart')}
${slice(13, 20).replace('function getSettings', 'export function getSettings')}
${slice(21, 31).replace('async function fetchSettingsFromServer', 'export async function fetchSettingsFromServer')}
${slice(35, 51).replace('function calculateCartTotal', 'export function calculateCartTotal')}

export function getShippingFee(productTotal) {
    const { freeShipping } = getSettings();
    return productTotal < freeShipping ? 150 : 0;
}
`
);

fs.writeFileSync(path.join(out, 'toast.js'), slice(54, 175).replace('function showVIPToast', 'export function showVIPToast'));
fs.writeFileSync(path.join(out, 'animation.js'), slice(178, 213).replace('function flyToCart', 'export function flyToCart'));

const displayBody = slice(216, 488)
    .replace(/\bcart\b/g, 'getCart()')
    .replace(/getCart\(\)\.forEach/g, 'getCart().forEach')
    .replace(/getCart\(\)\.length/g, 'getCart().length')
    .replace(/getCart\(\)\.reduce/g, 'getCart().reduce');
// fix double getCart() in forEach - cart.forEach became getCart().forEach - good

fs.writeFileSync(
    path.join(out, 'display.js'),
    `import { getCart, getSettings, calculateCartTotal } from './store.js';
import { getShippingFee } from './store.js';

${displayBody
    .replace('function updateCartDisplay', 'export function updateCartDisplay')
    .replace('function _renderSummary', 'export function _renderSummary')}`
);

let opsBody = slice(491, 588);
opsBody = opsBody.replace(
    /cart = cart\.filter\(([^)]+)\);/,
    'setCart(getCart().filter($1));'
);
opsBody = opsBody.replace(/\bcart\b/g, 'getCart()');

fs.writeFileSync(
    path.join(out, 'operations.js'),
    `import { getCart, setCart, saveCart } from './store.js';
import { updateCartDisplay } from './display.js';
import { flyToCart } from './animation.js';
import { showVIPToast } from './toast.js';

${opsBody
    .replace('function addToCart', 'export function addToCart')
    .replace('async function addPackageToCart', 'export async function addPackageToCart')
    .replace('function removeFromCart', 'export function removeFromCart')
    .replace('function updateItemQuantity', 'export function updateItemQuantity')
    .replace(
        'setCart(getCart().filter(item => item.id !== id);',
        'setCart(getCart().filter((item) => item.id !== id));'
    )}`
);

fs.writeFileSync(
    path.join(out, 'checkout-whatsapp.js'),
    `import { getCart, getSettings, calculateCartTotal } from './store.js';
import { getShippingFee } from './store.js';

${slice(589, 627).replace('function whatsappCheckout', 'export function whatsappCheckout').replace(/\bcart\b/g, 'getCart()')}`
);

fs.writeFileSync(
    path.join(out, 'checkout-paytr.js'),
    `import { getCart, getSettings, calculateCartTotal } from './store.js';
import { getShippingFee } from './store.js';

${slice(679, 920)
    .replace('async function payWithPayTR', 'export async function payWithPayTR')
    .replace(/\bcart\b/g, 'getCart()')
    .replace('cart: getCart()', 'cart: getCart()')}`
);

fs.writeFileSync(
    path.join(out, 'styles.js'),
    slice(637, 670).replace('(function injectStyles', 'export function injectCartStyles').replace('})();', '}')
);

fs.writeFileSync(
    path.join(out, 'sync.js'),
    `import { setCart } from './store.js';
import { updateCartDisplay } from './display.js';

export function setupCartSync() {
    window.addEventListener('storage', (e) => {
        if (e.key === 'cart') {
            setCart(JSON.parse(e.newValue || '[]'));
            updateCartDisplay();
        }
    });
}
`
);

fs.writeFileSync(
    path.join(out, 'index.js'),
    `import { fetchSettingsFromServer } from './store.js';
import { injectCartStyles } from './styles.js';
import { setupCartSync } from './sync.js';
import { addToCart, addPackageToCart, removeFromCart, updateItemQuantity } from './operations.js';
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
    whatsappCheckout,
    payWithPayTR,
    flyToCart,
});
`
);

console.log('js/cart modülleri oluşturuldu');
