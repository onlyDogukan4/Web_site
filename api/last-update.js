import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) return res.status(500).json({ error: "Missing Redis Config" });

    const redis = new Redis({ url, token });

    try {
        if (req.method === 'POST') {
            const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            await redis.set('last_update', data);
            return res.status(200).json({ success: true });
        } else {
            const data = await redis.get('last_update');
            return res.status(200).json(data || { time: 'Henüz güncellenmedi' });
        }
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
