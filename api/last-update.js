import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        await redis.set('last_update', data);
        return res.status(200).json({ success: true });
    } else {
        const data = await redis.get('last_update');
        return res.status(200).json(data || { time: 'Henüz güncellenmedi' });
    }
}
