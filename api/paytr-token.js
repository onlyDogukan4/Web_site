import { readData, writeData, corsHeaders } from './_db.js';
import crypto from 'crypto';

// ─── PayTR Ayarları ────────────────────────────────────────────────────────
const MERCHANT_ID   = '678000';
const MERCHANT_KEY  = '5fgrzYub5qo81AFu';
const MERCHANT_SALT = 'oM2A83JNkpDmNogQ';
const TEST_MODE     = '1'; // Canlıya geçince '0' yap

// Vercel'deki site URL'ini buraya ya da environment variable olarak ekle
// Örn: https://moderra.vercel.app
const SITE_URL = process.env.SITE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export default async function handler(req, res) {
    corsHeaders(res);
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { cart, user, totalAmount } = req.body || {};

        if (!cart || !user || !totalAmount) {
            return res.status(400).json({ error: 'Eksik parametre: cart, user, totalAmount gerekli' });
        }

        // Benzersiz sipariş ID
        const randomID = Math.floor(10000 + Math.random() * 90000);
        const merchant_oid = `MOD-${randomID}`;

        // PayTR sepet formatı: [["Ürün Adı", "birim_fiyat", adet], ...]
        const basketArr = cart.map(item => [
            String(item.name).substring(0, 100),
            parseFloat(item.price).toFixed(2),
            parseInt(item.quantity, 10)
        ]);
        const user_basket = Buffer.from(JSON.stringify(basketArr)).toString('base64');

        // Tutar kuruş cinsinden (₺ → kuruş)
        const payment_amount = Math.round(parseFloat(totalAmount) * 100);

        // Kullanıcı IP
        const user_ip =
            (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
            req.socket?.remoteAddress ||
            '1.1.1.1';

        const email         = user.email   || 'musteri@moderra.com';
        const no_installment  = '0';  // 0 = taksit izinli
        const max_installment = '12'; // max taksit sayısı
        const currency      = 'TL';
        const test_mode     = TEST_MODE;

        // ─── Token hash ───────────────────────────────────────────────────
        const hashStr = MERCHANT_ID + user_ip + merchant_oid + email +
                        payment_amount + user_basket +
                        no_installment + max_installment + currency + test_mode;
        const paytr_token = crypto
            .createHmac('sha256', MERCHANT_KEY)
            .update(hashStr + MERCHANT_SALT)
            .digest('base64');

        // ─── Siparişi "Ödeme Bekleniyor" olarak kaydet ───────────────────
        const orderData = {
            orderId:          merchant_oid,
            customerName:     user.name    || 'Bilinmiyor',
            customerPhone:    user.phone   || '',
            customerAddress:  user.address || '',
            customerEmail:    email,
            items:            cart.map(i => `${i.quantity}× ${i.name}`).join(', '),
            totalPrice:       totalAmount,
            status:           'odeme-bekleniyor',
            paymentMethod:    'paytr',
            lastUpdate:       new Date().toISOString(),
            estimatedDelivery: 'Bilgi Bekleniyor',
            cartData:         cart
        };

        const existing = await readData('orders', []);
        await writeData('orders', [...existing, orderData]);

        // ─── PayTR API isteği ─────────────────────────────────────────────
        const params = new URLSearchParams({
            merchant_id:       MERCHANT_ID,
            user_ip,
            merchant_oid,
            email,
            payment_amount:    String(payment_amount),
            paytr_token,
            user_basket,
            debug_on:          '1',
            no_installment,
            max_installment,
            user_name:         user.name    || '',
            user_address:      user.address || '',
            user_phone:        user.phone   || '',
            merchant_ok_url:   `${SITE_URL}/odeme-basarili.html`,
            merchant_fail_url: `${SITE_URL}/odeme-hatasi.html`,
            timeout_limit:     '30',
            currency,
            test_mode,
            lang:              'tr'
        });

        const paytrRes = await fetch('https://www.paytr.com/odeme/api/get-token', {
            method:  'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body:    params.toString()
        });

        const data = await paytrRes.json();

        if (data.status === 'success') {
            return res.status(200).json({ token: data.token, orderId: merchant_oid });
        }

        console.error('PayTR token hatası:', data);
        return res.status(400).json({ error: data.reason || 'PayTR token alınamadı', detail: data });

    } catch (e) {
        console.error('paytr-token handler hatası:', e);
        return res.status(500).json({ error: 'Sunucu hatası: ' + e.message });
    }
}
