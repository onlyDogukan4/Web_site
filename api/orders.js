import { Redis } from '@upstash/redis';

// Top-level initialization removed for Vercel stability

const INITIAL_ORDERS = [
    {
        "orderId": "MOD-12345",
        "customerName": "Deneme Kullanıcısı",
        "status": "hazirlaniyor",
        "lastUpdate": new Date().toISOString(),
        "items": "1000 adet Bardak",
        "estimatedDelivery": "2026-01-25"
    }
];

export default async function handler(req, res) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        return res.status(500).json({ error: "UPSTASH_REDIS_REST_URL veya TOKEN eksik!" });
    }

    const redis = new Redis({ url, token });

    try {
        if (req.method === 'POST') {
            const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            if (!Array.isArray(data)) throw new Error("Veri array olmalı");
            await redis.set('orders', data);
            return res.status(200).json({ success: true });
        } else {
            let data = await redis.get('orders');
            if (data === null || data === undefined) {
                return res.status(200).json(INITIAL_ORDERS);
            }
            return res.status(200).json(data);
        }
    } catch (error) {
        console.error("Redis Orders Error:", error);
        return res.status(500).json({
            error: "Sipariş veritabanı bağlantı hatası!",
            details: error.message
        });
    }
}
