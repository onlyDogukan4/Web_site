import { readData, writeData, corsHeaders } from './_db.js';

export default async function handler(req, res) {
    corsHeaders(res);
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    const requests = await readData('payment-requests', []);

    if (req.method === 'GET') {
        const { id } = req.query;
        if (id) {
            const item = requests.find(r => r.id === id);
            if (!item) return res.status(404).json({ error: 'Bulunamadı' });
            return res.status(200).json(item);
        }
        return res.status(200).json(requests);
    }

    if (req.method === 'POST') {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

        if (body.action === 'delete') {
            const updated = requests.filter(r => r.id !== body.id);
            await writeData('payment-requests', updated);
            return res.status(200).json({ success: true });
        }

        // Yeni ödeme isteği oluştur
        const newItem = {
            id: 'pay_' + Math.random().toString(36).substr(2, 9),
            customerName:  body.customerName  || 'Bilinmiyor',
            customerPhone: body.customerPhone || '',
            customerEmail: body.customerEmail || '',
            description:   body.description   || 'Manuel Ödeme',
            amount:        parseFloat(body.amount) || 0,
            status:        'bekliyor',
            createdAt:     new Date().toISOString(),
            orderId:       null,
            paidAt:        null
        };

        await writeData('payment-requests', [...requests, newItem]);
        return res.status(200).json({ success: true, request: newItem });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
