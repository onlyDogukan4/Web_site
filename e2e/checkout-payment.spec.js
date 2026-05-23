import { test, expect } from '@playwright/test';
import { simulatePaytrSuccess } from './helpers/paytr-simulate.js';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3099';

test.describe('Ödeme E2E', () => {
    test('sepet checkout API → callback → sipariş oluşur', async ({ request, page }) => {
        await page.goto(BASE);

        const cart = [{ name: 'E2E Test Ürün', price: 100, quantity: 1 }];
        const user = {
            name: 'E2E Test Kullanıcı',
            phone: '05559998877',
            email: 'e2e@test.com',
            address: 'E2E Test Adres 1',
        };

        const tokenRes = await request.post(`${BASE}/api/paytr-token`, {
            data: { cart, user, totalAmount: 100 },
        });
        expect(tokenRes.ok()).toBeTruthy();
        const tokenData = await tokenRes.json();
        expect(tokenData.orderId).toMatch(/^MOD\d+$/);
        expect(tokenData.mock).toBe(true);

        const ordersBefore = await (await request.get(`${BASE}/api/orders`)).json();
        expect(ordersBefore.find((o) => o.orderId === tokenData.orderId)).toBeFalsy();

        const callbackRes = await simulatePaytrSuccess(request, BASE, tokenData.orderId, 100);
        expect(await callbackRes.text()).toBe('OK');

        const ordersAfter = await (await request.get(`${BASE}/api/orders`)).json();
        const order = ordersAfter.find((o) => o.orderId === tokenData.orderId);
        expect(order).toBeTruthy();
        expect(order.status).toBe('onay-bekliyor');
        expect(order.customerName).toBe(user.name);
        expect(order.paymentMethod).toBe('paytr');
    });

    test('ana sayfa yüklenir ve sepet localStorage çalışır', async ({ page }) => {
        await page.goto(BASE);
        await page.evaluate(() => {
            localStorage.setItem(
                'cart',
                JSON.stringify([{ name: 'UI Test', price: 50, quantity: 1 }])
            );
        });
        const cartLen = await page.evaluate(() => JSON.parse(localStorage.getItem('cart')).length);
        expect(cartLen).toBe(1);
        await expect(page).toHaveTitle(/moderra|Moderra/i);
    });

    test('manuel ödeme linki akışı', async ({ request }) => {
        const createRes = await request.post(`${BASE}/api/payment-requests`, {
            data: {
                customerName: 'Link Test',
                customerPhone: '05551112233',
                customerEmail: 'link@test.com',
                description: 'E2E Manuel Ödeme',
                amount: 250,
            },
        });
        const { request: payReq } = await createRes.json();
        expect(payReq.id).toMatch(/^pay_/);

        const tokenRes = await request.post(`${BASE}/api/payment-requests`, {
            data: { action: 'get-token', requestId: payReq.id },
        });
        const tokenData = await tokenRes.json();
        expect(tokenData.orderId).toMatch(/^LINK\d+$/);

        const ordersBefore = await (await request.get(`${BASE}/api/orders`)).json();
        expect(ordersBefore.find((o) => o.orderId === tokenData.orderId)).toBeFalsy();

        await simulatePaytrSuccess(request, BASE, tokenData.orderId, 250);

        const ordersAfter = await (await request.get(`${BASE}/api/orders`)).json();
        const order = ordersAfter.find((o) => o.orderId === tokenData.orderId);
        expect(order).toBeTruthy();
        expect(order.status).toBe('onay-bekliyor');

        const reqAfter = await (
            await request.get(`${BASE}/api/payment-requests?id=${payReq.id}`)
        ).json();
        expect(reqAfter.status).toBe('odendi');
    });
});
