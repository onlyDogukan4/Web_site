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
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { cart, user, totalAmount } = req.body || {};

        if (!cart || !user || !totalAmount) {
            return res.status(400).json({ error: 'Eksik parametre: cart, user, totalAmount gerekli' });
        }

        const config = getPaytrConfig();
        const SITE_URL = getSiteUrl();

        const randomID = Math.floor(10000 + Math.random() * 90000);
        const merchant_oid = `MOD${randomID}`;

        const user_basket = buildUserBasket(cart);
        const payment_amount = amountToKurus(totalAmount);
        const user_ip = extractClientIp(req);

        const email = user.email || 'musteri@moderra.com';
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
            customerName: user.name || 'Bilinmiyor',
            customerPhone: user.phone || '',
            customerAddress: user.address || '',
            customerEmail: email,
            items: cart.map((i) => `${i.quantity}× ${i.name}`).join(', '),
            totalPrice: totalAmount,
            paymentMethod: 'paytr',
            cartData: cart,
            createdAt: new Date().toISOString(),
        };

        const existingAttempts = await readData('payment_attempts', []);
        const cleanedAttempts = existingAttempts.filter((a) => a.orderId !== merchant_oid);
        await writeData('payment_attempts', [...cleanedAttempts, attemptData]);

        if (isPaytrMockEnabled()) {
            return res.status(200).json({
                token: createMockPaytrToken(merchant_oid),
                orderId: merchant_oid,
                merchantId: config.merchantId,
                paymentAmount: parseFloat(totalAmount),
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
            user_name: user.name || '',
            user_address: user.address || '',
            user_phone: user.phone || '',
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

        if (data.status === 'success') {
            return res.status(200).json({
                token: data.token,
                orderId: merchant_oid,
                merchantId: config.merchantId,
                paymentAmount: parseFloat(totalAmount),
            });
        }

        console.error('PayTR token hatası:', data);
        return res.status(400).json({ error: data.reason || 'PayTR token alınamadı', detail: data });
    } catch (e) {
        console.error('paytr-token handler hatası:', e);
        return res.status(500).json({ error: 'Sunucu hatası: ' + e.message });
    }
}
