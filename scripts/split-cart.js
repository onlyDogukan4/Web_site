import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'cart-system.js'), 'utf8');
const lines = src.split('\n');

const markers = [
    { file: 'store.js', start: 0, end: 51 },
    { file: 'toast.js', start: 52, end: 176 },
    { file: 'animation.js', start: 177, end: 214 },
    { file: 'display.js', start: 215, end: 489 },
    { file: 'operations.js', start: 490, end: 589 },
    { file: 'checkout-whatsapp.js', start: 590, end: 628 },
    { file: 'sync.js', start: 629, end: 636 },
    { file: 'styles.js', start: 637, end: 671 },
    { file: 'checkout-paytr.js', start: 680, end: 921 },
];

const outDir = path.join(root, 'js', 'cart');
fs.mkdirSync(outDir, { recursive: true });

for (const m of markers) {
    let chunk = lines.slice(m.start, m.end).join('\n').trim();
    if (m.file === 'store.js') {
        chunk = chunk.replace(/^let cart =/, 'export let cart =');
        chunk = chunk.replace(/^function saveCart/, 'export function saveCart');
        chunk = chunk.replace(/^function getSettings/, 'export function getSettings');
        chunk = chunk.replace(/^async function fetchSettingsFromServer/, 'export async function fetchSettingsFromServer');
        chunk = chunk.replace(/^function calculateCartTotal/, 'export function calculateCartTotal');
        // getShippingFee is in display section - add to store from display file manually
    }
    if (m.file === 'toast.js') {
        chunk = 'export ' + chunk.replace(/^function showVIPToast/, 'function showVIPToast');
    }
    if (m.file === 'animation.js') {
        chunk = 'export ' + chunk.replace(/^function flyToCart/, 'function flyToCart');
    }
    if (m.file === 'display.js') {
        chunk = chunk
            .replace(/^function updateCartDisplay/, 'export function updateCartDisplay')
            .replace(/^function getShippingFee/, 'export function getShippingFee')
            .replace(/^function _renderSummary/, 'export function _renderSummary');
        chunk = `import { cart, getSettings, calculateCartTotal } from './store.js';\n\n${chunk}`;
    }
    if (m.file === 'operations.js') {
        chunk = `import { cart, saveCart } from './store.js';\nimport { updateCartDisplay } from './display.js';\nimport { flyToCart } from './animation.js';\nimport { showVIPToast } from './toast.js';\n\n` + chunk
            .replace(/^function addToCart/, 'export function addToCart')
            .replace(/^async function addPackageToCart/, 'export async function addPackageToCart')
            .replace(/^function removeFromCart/, 'export function removeFromCart')
            .replace(/^function updateItemQuantity/, 'export function updateItemQuantity');
    }
    if (m.file === 'checkout-whatsapp.js') {
        chunk = `import { cart, getSettings, calculateCartTotal } from './store.js';\nimport { getShippingFee } from './display.js';\n\n` + chunk.replace(/^function whatsappCheckout/, 'export function whatsappCheckout');
    }
    if (m.file === 'sync.js') {
        chunk = `import { updateCartDisplay } from './display.js';\n\n` + chunk.replace(/^let cart =/, '// cart from store').replace(/cart = JSON.parse/, 'import("./store.js").then(m => { m.cart = JSON.parse');
        // sync is tricky - rewrite manually
    }
    fs.writeFileSync(path.join(outDir, m.file), chunk + '\n');
}

console.log('Cart partial split done — index.js manuel tamamlanacak');
