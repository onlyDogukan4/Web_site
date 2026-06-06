import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = fs.readFileSync(path.join(root, 'js', 'admin', 'app.js'), 'utf8');
const lines = raw.split('\n').map((l) => l.replace(/^        /, ''));

const chunks = [
    { name: 'state.js', start: 0, end: 13, header: '// Admin paylaşılan durum\n' },
    { name: 'auth.js', start: 14, end: 30, imports: ['./state.js'] },
    { name: 'core.js', start: 31, end: 297, imports: ['./state.js'] },
    { name: 'products.js', start: 298, end: 373, imports: ['./state.js', './core.js'] },
    { name: 'campaigns.js', start: 374, end: 559, imports: ['./state.js', './core.js'] },
    { name: 'utils.js', start: 560, end: 734, imports: ['./state.js'] },
    { name: 'packages.js', start: 735, end: 792, imports: ['./state.js', './core.js'] },
    { name: 'payment-links.js', start: 793, end: 881, imports: [] },
    { name: 'settings.js', start: 882, end: 934, imports: ['./state.js'] },
    { name: 'orders.js', start: 935, end: 1055, imports: ['./state.js', './core.js'] },
    { name: 'modals.js', start: 1056, end: lines.length, imports: ['./state.js'] },
];

const outDir = path.join(root, 'js', 'admin');
const exports = [];

function transformState(chunk) {
    return (
        chunk
            .replace(/^const PASS/, 'export const PASS')
            .replace(/^let categories/, 'export let categories')
            .replace(/^let products/, 'export let products')
            .replace(/^let orders/, 'export let orders')
            .replace(/^let campaigns/, 'export let campaigns')
            .replace(/^let packages/, 'export let packages')
            .replace(/^let concepts/, 'export let concepts')
            .replace(/^let settings/, 'export let settings')
            .replace(/^let curIdx/, 'export let curIdx')
            .replace(/^let curImg/, 'export let curImg')
            .replace(/^let editCampaignIdx/, 'export let editCampaignIdx')
            .replace(/^let editPkgIdx/, 'export let editPkgIdx')
            .replace(/^let editConIdx/, 'export let editConIdx') +
        '\nexport let editOrderId = null;\n'
    );
}

function exportFunctions(chunk, moduleName) {
    const names = [...chunk.matchAll(/^function (\w+)/gm), ...chunk.matchAll(/^async function (\w+)/gm)].map(
        (m) => m[1]
    );
    let out = chunk.replace(/^function (\w+)/gm, 'export function $1').replace(/^async function (\w+)/gm, 'export async function $1');
    if (moduleName === 'state.js') return transformState(out);
    return out;
}

for (const c of chunks) {
    let body = lines.slice(c.start, c.end).join('\n').trim();
    if (!body) continue;

    if (c.name === 'state.js') {
        body = transformState(body);
    } else {
        body = exportFunctions(body, c.name);
    }

    const importLine = c.imports?.length
        ? `import { ${c.imports.includes('./state.js') ? 'products, orders, campaigns, packages, concepts, settings, curIdx, curImg, editCampaignIdx, editPkgIdx, editConIdx, editOrderId' : ''} } from './state.js';\n`.replace(
              'products, orders, campaigns, packages, concepts, settings, curIdx, curImg, editCampaignIdx, editPkgIdx, editConIdx, editOrderId',
              () => {
                  const needed = new Set();
                  if (body.includes('products')) needed.add('products');
                  if (body.includes('orders')) needed.add('orders');
                  if (body.includes('campaigns')) needed.add('campaigns');
                  if (body.includes('packages')) needed.add('packages');
                  if (body.includes('concepts')) needed.add('concepts');
                  if (body.includes('settings')) needed.add('settings');
                  if (body.includes('curIdx')) needed.add('curIdx');
                  if (body.includes('curImg')) needed.add('curImg');
                  if (body.includes('editCampaignIdx')) needed.add('editCampaignIdx');
                  if (body.includes('editPkgIdx')) needed.add('editPkgIdx');
                  if (body.includes('editConIdx')) needed.add('editConIdx');
                  if (body.includes('editOrderId')) needed.add('editOrderId');
                  return [...needed].join(', ') || 'products';
              }
          )
        : '';

    // Simpler: always import * as state from './state.js' for non-state modules
    const header =
        c.name === 'state.js'
            ? ''
            : "import * as state from './state.js';\nconst { products, orders, campaigns, packages, concepts, settings, curIdx, curImg, editCampaignIdx, editPkgIdx, editConIdx, editOrderId, PASS } = state;\n\n";

    if (c.name !== 'state.js') {
        body = body
            .replace(/\bproducts\b/g, 'state.products')
            .replace(/\borders\b/g, 'state.orders')
            .replace(/\bcampaigns\b/g, 'state.campaigns')
            .replace(/\bpackages\b/g, 'state.packages')
            .replace(/\bconcepts\b/g, 'state.concepts')
            .replace(/\bsettings\b/g, 'state.settings')
            .replace(/\bcurIdx\b/g, 'state.curIdx')
            .replace(/\bcurImg\b/g, 'state.curImg')
            .replace(/\beditCampaignIdx\b/g, 'state.editCampaignIdx')
            .replace(/\beditPkgIdx\b/g, 'state.editPkgIdx')
            .replace(/\beditConIdx\b/g, 'state.editConIdx')
            .replace(/\beditOrderId\b/g, 'state.editOrderId')
            .replace(/\bPASS\b/g, 'state.PASS');
        // Fix double state.state
        body = body.replace(/state\.state\./g, 'state.');
    }

    fs.writeFileSync(path.join(outDir, c.name), (c.name === 'state.js' ? '' : header) + body + '\n');

    const fns = [...body.matchAll(/export (?:async )?function (\w+)/g)].map((m) => m[1]);
    exports.push(...fns.map((fn) => ({ fn, from: c.name.replace('.js', '') })));
}

const indexParts = [
    "import * as state from './state.js';",
    "import * as auth from './auth.js';",
    "import * as core from './core.js';",
    "import * as products from './products.js';",
    "import * as campaigns from './campaigns.js';",
    "import * as utils from './utils.js';",
    "import * as packages from './packages.js';",
    "import * as paymentLinks from './payment-links.js';",
    "import * as settings from './settings.js';",
    "import * as orders from './orders.js';",
    "import * as modals from './modals.js';",
    '',
    'const modules = [state, auth, core, products, campaigns, utils, packages, paymentLinks, settings, orders, modals];',
    'for (const mod of modules) {',
    '    for (const [key, val] of Object.entries(mod)) {',
    "        if (typeof val === 'function' && key !== 'default') window[key] = val;",
    '    }',
    '}',
    '',
    "if (sessionStorage.getItem('adm_logged')) {",
    "    document.getElementById('login-overlay').style.display = 'none';",
    '    core.init();',
    '}',
];

fs.writeFileSync(path.join(outDir, 'index.js'), indexParts.join('\n') + '\n');
fs.unlinkSync(path.join(outDir, 'app.js'));
console.log('Admin modülleri oluşturuldu:', chunks.map((c) => c.name).join(', '));
