import { readData, writeData, corsHeaders } from './_db.js';

const DEFAULTS = { minOrder: 500, freeShipping: 1000 };

export default async function handler(req, res) {
    corsHeaders(res);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    if (req.method === 'GET') {
        const data = await readData('settings', DEFAULTS);
        return res.status(200).json(data || DEFAULTS);
    }

    if (req.method === 'POST') {
        const ok = await writeData('settings', req.body);
        return res.status(200).json({ success: true, saved: ok });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
