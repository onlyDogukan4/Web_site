import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMemoryDb } from '../helpers/memory-db.js';
import { createMockReq, createMockRes } from '../helpers/mock-req-res.js';

const memoryDb = createMemoryDb();
vi.mock('../../lib/db.js', () => memoryDb.mockModule());

describe('orders API', () => {
    beforeEach(() => {
        memoryDb.reset();
        vi.resetModules();
    });

    async function loadHandler() {
        return (await import('../../lib/routes/orders.js')).default;
    }

    it('POST dizi gönderince append etmez, temiz listeyi yazar', async () => {
        memoryDb.seed('orders', [
            { orderId: 'MOD1', status: 'odeme-reddedildi', lastUpdate: '2026-01-01' },
            { orderId: 'MOD1', status: 'odeme-reddedildi', lastUpdate: '2026-01-02' },
            { orderId: 'MOD2', status: 'onay-bekliyor', lastUpdate: '2026-01-03' },
        ]);

        const handler = await loadHandler();
        const res = createMockRes();

        await handler(
            createMockReq({
                method: 'POST',
                body: [
                    { orderId: 'MOD2', status: 'onay-bekliyor', lastUpdate: '2026-01-03' },
                    { orderId: 'MOD3', status: 'hazirlaniyor', lastUpdate: '2026-01-04' },
                ],
            }),
            res
        );

        expect(res.statusCode).toBe(200);
        const stored = memoryDb.get('orders');
        expect(stored).toHaveLength(2);
        expect(stored.map((o) => o.orderId).sort()).toEqual(['MOD2', 'MOD3']);
        expect(stored.every((o) => o.status !== 'odeme-reddedildi')).toBe(true);
    });

    it('GET veritabanındaki tekrarları otomatik temizler', async () => {
        memoryDb.seed('orders', [
            { orderId: 'MOD1', status: 'odeme-reddedildi' },
            { orderId: 'MOD1', status: 'odeme-reddedildi' },
            { orderId: 'MOD2', status: 'onay-bekliyor', lastUpdate: '2026-01-01' },
        ]);

        const handler = await loadHandler();
        const res = createMockRes();
        await handler(createMockReq({ method: 'GET' }), res);

        expect(res.body).toHaveLength(1);
        expect(memoryDb.get('orders')).toHaveLength(1);
        expect(memoryDb.get('orders')[0].orderId).toBe('MOD2');
    });

    it('GET reddedilmiş siparişleri döndürmez', async () => {
        memoryDb.seed('orders', [
            { orderId: 'MOD1', status: 'odeme-reddedildi' },
            { orderId: 'MOD2', status: 'onay-bekliyor', lastUpdate: '2026-01-01' },
        ]);

        const handler = await loadHandler();
        const res = createMockRes();
        await handler(createMockReq({ method: 'GET' }), res);

        expect(res.body).toHaveLength(1);
        expect(res.body[0].orderId).toBe('MOD2');
    });
});
