import { readData, writeData, corsHeaders } from './_db.js';

export default async function handler(req, res) {
    corsHeaders(res);
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    if (req.method === 'GET') {
        return res.status(200).json(await readData('orders', []));
    }

    if (req.method === 'POST') {
        const existing = await readData('orders', []);
        const newOrder = Array.isArray(req.body) ? req.body : [req.body];
        const merged = [...existing, ...newOrder];
        await writeData('orders', merged);
        return res.status(200).json({ success: true });
    }

    if (req.method === 'PUT') {
        const ok = await writeData('orders', req.body);
        return res.status(200).json({ success: true, saved: ok });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
