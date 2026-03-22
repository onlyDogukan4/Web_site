
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    try {
        if (req.method === 'POST') {
            await kv.set('concepts', req.body);
            return res.status(200).json({ success: true });
        } else if (req.method === 'GET') {
            const data = await kv.get('concepts');
            return res.status(200).json(data || []);
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error("Concepts API Error:", error.message);
        return res.status(200).json([]);
    }
}
