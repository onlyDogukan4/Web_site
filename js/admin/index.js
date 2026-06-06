import { Admin } from './state.js';
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
