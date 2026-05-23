import { readData, writeData, corsHeaders } from './_db.js';
import {
    getPaytrConfig,
    getSiteUrl,
    amountToKurus,
    buildUserBasket,
    buildPaytrTokenHash,
    extractClientIp,
    isPaytrMockEnabled,
    createMockPaytrToken,
} from './lib/paytr.js';

export default async function handler(req, res) {
    corsHeaders(res);
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        const requests = await readData('payment-requests', []);
        const { id } = req.query;
        if (id) {
            const item = requests.find((r) => r.id === id);
            if (!item) return res.status(404).json({ error: 'Bulunamadı' });
            return res.status(200).json(item);
        }
        return res.status(200).json(requests);
    }

    if (req.method === 'POST') {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

        if (body.action === 'delete') {
            const requests = await readData('payment-requests', []);
            await writeData(
                'payment-requests',
                requests.filter((r) => r.id !== body.id)
            );
            return res.status(200).json({ success: true });
        }

        if (body.action === 'get-token') {
            try {
                const { requestId } = body;
                if (!requestId) return res.status(400).json({ error: 'requestId gerekli' });

                const requests = await readData('payment-requests', []);
                const payReq = requests.find((r) => r.id === requestId);

                if (!payReq) return res.status(404).json({ error: 'Ödeme isteği bulunamadı' });
                if (payReq.status === 'odendi')
                    return res.status(400).json({ error: 'Bu ödeme zaten tamamlandı' });

                const config = getPaytrConfig();
                const SITE_URL = getSiteUrl();

                const payment_amount = amountToKurus(payReq.amount);
                if (!payment_amount || payment_amount <= 0)
                    return res.status(400).json({ error: 'Geçersiz tutar' });

                const merchant_oid = `LINK${Math.floor(10000 + Math.random() * 90000)}`;

                const user_basket = buildUserBasket([
                    {
                        name: payReq.description || 'Manuel Ödeme',
                        price: payReq.amount,
                        quantity: 1,
                    },
                ]);

                const user_ip = extractClientIp(req);
                const email = payReq.customerEmail || 'musteri@moderra.com';
                const no_installment = '0';
                const max_installment = '12';
                const currency = 'TL';
                const test_mode = config.testMode;

                const paytr_token = buildPaytrTokenHash({
                    merchantId: config.merchantId,
                    userIp: user_ip,
                    merchantOid: merchant_oid,
                    email,
                    paymentAmountKurus: payment_amount,
                    userBasket: user_basket,
                    noInstallment: no_installment,
                    maxInstallment: max_installment,
                    currency,
                    testMode: test_mode,
                    merchantKey: config.merchantKey,
                    merchantSalt: config.merchantSalt,
                });

                const attemptData = {
                    orderId: merchant_oid,
                    customerName: payReq.customerName || 'Bilinmiyor',
                    customerPhone: payReq.customerPhone || '',
                    customerAddress: 'Manuel Ödeme Linki',
                    customerEmail: email,
                    items: payReq.description || 'Manuel Ödeme',
                    totalPrice: payReq.amount,
                    paymentMethod: 'paytr-link',
                    paymentRequestId: requestId,
                    createdAt: new Date().toISOString(),
                };

                const existingAttempts = await readData('payment_attempts', []);
                await writeData('payment_attempts', [
                    ...existingAttempts.filter((a) => a.orderId !== merchant_oid),
                    attemptData,
                ]);

                const updatedReqs = requests.map((r) =>
                    r.id === requestId ? { ...r, orderId: merchant_oid } : r
                );
                await writeData('payment-requests', updatedReqs);

                if (isPaytrMockEnabled()) {
                    return res.status(200).json({
                        token: createMockPaytrToken(merchant_oid),
                        orderId: merchant_oid,
                        mock: true,
                    });
                }

                const params = new URLSearchParams({
                    merchant_id: config.merchantId,
                    user_ip,
                    merchant_oid,
                    email,
                    payment_amount: String(payment_amount),
                    paytr_token,
                    user_basket,
                    debug_on: '1',
                    no_installment,
                    max_installment,
                    user_name: payReq.customerName || '',
                    user_address: payReq.customerAddress || 'Link ile ödeme',
                    user_phone: payReq.customerPhone || '',
                    merchant_ok_url: `${SITE_URL}/odeme-basarili.html`,
                    merchant_fail_url: `${SITE_URL}/odeme-hatasi.html`,
                    timeout_limit: '30',
                    currency,
                    test_mode,
                    lang: 'tr',
                });

                const paytrRes = await fetch('https://www.paytr.com/odeme/api/get-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params.toString(),
                });
                const data = await paytrRes.json();

                if (data.status !== 'success') {
                    console.error('PayTR link token hatası:', data);
                    return res.status(400).json({ error: data.reason || 'Token alınamadı', detail: data });
                }

                return res.status(200).json({ token: data.token, orderId: merchant_oid });
            } catch (e) {
                console.error('get-token hatası:', e);
                return res.status(500).json({ error: 'Sunucu hatası: ' + e.message });
            }
        }

        const requests = await readData('payment-requests', []);
        const newItem = {
            id: 'pay_' + Math.random().toString(36).substr(2, 9),
            customerName: body.customerName || 'Bilinmiyor',
            customerPhone: body.customerPhone || '',
            customerEmail: body.customerEmail || '',
            description: body.description || 'Manuel Ödeme',
            amount: parseFloat(body.amount) || 0,
            status: 'bekliyor',
            createdAt: new Date().toISOString(),
            orderId: null,
            paidAt: null,
        };
        await writeData('payment-requests', [...requests, newItem]);
        return res.status(200).json({ success: true, request: newItem });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
