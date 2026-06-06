import { describe, it, expect } from 'vitest';
import { normalizeOrders, upsertOrder } from '../../lib/orders.js';

describe('orders normalize', () => {
    it('aynı orderId tekrarlarını birleştirir', () => {
        const raw = [
            { orderId: 'MOD1', status: 'odeme-reddedildi', lastUpdate: '2026-01-01' },
            { orderId: 'MOD1', status: 'odeme-reddedildi', lastUpdate: '2026-01-02' },
            { orderId: 'MOD2', status: 'onay-bekliyor', lastUpdate: '2026-01-03' },
        ];
        const out = normalizeOrders(raw);
        expect(out).toHaveLength(1);
        expect(out[0].orderId).toBe('MOD2');
    });

    it('başarılı ödeme reddedilmiş kaydın yerine geçer', () => {
        const raw = [
            { orderId: 'MOD9', status: 'odeme-reddedildi', lastUpdate: '2026-05-01' },
            { orderId: 'MOD9', status: 'onay-bekliyor', lastUpdate: '2026-05-02' },
        ];
        const out = normalizeOrders(raw);
        expect(out).toHaveLength(1);
        expect(out[0].status).toBe('onay-bekliyor');
    });

    it('upsertOrder başarısız kaydı başarılı ile değiştirir', () => {
        const list = [{ orderId: 'MODX', status: 'odeme-reddedildi' }];
        const merged = upsertOrder(list, {
            orderId: 'MODX',
            status: 'onay-bekliyor',
            lastUpdate: new Date().toISOString(),
        });
        expect(merged).toHaveLength(1);
        expect(merged[0].status).toBe('onay-bekliyor');
    });
});
