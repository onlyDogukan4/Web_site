import { readData, writeData, corsHeaders } from './_db.js';
import { normalizeOrders, upsertOrder } from '../lib/orders.js';

export default async function handler(req, res) {
    corsHeaders(res);
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        const raw = await readData('orders', []);
        const cleaned = normalizeOrders(raw);
        // Veritabanında eski tekrarlar / reddedilmiş kayıtlar varsa ilk GET'te temizle
        if (cleaned.length !== raw.length) {
            await writeData('orders', cleaned);
        }
        return res.status(200).json(cleaned);
    }

    if (req.method === 'PUT') {
        const body = Array.isArray(req.body) ? req.body : [];
        const cleaned = normalizeOrders(body, { includeRejected: false });
        await writeData('orders', cleaned);
        return res.status(200).json({ success: true, count: cleaned.length });
    }

    if (req.method === 'POST') {
        const body = req.body;

        // Admin tam liste gönderiyorsa → değiştir (eski append hatası giderildi)
        if (Array.isArray(body)) {
            const cleaned = normalizeOrders(body, { includeRejected: false });
            await writeData('orders', cleaned);
            return res.status(200).json({ success: true, count: cleaned.length, replaced: true });
        }

        // Tek yeni sipariş (manuel)
        if (body && body.orderId) {
            const existing = await readData('orders', []);
            const merged = upsertOrder(existing, body);
            await writeData('orders', merged);
            return res.status(200).json({ success: true, count: merged.length });
        }

        return res.status(400).json({ error: 'Geçersiz sipariş verisi' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
