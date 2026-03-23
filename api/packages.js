
import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        if (req.method === 'POST') {
            const data = req.body;
            await redis.set('packages', data);
            return res.status(200).json({ success: true });
        } else if (req.method === 'GET') {
            const data = await redis.get('packages');
            return res.status(200).json(data || []);
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error("Packages API Error:", error.message);
        return res.status(200).json([]);
    }
}
