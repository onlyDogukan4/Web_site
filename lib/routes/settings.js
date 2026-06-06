import { readData, writeData, corsHeaders } from '../db.js';

const DEFAULTS = { minOrder: 500, freeShipping: 1000 };

export default async function handler(req, res) {
    corsHeaders(res);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    // ?type=last-update → last-update collection'ını yönet
    const isLastUpdate = req.query?.type === 'last-update';
    const collection   = isLastUpdate ? 'last-update' : 'settings';
    const fallback     = isLastUpdate ? { time: 'Henüz güncellenmedi' } : DEFAULTS;

    if (req.method === 'GET') {
        const data = await readData(collection, fallback);
        // MongoDB .toArray() döndürdüğünde array gelir, objeye çevir
        const result = Array.isArray(data) ? (data[0] || fallback) : (data || fallback);
        return res.status(200).json(result);
    }

    if (req.method === 'POST') {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const ok   = await writeData(collection, body);
        return res.status(200).json({ success: true, saved: ok });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
