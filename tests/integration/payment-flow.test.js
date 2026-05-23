import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMemoryDb } from '../helpers/memory-db.js';
import { createMockReq, createMockRes } from '../helpers/mock-req-res.js';
import { buildSuccessCallbackBody, TEST_CART, TEST_USER, TEST_TOTAL } from '../helpers/paytr-fixtures.js';

/**
 * Tam ödeme akışı: token → callback → sipariş
 * Gerçek PayTR API çağrısı yapılmaz (PAYTR_MOCK=true).
 */
const memoryDb = createMemoryDb();

vi.mock('../../api/_db.js', () => memoryDb.mockModule());

describe('Ödeme akışı — uçtan uca (API seviyesi)', () => {
    beforeEach(() => {
        memoryDb.reset();
        vi.resetModules();
        process.env.PAYTR_MOCK = 'true';
    });

    it('sepet ödemesi: token al → callback → sipariş onay-bekliyor', async () => {
        const tokenHandler = (await import('../../api/paytr-token.js')).default;
        const callbackHandler = (await import('../../api/paytr-callback.js')).default;

        const tokenRes = createMockRes();
        await tokenHandler(
            createMockReq({
                body: { cart: TEST_CART, user: TEST_USER, totalAmount: TEST_TOTAL },
            }),
            tokenRes
        );

        expect(tokenRes.statusCode).toBe(200);
        const { orderId } = tokenRes.body;

        const callbackRes = createMockRes();
        await callbackHandler(
            createMockReq({ body: buildSuccessCallbackBody(orderId, TEST_TOTAL) }),
            callbackRes
        );

        expect(callbackRes.body).toBe('OK');

        const orders = memoryDb.get('orders');
        expect(orders).toHaveLength(1);
        expect(orders[0].orderId).toBe(orderId);
        expect(orders[0].status).toBe('onay-bekliyor');
        expect(orders[0].paymentMethod).toBe('paytr');
        expect(parseFloat(orders[0].totalPrice)).toBe(TEST_TOTAL);
    });

    it('callback öncesi sipariş yoktur (güvenlik)', async () => {
        const tokenHandler = (await import('../../api/paytr-token.js')).default;

        const tokenRes = createMockRes();
        await tokenHandler(
            createMockReq({
                body: { cart: TEST_CART, user: TEST_USER, totalAmount: TEST_TOTAL },
            }),
            tokenRes
        );

        expect(memoryDb.get('orders')).toEqual([]);
    });
});
