import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMemoryDb } from '../helpers/memory-db.js';
import { createMockReq, createMockRes } from '../helpers/mock-req-res.js';
import { TEST_CART, TEST_USER, TEST_TOTAL } from '../helpers/paytr-fixtures.js';

const memoryDb = createMemoryDb();

vi.mock('../../lib/db.js', () => memoryDb.mockModule());

describe('PayTR token — entegrasyon testleri', () => {
    beforeEach(() => {
        memoryDb.reset();
        vi.resetModules();
        process.env.PAYTR_MOCK = 'true';
        delete process.env.PAYTR_MERCHANT_ID;
    });

    async function loadHandler() {
        const mod = await import('../../lib/routes/paytr-token.js');
        return mod.default;
    }

    it('eksik parametrede 400 döner', async () => {
        const handler = await loadHandler();
        const res = createMockRes();

        await handler(createMockReq({ body: { cart: TEST_CART } }), res);

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('Eksik parametre');
    });

    it('mock modda token ve orderId döner, attempt kaydeder', async () => {
        const handler = await loadHandler();
        const res = createMockRes();

        await handler(
            createMockReq({
                body: { cart: TEST_CART, user: TEST_USER, totalAmount: TEST_TOTAL },
            }),
            res
        );

        expect(res.statusCode).toBe(200);
        expect(res.body.token).toMatch(/^mock_MOD/);
        expect(res.body.orderId).toMatch(/^MOD\d+$/);
        expect(res.body.mock).toBe(true);

        const attempts = memoryDb.get('payment_attempts');
        expect(attempts).toHaveLength(1);
        expect(attempts[0].totalPrice).toBe(TEST_TOTAL);
        expect(attempts[0].customerName).toBe(TEST_USER.name);
        expect(memoryDb.get('orders')).toEqual([]);
    });

    it('OPTIONS isteğine 200 döner', async () => {
        const handler = await loadHandler();
        const res = createMockRes();

        await handler(createMockReq({ method: 'OPTIONS' }), res);

        expect(res.statusCode).toBe(200);
    });
});
