import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    amountToKurus,
    buildUserBasket,
    buildPaytrTokenHash,
    buildCallbackHash,
    verifyCallbackHash,
    validateCallbackAmount,
    getPaytrConfig,
} from '../../api/lib/paytr.js';

describe('PayTR — birim testler', () => {
    const config = getPaytrConfig();

    describe('amountToKurus', () => {
        it('TL tutarını kuruşa çevirir', () => {
            expect(amountToKurus(51)).toBe(5100);
            expect(amountToKurus(25.5)).toBe(2550);
            expect(amountToKurus('100.99')).toBe(10099);
        });
    });

    describe('buildUserBasket', () => {
        it('PayTR formatında base64 sepet üretir', () => {
            const basket = buildUserBasket([{ name: 'Bardak', price: 15, quantity: 2 }]);
            const decoded = JSON.parse(Buffer.from(basket, 'base64').toString());
            expect(decoded).toEqual([['Bardak', '15.00', 2]]);
        });

        it('uzun ürün adını 100 karaktere kısaltır', () => {
            const longName = 'A'.repeat(150);
            const basket = buildUserBasket([{ name: longName, price: 10, quantity: 1 }]);
            const decoded = JSON.parse(Buffer.from(basket, 'base64').toString());
            expect(decoded[0][0].length).toBe(100);
        });
    });

    describe('buildPaytrTokenHash', () => {
        it('aynı girdilerle deterministik hash üretir', () => {
            const params = {
                merchantId: config.merchantId,
                userIp: '1.2.3.4',
                merchantOid: 'MOD12345',
                email: 'test@test.com',
                paymentAmountKurus: 5100,
                userBasket: buildUserBasket([{ name: 'X', price: 25.5, quantity: 2 }]),
                merchantKey: config.merchantKey,
                merchantSalt: config.merchantSalt,
                testMode: '1',
            };
            const h1 = buildPaytrTokenHash(params);
            const h2 = buildPaytrTokenHash(params);
            expect(h1).toBe(h2);
            expect(h1.length).toBeGreaterThan(10);
        });
    });

    describe('verifyCallbackHash', () => {
        it('geçerli callback hashini doğrular', () => {
            const merchantOid = 'MOD99999';
            const status = 'success';
            const total_amount = '5100';

            const hash = buildCallbackHash({
                merchantOid,
                status,
                totalAmount: total_amount,
                merchantKey: config.merchantKey,
                merchantSalt: config.merchantSalt,
            });

            expect(
                verifyCallbackHash({
                    merchantOid,
                    status,
                    totalAmount: total_amount,
                    hash,
                    merchantKey: config.merchantKey,
                    merchantSalt: config.merchantSalt,
                })
            ).toBe(true);
        });

        it('sahte hash reddeder', () => {
            expect(
                verifyCallbackHash({
                    merchantOid: 'MOD99999',
                    status: 'success',
                    totalAmount: '5100',
                    hash: 'invalid-hash-value',
                    merchantKey: config.merchantKey,
                    merchantSalt: config.merchantSalt,
                })
            ).toBe(false);
        });
    });

    describe('validateCallbackAmount', () => {
        it('eksik tutarı reddeder', () => {
            const result = validateCallbackAmount('4000', 51);
            expect(result.valid).toBe(false);
            expect(result.expectedKurus).toBe(5100);
            expect(result.receivedKurus).toBe(4000);
        });

        it('tam tutarı kabul eder', () => {
            const result = validateCallbackAmount('5100', 51);
            expect(result.valid).toBe(true);
        });

        it('fazla ödemeyi kabul eder', () => {
            const result = validateCallbackAmount('6000', 51);
            expect(result.valid).toBe(true);
        });
    });
});
