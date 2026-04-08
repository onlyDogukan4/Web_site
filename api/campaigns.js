import { readData, writeData, corsHeaders } from './_db.js';

export default async function handler(req, res) {
    corsHeaders(res);
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    if (req.method === 'GET') {
        return res.status(200).json(readData('campaigns', []));
    }

    if (req.method === 'POST') {
        const ok = writeData('campaigns', req.body);
        return res.status(200).json({ success: true, saved: ok });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
