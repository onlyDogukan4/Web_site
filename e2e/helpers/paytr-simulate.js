import { buildCallbackHash, getPaytrConfig } from '../../api/lib/paytr.js';

/** Playwright E2E: PayTR callback simülasyonu */
export async function simulatePaytrSuccess(request, baseURL, orderId, totalPrice) {
    const config = getPaytrConfig();
    const total_amount = String(Math.round(parseFloat(totalPrice) * 100));
    const status = 'success';

    const hash = buildCallbackHash({
        merchantOid: orderId,
        status,
        totalAmount: total_amount,
        merchantKey: config.merchantKey,
        merchantSalt: config.merchantSalt,
    });

    const res = await request.post(`${baseURL}/api/paytr-callback`, {
        form: { merchant_oid: orderId, status, total_amount, hash },
    });

    return res;
}
