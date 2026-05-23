import { readData, writeData } from './_db.js';
import { getPaytrConfig, verifyCallbackHash, validateCallbackAmount } from '../lib/paytr.js';
import { normalizeOrders, upsertOrder } from '../lib/orders.js';

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
            payment_type,
            installment_count,
        } = req.body || {};

        if (!merchant_oid || !status || !total_amount || !hash) {
            console.error('PayTR callback: eksik parametre', req.body);
            res.status(400).send('MISSING_PARAMS');
            return;
        }

        const config = getPaytrConfig();

        if (
            !verifyCallbackHash({
                merchantOid: merchant_oid,
                status,
                totalAmount: total_amount,
                hash,
                merchantKey: config.merchantKey,
                merchantSalt: config.merchantSalt,
            })
        ) {
            console.error('PayTR callback: hash uyuşmadı');
            res.status(400).send('PAYTR_HASH_MISMATCH');
            return;
        }

        const attempts = await readData('payment_attempts', []);
        const attempt = attempts.find((a) => a.orderId === merchant_oid);

        if (status === 'success') {
            const amountCheck = validateCallbackAmount(total_amount, attempt?.totalPrice);

            if (!amountCheck.valid) {
                console.error('PayTR callback: TUTAR UYUŞMAZLIĞI', {
                    merchant_oid,
                    expected: amountCheck.expectedKurus,
                    received: amountCheck.receivedKurus,
                });
                await writeData(
                    'payment_attempts',
                    attempts.filter((a) => a.orderId !== merchant_oid)
                );
                res.status(200).send('OK');
                return;
            }

            const orders = normalizeOrders(await readData('orders', []), {
                includeRejected: true,
            });

            if (orders.some((o) => o.orderId === merchant_oid && o.status !== 'odeme-reddedildi')) {
                res.status(200).send('OK');
                return;
            }

            const receivedKurus = amountCheck.receivedKurus;

            const newOrder = {
                orderId: merchant_oid,
                customerName: attempt?.customerName || 'Bilinmiyor',
                customerPhone: attempt?.customerPhone || '',
                customerAddress: attempt?.customerAddress || '',
                customerEmail: attempt?.customerEmail || '',
                items: attempt?.items || '',
                totalPrice: attempt?.totalPrice || (receivedKurus / 100).toFixed(2),
                cartData: attempt?.cartData || [],
                status: 'onay-bekliyor',
                paymentMethod: attempt?.paymentMethod || 'paytr',
                paymentType: payment_type || '',
                installments: installment_count || '1',
                lastUpdate: new Date().toISOString(),
                estimatedDelivery: 'Bilgi Bekleniyor',
                paymentReceivedAt: new Date().toISOString(),
            };

            await writeData('orders', upsertOrder(orders, newOrder));

            if (attempt?.paymentRequestId) {
                const reqs = await readData('payment-requests', []);
                await writeData(
                    'payment-requests',
                    reqs.map((r) =>
                        r.id === attempt.paymentRequestId
                            ? { ...r, status: 'odendi', paidAt: new Date().toISOString(), orderId: merchant_oid }
                            : r
                    )
                );
            }

            await writeData(
                'payment_attempts',
                attempts.filter((a) => a.orderId !== merchant_oid)
            );
        } else {
            if (attempt) {
                await writeData(
                    'payment_attempts',
                    attempts.filter((a) => a.orderId !== merchant_oid)
                );
            }
            console.log(
                `PayTR: ${merchant_oid} iptal/red — orders'a yazılmadı. Kod: ${failed_reason_code}`
            );
        }

        res.status(200).send('OK');
    } catch (e) {
        console.error('paytr-callback handler hatası:', e);
        res.status(200).send('OK');
    }
}
