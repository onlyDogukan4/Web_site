import { readData, writeData, corsHeaders } from './_db.js';
import crypto from 'crypto';

const MERCHANT_ID   = '678000';
const MERCHANT_KEY  = '5fgrzYub5qo81AFu';
const MERCHANT_SALT = 'oM2A83JNkpDmNogQ';
const TEST_MODE     = '1';

const SITE_URL = process.env.SITE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export default async function handler(req, res) {
    corsHeaders(res);
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    // ── GET: Tek veya tüm istekler ──────────────────────────────────────────
    if (req.method === 'GET') {
        const requests = await readData('payment-requests', []);
        const { id } = req.query;
        if (id) {
            const item = requests.find(r => r.id === id);
            if (!item) return res.status(404).json({ error: 'Bulunamadı' });
            return res.status(200).json(item);
        }
        return res.status(200).json(requests);
    }

    if (req.method === 'POST') {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

        // ── Sil ─────────────────────────────────────────────────────────────
        if (body.action === 'delete') {
            const requests = await readData('payment-requests', []);
            await writeData('payment-requests', requests.filter(r => r.id !== body.id));
            return res.status(200).json({ success: true });
        }

        // ── PayTR token üret (eski payment-link-token.js) ───────────────────
        if (body.action === 'get-token') {
            try {
                const { requestId } = body;
                if (!requestId) return res.status(400).json({ error: 'requestId gerekli' });

                const requests = await readData('payment-requests', []);
                const payReq   = requests.find(r => r.id === requestId);

                if (!payReq)                    return res.status(404).json({ error: 'Ödeme isteği bulunamadı' });
                if (payReq.status === 'odendi') return res.status(400).json({ error: 'Bu ödeme zaten tamamlandı' });

                const payment_amount = Math.round(parseFloat(payReq.amount) * 100);
                if (!payment_amount || payment_amount <= 0)
                    return res.status(400).json({ error: 'Geçersiz tutar' });

                const merchant_oid = `LINK${Math.floor(10000 + Math.random() * 90000)}`;

                const basketArr  = [[String(payReq.description || 'Manuel Ödeme').substring(0, 100), parseFloat(payReq.amount).toFixed(2), 1]];
                const user_basket = Buffer.from(JSON.stringify(basketArr)).toString('base64');

                const user_ip        = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || '1.1.1.1';
                const email          = payReq.customerEmail || 'musteri@moderra.com';
                const no_installment = '0';
                const max_installment = '12';
                const currency       = 'TL';
                const test_mode      = TEST_MODE;

                const hashStr     = MERCHANT_ID + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode;
                const paytr_token = crypto.createHmac('sha256', MERCHANT_KEY).update(hashStr + MERCHANT_SALT).digest('base64');

                const params = new URLSearchParams({
                    merchant_id: MERCHANT_ID, user_ip, merchant_oid, email,
                    payment_amount: String(payment_amount), paytr_token, user_basket,
                    debug_on: '1', no_installment, max_installment,
                    user_name:    payReq.customerName  || '',
                    user_address: payReq.customerAddress || 'Link ile ödeme',
                    user_phone:   payReq.customerPhone || '',
                    merchant_ok_url:   `${SITE_URL}/odeme-basarili.html`,
                    merchant_fail_url: `${SITE_URL}/odeme-hatasi.html`,
                    timeout_limit: '30', currency, test_mode, lang: 'tr'
                });

                const paytrRes = await fetch('https://www.paytr.com/odeme/api/get-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params.toString()
                });
                const data = await paytrRes.json();

                if (data.status !== 'success') {
                    console.error('PayTR link token hatası:', data);
                    return res.status(400).json({ error: data.reason || 'Token alınamadı', detail: data });
                }

                // Siparişi kaydet
                const orderData = {
                    orderId: merchant_oid,
                    customerName:      payReq.customerName  || 'Bilinmiyor',
                    customerPhone:     payReq.customerPhone || '',
                    customerAddress:   'Manuel Ödeme Linki',
                    customerEmail:     email,
                    items:             payReq.description   || 'Manuel Ödeme',
                    totalPrice:        payReq.amount,
                    status:            'odeme-bekleniyor',
                    paymentMethod:     'paytr-link',
                    lastUpdate:        new Date().toISOString(),
                    estimatedDelivery: 'Bilgi Bekleniyor',
                    paymentRequestId:  requestId
                };
                const orders = await readData('orders', []);
                await writeData('orders', [...orders, orderData]);

                const updatedReqs = requests.map(r => r.id === requestId ? { ...r, orderId: merchant_oid } : r);
                await writeData('payment-requests', updatedReqs);

                return res.status(200).json({ token: data.token, orderId: merchant_oid });
            } catch (e) {
                console.error('get-token hatası:', e);
                return res.status(500).json({ error: 'Sunucu hatası: ' + e.message });
            }
        }

        // ── Yeni ödeme isteği oluştur ────────────────────────────────────────
        const requests = await readData('payment-requests', []);
        const newItem  = {
            id:            'pay_' + Math.random().toString(36).substr(2, 9),
            customerName:  body.customerName  || 'Bilinmiyor',
            customerPhone: body.customerPhone || '',
            customerEmail: body.customerEmail || '',
            description:   body.description   || 'Manuel Ödeme',
            amount:        parseFloat(body.amount) || 0,
            status:        'bekliyor',
            createdAt:     new Date().toISOString(),
            orderId:       null,
            paidAt:        null
        };
        await writeData('payment-requests', [...requests, newItem]);
        return res.status(200).json({ success: true, request: newItem });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
