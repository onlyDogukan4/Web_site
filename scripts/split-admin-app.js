import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const lines = fs
    .readFileSync(path.join(root, 'js', 'admin', 'app.js'), 'utf8')
    .split('\n')
    .map((l) => l.replace(/^        /, ''));

const chunks = [
    { file: 'state.js', start: 0, end: 13 },
    { file: 'auth.js', start: 14, end: 30 },
    { file: 'core.js', start: 31, end: 297 },
    { file: 'products.js', start: 298, end: 373 },
    { file: 'campaigns.js', start: 374, end: 559 },
    { file: 'utils.js', start: 560, end: 734 },
    { file: 'packages.js', start: 735, end: 792 },
    { file: 'payment-links.js', start: 793, end: 881 },
    { file: 'settings.js', start: 882, end: 934 },
    { file: 'orders.js', start: 935, end: 1055 },
    { file: 'modals.js', start: 1056, end: lines.length },
];

const stateFields = [
    'categories',
    'products',
    'orders',
    'campaigns',
    'packages',
    'concepts',
    'settings',
    'curIdx',
    'curImg',
    'editCampaignIdx',
    'editPkgIdx',
    'editConIdx',
    'editOrderId',
];

const stateBody = `/** Admin panel paylaşılan durum */
export const Admin = {
    PASS: '123456',
    categories: [],
    products: [],
    orders: [],
    campaigns: [],
    packages: [],
    concepts: [],
    settings: { minOrder: 500, freeShipping: 1000 },
    curIdx: -1,
    curImg: '',
    editCampaignIdx: -1,
    editPkgIdx: -1,
    editConIdx: -1,
    editOrderId: null,
};
`;

const outDir = path.join(root, 'js', 'admin');
fs.writeFileSync(path.join(outDir, 'state.js'), stateBody);

function toAdminRefs(code) {
    let out = code;
    for (const f of stateFields) {
        const re = new RegExp(`(?<![.\\w/'"])\\b${f}\\b(?![.\\w'"])`, 'g');
        out = out.replace(re, `Admin.${f}`);
    }
    out = out.replace(/\bPASS\b/g, 'Admin.PASS');
    return out
        .replace(/^function /gm, 'export function ')
        .replace(/^async function /gm, 'export async function ');
}

for (const c of chunks) {
    if (c.file === 'state.js') continue;
    let body = lines.slice(c.start, c.end).join('\n').trim();
    if (!body) continue;
    body = toAdminRefs(body);
    const content = `import { Admin } from './state.js';\n\n${body}\n`;
    fs.writeFileSync(path.join(outDir, c.file), content);
}

const index = `import { Admin } from './state.js';
import * as auth from './auth.js';
import * as core from './core.js';
import * as products from './products.js';
import * as campaigns from './campaigns.js';
import * as utils from './utils.js';
import * as packages from './packages.js';
import * as paymentLinks from './payment-links.js';
import * as settings from './settings.js';
import * as orders from './orders.js';
import * as modals from './modals.js';

const modules = [auth, core, products, campaigns, utils, packages, paymentLinks, settings, orders, modals];

for (const mod of modules) {
    for (const [key, val] of Object.entries(mod)) {
        if (typeof val === 'function') window[key] = val;
    }
}

if (sessionStorage.getItem('adm_logged')) {
    document.getElementById('login-overlay').style.display = 'none';
    core.init();
}
`;

fs.writeFileSync(path.join(outDir, 'index.js'), index);
fs.unlinkSync(path.join(outDir, 'app.js'));
console.log('Admin modülleri:', chunks.map((c) => c.file).join(', '));
