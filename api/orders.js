import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'POST') {
            const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            await redis.set('orders', data);
            return res.status(200).json({ success: true });
        } else {
            let data = await redis.get('orders');
            if (!data) {
                await redis.set('orders', INITIAL_ORDERS);
                data = INITIAL_ORDERS;
            }
            return res.status(200).json(data);
        }
    } catch (error) {
        console.error("Redis Orders Error:", error);
        // ÖNEMLİ: Veritabanı bağlantısı kopsa bile sorgulama sayfasının hata vermemesi için
        // başlangıç verilerini (INITIAL_ORDERS) geri döndürüyoruz.
        return res.status(200).json(INITIAL_ORDERS);
    }
}
