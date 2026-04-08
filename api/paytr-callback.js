import { readData, writeData } from './_db.js';
import crypto from 'crypto';

const MERCHANT_KEY  = '5fgrzYub5qo81AFu';
const MERCHANT_SALT = 'oM2A83JNkpDmNogQ';

// PayTR bu endpoint'e application/x-www-form-urlencoded POST gönderir
// Vercel otomatik olarak urlencoded body'yi parse eder

export default async function handler(req, res) {
    // PayTR sadece POST gönderir
    if (req.method !== 'POST') {
        res.status(405).end();
        return;
    }

    try {
        const {
            merchant_oid,
            status,
            total_amount,
            hash,
            failed_reason_code,
            failed_reason_msg,
            payment_type,
            installment_count
        } = req.body || {};

        if (!merchant_oid || !status || !total_amount || !hash) {
            console.error('PayTR callback: eksik parametre', req.body);
            res.status(400).send('MISSING_PARAMS');
            return;
        }

        // ─── Hash doğrula ─────────────────────────────────────────────────
        const hashStr = merchant_oid + MERCHANT_SALT + status + total_amount;
        const expected = crypto
            .createHmac('sha256', MERCHANT_KEY)
            .update(hashStr)
            .digest('base64');

        if (hash !== expected) {
            console.error('PayTR callback: hash uyuşmadı', { hash, expected });
            res.status(400).send('PAYTR_HASH_MISMATCH');
            return;
        }

        // ─── Siparişi güncelle ────────────────────────────────────────────
        const orders = readData('orders', []);
        const idx = orders.findIndex(o => o.orderId === merchant_oid);

        if (idx > -1) {
            if (status === 'success') {
                orders[idx].status          = 'onay-bekliyor'; // Admin onayına düşer
                orders[idx].paymentType     = payment_type     || '';
                orders[idx].installments    = installment_count || '1';
            } else {
                orders[idx].status       = 'odeme-reddedildi';
                orders[idx].failCode     = failed_reason_code || '';
                orders[idx].failReason   = failed_reason_msg  || '';
            }
            orders[idx].lastUpdate = new Date().toISOString();
            writeData('orders', orders);
        } else {
            console.warn('PayTR callback: sipariş bulunamadı', merchant_oid);
        }

        // PayTR "OK" beklyor, aksi halde callback 3 kez tekrar edilir
        res.status(200).send('OK');

    } catch (e) {
        console.error('paytr-callback handler hatası:', e);
        // Hata olsa bile "OK" dön — yoksa PayTR defalarca dener
        res.status(200).send('OK');
    }
}
