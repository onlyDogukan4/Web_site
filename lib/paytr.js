import crypto from 'crypto';

/**
 * PayTR ödeme yardımcıları — saf fonksiyonlar, unit test için ayrıldı.
 * Üretimde PAYTR_* ortam değişkenlerini kullanın.
 */
export function getPaytrConfig() {
    return {
        merchantId: process.env.PAYTR_MERCHANT_ID || '678000',
        merchantKey: process.env.PAYTR_MERCHANT_KEY || '5fgrzYub5qo81AFu',
        merchantSalt: process.env.PAYTR_MERCHANT_SALT || 'oM2A83JNkpDmNogQ',
        testMode: process.env.PAYTR_TEST_MODE || '1',
    };
}

export function getSiteUrl() {
    return (
        process.env.SITE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    );
}

/** ₺ → kuruş (tam sayı) */
export function amountToKurus(amount) {
    return Math.round(parseFloat(amount) * 100);
}

/** PayTR sepet formatından base64 user_basket */
export function buildUserBasket(items) {
    const basketArr = items.map((item) => [
        String(item.name).substring(0, 100),
        parseFloat(item.price).toFixed(2),
        parseInt(item.quantity, 10),
    ]);
    return Buffer.from(JSON.stringify(basketArr)).toString('base64');
}

/** iframe token isteği için HMAC hash */
export function buildPaytrTokenHash({
    merchantId,
    userIp,
    merchantOid,
    email,
    paymentAmountKurus,
    userBasket,
    noInstallment = '0',
    maxInstallment = '12',
    currency = 'TL',
    testMode = '1',
    merchantKey,
    merchantSalt,
}) {
    const hashStr =
        merchantId +
        userIp +
        merchantOid +
        email +
        paymentAmountKurus +
        userBasket +
        noInstallment +
        maxInstallment +
        currency +
        testMode;

    return crypto.createHmac('sha256', merchantKey).update(hashStr + merchantSalt).digest('base64');
}

/** PayTR callback hash doğrulama */
export function buildCallbackHash({ merchantOid, status, totalAmount, merchantKey, merchantSalt }) {
    const hashStr = merchantOid + merchantSalt + status + totalAmount;
    return crypto.createHmac('sha256', merchantKey).update(hashStr).digest('base64');
}

export function verifyCallbackHash({ merchantOid, status, totalAmount, hash, merchantKey, merchantSalt }) {
    const expected = buildCallbackHash({ merchantOid, status, totalAmount, merchantKey, merchantSalt });
    return hash === expected;
}

/**
 * Callback tutar güvenlik kontrolü.
 * @returns {{ valid: boolean, expectedKurus: number, receivedKurus: number }}
 */
export function validateCallbackAmount(totalAmount, attemptTotalPrice) {
    const expectedKurus = attemptTotalPrice ? amountToKurus(attemptTotalPrice) : 0;
    const receivedKurus = parseInt(totalAmount, 10);

    if (expectedKurus > 0 && receivedKurus < expectedKurus) {
        return { valid: false, expectedKurus, receivedKurus };
    }
    return { valid: true, expectedKurus, receivedKurus };
}

export function extractClientIp(req) {
    return (
        (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
        req.socket?.remoteAddress ||
        '1.1.1.1'
    );
}

/** Test/CI için PayTR API çağrısını atla */
export function isPaytrMockEnabled() {
    return process.env.PAYTR_MOCK === 'true' || process.env.PAYTR_MOCK === '1';
}

/** Mock token — gerçek ödeme yapılmaz */
export function createMockPaytrToken(orderId) {
    return `mock_${orderId}_${Date.now()}`;
}

/** Taksit oranları sorgu token */
export function buildInstallmentRatesToken({ merchantId, requestId, merchantKey, merchantSalt }) {
    const hashStr = merchantId + requestId + merchantSalt;
    return crypto.createHmac('sha256', merchantKey).update(hashStr).digest('base64');
}

/**
 * PayTR taksit-oranlari API — güncel banka/kart taksit oranları
 * @returns {Promise<object|null>}
 */
export async function fetchPaytrInstallmentRates(config = getPaytrConfig()) {
    const requestId = `mod_${Date.now()}`;
    const paytr_token = buildInstallmentRatesToken({
        merchantId: config.merchantId,
        requestId,
        merchantKey: config.merchantKey,
        merchantSalt: config.merchantSalt,
    });

    const params = new URLSearchParams({
        merchant_id: config.merchantId,
        request_id: requestId,
        paytr_token,
        single_ratio: '1',
    });

    const res = await fetch('https://www.paytr.com/odeme/taksit-oranlari', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });

    const data = await res.json();
    if (data.status !== 'success') {
        console.error('PayTR taksit-oranlari:', data.err_msg || data);
        return null;
    }
    return data;
}

/** Oran objesinden taksit sayısı → komisyon % */
export function parseInstallmentRateMap(brandRates) {
    if (!brandRates || typeof brandRates !== 'object') return [];
    const options = [];

    for (const [key, val] of Object.entries(brandRates)) {
        const m = String(key).match(/(\d+)/);
        if (!m) continue;
        const count = parseInt(m[1], 10);
        if (count < 2 || count > 12) continue;
        const rate = parseFloat(val);
        if (Number.isNaN(rate)) continue;
        options.push({ count, rate });
    }

    return options.sort((a, b) => a.count - b.count);
}

export const INSTALLMENT_BRAND_LABELS = {
    axess: 'Axess',
    world: 'World',
    maximum: 'Maximum',
    cardfinans: 'CardFinans',
    bonus: 'Bonus',
    advantage: 'Advantage',
    combo: 'Combo',
    paraf: 'Paraf',
};
