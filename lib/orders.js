/** Sipariş listesi — tekrar ve başarısız ödeme kayıtlarını temizler */

const SUCCESS_STATUSES = new Set([
    'onay-bekliyor',
    'alindi',
    'hazirlaniyor',
    'kargoda',
    'teslim',
    'odeme-alindi',
    'tutar-uyusmazligi',
]);

const IGNORE_STATUSES = new Set(['odeme-reddedildi', 'odeme-bekleniyor']);

function statusRank(status) {
    if (SUCCESS_STATUSES.has(status)) return 10;
    if (IGNORE_STATUSES.has(status)) return 0;
    return 5;
}

/**
 * Aynı orderId için tek kayıt; başarılı durum reddedilenden öncelikli.
 * Varsayılan: odeme-reddedildi kayıtları listeden çıkar.
 */
export function normalizeOrders(orders, { includeRejected = false } = {}) {
    if (!Array.isArray(orders)) return [];

    const byId = new Map();

    for (const order of orders) {
        const id = order?.orderId;
        if (!id) continue;

        const prev = byId.get(id);
        if (!prev) {
            byId.set(id, order);
            continue;
        }

        const prevRank = statusRank(prev.status);
        const nextRank = statusRank(order.status);
        const prevTime = new Date(prev.lastUpdate || 0).getTime();
        const nextTime = new Date(order.lastUpdate || 0).getTime();

        if (nextRank > prevRank || (nextRank === prevRank && nextTime >= prevTime)) {
            byId.set(id, order);
        }
    }

    let list = [...byId.values()];
    if (!includeRejected) {
        list = list.filter((o) => !IGNORE_STATUSES.has(o.status));
    }
    return list.sort((a, b) => new Date(b.lastUpdate || 0) - new Date(a.lastUpdate || 0));
}

/** Tek sipariş ekle/güncelle (orderId ile) */
export function upsertOrder(orders, incoming) {
    const list = Array.isArray(orders) ? [...orders] : [];
    const idx = list.findIndex((o) => o.orderId === incoming.orderId);
    if (idx >= 0) list[idx] = { ...list[idx], ...incoming };
    else list.push(incoming);
    return normalizeOrders(list, { includeRejected: false });
}
