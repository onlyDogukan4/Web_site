import { corsHeaders } from './_db.js';
import {
    getPaytrConfig,
    fetchPaytrInstallmentRates,
    parseInstallmentRateMap,
    INSTALLMENT_BRAND_LABELS,
    isPaytrMockEnabled,
} from './lib/paytr.js';

function buildMockRates(amount) {
    const brands = ['bonus', 'world', 'maximum', 'axess'];
    const counts = [2, 3, 6, 9, 12];
    const oranlar = {};
    for (const b of brands) {
        oranlar[b] = {};
        counts.forEach((n, i) => {
            oranlar[b][`taksit_${n}`] = String(1.2 + i * 0.35);
        });
    }
    return { status: 'success', max_inst_non_bus: 12, oranlar, mock: true, amount };
}

function buildPlansForAmount(amount, oranlar) {
    const plans = [];

    for (const [brandKey, rates] of Object.entries(oranlar || {})) {
        const options = parseInstallmentRateMap(rates);
        if (!options.length) continue;

        plans.push({
            brand: brandKey,
            label: INSTALLMENT_BRAND_LABELS[brandKey] || brandKey,
            options: options.map(({ count, rate }) => {
                const totalWithFee = amount * (1 + rate / 100);
                const monthly = totalWithFee / count;
                return {
                    count,
                    rate,
                    monthly: Math.round(monthly * 100) / 100,
                    total: Math.round(totalWithFee * 100) / 100,
                };
            }),
        });
    }

    return plans;
}

export default async function handler(req, res) {
    corsHeaders(res);
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const amount = parseFloat(req.query?.amount);
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'amount gerekli (TL)' });
    }

    try {
        if (isPaytrMockEnabled()) {
            const mock = buildMockRates(amount);
            return res.status(200).json({
                amount,
                plans: buildPlansForAmount(amount, mock.oranlar),
                mock: true,
            });
        }

        const raw = await fetchPaytrInstallmentRates();
        if (!raw?.oranlar) {
            return res.status(502).json({ error: 'Taksit oranları alınamadı' });
        }

        return res.status(200).json({
            amount,
            maxInstallment: raw.max_inst_non_bus || 12,
            plans: buildPlansForAmount(amount, raw.oranlar),
        });
    } catch (e) {
        console.error('paytr-installments:', e);
        return res.status(500).json({ error: e.message });
    }
}
