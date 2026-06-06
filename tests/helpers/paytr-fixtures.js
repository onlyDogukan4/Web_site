import { buildCallbackHash, getPaytrConfig } from '../../lib/paytr.js';

export const TEST_CART = [
    { name: 'Test Bardak', price: 25.5, quantity: 2 },
];

export const TEST_USER = {
    name: 'Test Müşteri',
    phone: '05551234567',
    email: 'test@example.com',
    address: 'Test Adres 1',
};

export const TEST_TOTAL = 51.0;

/** Başarılı PayTR callback gövdesi (hash dahil) */
export function buildSuccessCallbackBody(merchantOid, totalPrice, totalAmountKurusOverride) {
    const config = getPaytrConfig();
    const total_amount =
        totalAmountKurusOverride !== undefined
            ? String(totalAmountKurusOverride)
            : String(Math.round(parseFloat(totalPrice) * 100));
    const status = 'success';

    const hash = buildCallbackHash({
        merchantOid,
        status,
        totalAmount: total_amount,
        merchantKey: config.merchantKey,
        merchantSalt: config.merchantSalt,
    });

    return { merchant_oid: merchantOid, status, total_amount, hash };
}

/** Başarısız ödeme callback */
export function buildFailedCallbackBody(merchantOid, totalPrice) {
    const config = getPaytrConfig();
    const total_amount = String(Math.round(parseFloat(totalPrice) * 100));
    const status = 'failed';

    const hash = buildCallbackHash({
        merchantOid,
        status,
        totalAmount: total_amount,
        merchantKey: config.merchantKey,
        merchantSalt: config.merchantSalt,
    });

    return {
        merchant_oid: merchantOid,
        status,
        total_amount,
        hash,
        failed_reason_code: '0',
        failed_reason_msg: 'Test iptal',
    };
}
