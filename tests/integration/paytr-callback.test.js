import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMemoryDb } from '../helpers/memory-db.js';
import { createMockReq, createMockRes } from '../helpers/mock-req-res.js';
import {
    buildSuccessCallbackBody,
    buildFailedCallbackBody,
    TEST_CART,
    TEST_USER,
    TEST_TOTAL,
} from '../helpers/paytr-fixtures.js';

const memoryDb = createMemoryDb();

vi.mock('../../api/_db.js', () => memoryDb.mockModule());

describe('PayTR callback — entegrasyon testleri', () => {
    beforeEach(() => {
        memoryDb.reset();
        vi.resetModules();
    });

    async function loadHandler() {
        const mod = await import('../../api/paytr-callback.js');
        return mod.default;
    }

    it('geçersiz hash ile sipariş oluşturmaz', async () => {
        memoryDb.seed('payment_attempts', [
            {
                orderId: 'MOD11111',
                totalPrice: 51,
                customerName: 'Test',
            },
        ]);

        const handler = await loadHandler();
        const res = createMockRes();

        await handler(
            createMockReq({
                body: {
                    merchant_oid: 'MOD11111',
                    status: 'success',
                    total_amount: '5100',
                    hash: 'sahte-hash',
                },
            }),
            res
        );

        expect(res.statusCode).toBe(400);
        expect(res.body).toBe('PAYTR_HASH_MISMATCH');
        expect(memoryDb.get('orders')).toEqual([]);
    });

    it('başarılı callback sonrası sipariş oluşturur', async () => {
        const orderId = 'MOD22222';
        memoryDb.seed('payment_attempts', [
            {
                orderId,
                customerName: TEST_USER.name,
                customerPhone: TEST_USER.phone,
                customerEmail: TEST_USER.email,
                customerAddress: TEST_USER.address,
                items: '2× Test Bardak',
                totalPrice: TEST_TOTAL,
                paymentMethod: 'paytr',
                cartData: TEST_CART,
            },
        ]);

        const handler = await loadHandler();
        const res = createMockRes();

        await handler(
            createMockReq({ body: buildSuccessCallbackBody(orderId, TEST_TOTAL) }),
            res
        );

        expect(res.statusCode).toBe(200);
        expect(res.body).toBe('OK');

        const orders = memoryDb.get('orders');
        expect(orders).toHaveLength(1);
        expect(orders[0].orderId).toBe(orderId);
        expect(orders[0].status).toBe('onay-bekliyor');
        expect(orders[0].customerName).toBe(TEST_USER.name);
        expect(memoryDb.get('payment_attempts')).toEqual([]);
    });

    it('duplicate callback siparişi tekrarlamaz', async () => {
        const orderId = 'MOD33333';
        memoryDb.seed('payment_attempts', [
            { orderId, totalPrice: 51, customerName: 'Test', items: 'x' },
        ]);
        memoryDb.seed('orders', [{ orderId, status: 'onay-bekliyor' }]);

        const handler = await loadHandler();
        const res = createMockRes();

        await handler(
            createMockReq({ body: buildSuccessCallbackBody(orderId, 51) }),
            res
        );

        expect(memoryDb.get('orders')).toHaveLength(1);
    });

    it('düşük tutarlı callback sipariş oluşturmaz', async () => {
        const orderId = 'MOD44444';
        memoryDb.seed('payment_attempts', [
            { orderId, totalPrice: 100, customerName: 'Test' },
        ]);

        const handler = await loadHandler();
        const res = createMockRes();

        // 50 TL ödendi, 100 TL bekleniyor — hash geçerli, tutar reddedilir
        const body = buildSuccessCallbackBody(orderId, 100, 5000);

        await handler(createMockReq({ body }), res);

        expect(memoryDb.get('orders')).toEqual([]);
        expect(memoryDb.get('payment_attempts')).toEqual([]);
    });

    it('başarısız ödeme orders koleksiyonuna yazmaz', async () => {
        const orderId = 'MOD55555';
        memoryDb.seed('payment_attempts', [
            { orderId, totalPrice: 51, customerName: 'Test' },
        ]);

        const handler = await loadHandler();
        const res = createMockRes();

        await handler(
            createMockReq({ body: buildFailedCallbackBody(orderId, 51) }),
            res
        );

        expect(memoryDb.get('orders')).toEqual([]);
        expect(memoryDb.get('payment_attempts')).toEqual([]);
    });

    it('manuel ödeme linki callback payment-request günceller', async () => {
        const orderId = 'LINK66666';
        const requestId = 'pay_test123';

        memoryDb.seed('payment_attempts', [
            {
                orderId,
                totalPrice: 200,
                customerName: 'Link Müşteri',
                paymentRequestId: requestId,
                paymentMethod: 'paytr-link',
            },
        ]);
        memoryDb.seed('payment-requests', [
            { id: requestId, status: 'bekliyor', amount: 200 },
        ]);

        const handler = await loadHandler();
        await handler(
            createMockReq({ body: buildSuccessCallbackBody(orderId, 200) }),
            createMockRes()
        );

        const reqs = memoryDb.get('payment-requests');
        expect(reqs[0].status).toBe('odendi');
        expect(reqs[0].paidAt).toBeTruthy();
    });
});
