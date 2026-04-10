import { readData, writeData } from './_db.js';
import crypto from 'crypto';

const MERCHANT_KEY  = '5fgrzYub5qo81AFu';
const MERCHANT_SALT = 'oM2A83JNkpDmNogQ';

// PayTR bu endpoint'e application/x-www-form-urlencoded POST gönderir

export default async function handler(req, res) {
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

        // ─── Ödeme girişimini bul ─────────────────────────────────────────
        const attempts = await readData('payment_attempts', []);
        const attempt  = attempts.find(a => a.orderId === merchant_oid);

        if (status === 'success') {
            // ── Başarılı ödeme ────────────────────────────────────────────

            // Tutar güvenlik kontrolü
            const expectedKurus = attempt ? Math.round(parseFloat(attempt.totalPrice) * 100) : 0;
            const receivedKurus = parseInt(total_amount, 10);

            if (expectedKurus > 0 && receivedKurus < expectedKurus) {
                console.error('PayTR callback: TUTAR UYUŞMAZLIĞI', {
                    merchant_oid,
                    expected: expectedKurus,
                    received: receivedKurus
                });
                // Girişimi sil, order oluşturma
                await writeData('payment_attempts', attempts.filter(a => a.orderId !== merchant_oid));
                res.status(200).send('OK');
                return;
            }

            // Siparişi orders koleksiyonuna ekle
            const orders = await readData('orders', []);

            // Aynı orderId zaten orders'da varsa tekrar ekleme (duplicate callback)
            if (orders.some(o => o.orderId === merchant_oid)) {
                res.status(200).send('OK');
                return;
            }

            const newOrder = {
                orderId:          merchant_oid,
                customerName:     attempt?.customerName    || 'Bilinmiyor',
                customerPhone:    attempt?.customerPhone   || '',
                customerAddress:  attempt?.customerAddress || '',
                customerEmail:    attempt?.customerEmail   || '',
                items:            attempt?.items           || '',
                totalPrice:       attempt?.totalPrice      || (receivedKurus / 100).toFixed(2),
                cartData:         attempt?.cartData        || [],
                status:           'onay-bekliyor',
                paymentMethod:    attempt?.paymentMethod   || 'paytr',
                paymentType:      payment_type             || '',
                installments:     installment_count        || '1',
                lastUpdate:       new Date().toISOString(),
                estimatedDelivery: 'Bilgi Bekleniyor'
            };

            await writeData('orders', [...orders, newOrder]);

            // Manuel ödeme linki ise payment-request'i güncelle
            if (attempt?.paymentRequestId) {
                const reqs = await readData('payment-requests', []);
                await writeData('payment-requests', reqs.map(r =>
                    r.id === attempt.paymentRequestId
                        ? { ...r, status: 'odendi', paidAt: new Date().toISOString() }
                        : r
                ));
            }

            // Geçici girişimi temizle
            await writeData('payment_attempts', attempts.filter(a => a.orderId !== merchant_oid));

        } else {
            // ── Başarısız/iptal ödeme — sadece geçici girişimi sil ────────
            // orders koleksiyonuna HİÇ yazma. Admin panelinde gözükmez.
            if (attempt) {
                await writeData('payment_attempts', attempts.filter(a => a.orderId !== merchant_oid));
            }
            console.log(`PayTR: ${merchant_oid} iptal/red — orders'a yazılmadı. Kod: ${failed_reason_code}`);
        }

        // PayTR "OK" bekliyor, aksi halde callback 3 kez tekrar edilir
        res.status(200).send('OK');

    } catch (e) {
        console.error('paytr-callback handler hatası:', e);
        res.status(200).send('OK');
    }
}
