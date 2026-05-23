import { state } from './state.js';

export async function loadData() {
    try {
        const t = Date.now();
        const [pr, pkr, cr] = await Promise.all([
            fetch(`/api/products?t=${t}`),
            fetch(`/api/packages?t=${t}`),
            fetch(`/api/campaigns?t=${t}`),
        ]);
        const [prods, pkgs, camps] = await Promise.all([pr.json(), pkr.json(), cr.json()]);
        if (Array.isArray(prods) && prods.length) state.products = prods;
        if (Array.isArray(pkgs)) state.packages = pkgs;
        if (Array.isArray(camps)) state.campaigns = camps;
    } catch (e) {
        console.warn('Veri yükleme hatası:', e.message);
    }
}

export function startUpdatePolling({ syncCartPrices, renderProducts, renderPackages }) {
    let lastUpdateTime = null;
    let timer = null;

    async function checkForUpdates() {
        if (document.hidden) return;
        try {
            const r = await fetch('/api/settings?type=last-update&t=' + Date.now());
            if (!r.ok) return;
            const d = await r.json();
            if (lastUpdateTime === null) {
                lastUpdateTime = d.time;
                return;
            }
            if (d.time !== lastUpdateTime) {
                lastUpdateTime = d.time;
                await loadData();
                syncCartPrices();
                renderProducts();
                renderPackages();
            }
        } catch {
            /* ağ hatası */
        }
    }

    function start() {
        if (timer) return;
        checkForUpdates();
        timer = setInterval(checkForUpdates, 20000);
    }

    function stop() {
        if (!timer) return;
        clearInterval(timer);
        timer = null;
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else start();
    });

    start();
}
