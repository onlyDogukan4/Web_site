
import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const DEFAULT_PRODUCTS = [
    {
        "id": "1",
        "name_tr": "8.5 oz Karton Bardak (1000 adet)",
        "name_en": "8.5 oz Paper Cup (1000 pcs)",
        "price": 1453,
        "image": "images/bardak.png",
        "description_tr": "En yüksek kalite standartlarında üretilmiştir.",
        "description_en": "Produced with the highest quality standards.",
        "rating": "5.0",
        "bulk_threshold": 3,
        "bulk_rate": 20
    },
    {
        "id": "3",
        "name_tr": "Ahşap Karıştırıcı (1000'li paket)",
        "name_en": "Wooden Stirrer (1000 pcs)",
        "price": 189.9,
        "image": "images/karistirici.jpeg",
        "description_tr": "Doğal ahşaptan üretilmiş karıştırıcı.",
        "description_en": "Stirrer made from natural wood.",
        "rating": "4.7"
    }
];

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=30');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (req.method === 'POST') {
            const data = req.body;
            await redis.set('products', data);
            return res.status(200).json({ success: true });
        } else if (req.method === 'GET') {
            let data = await redis.get('products');
            if (!data) {
                console.log("Redis cache miss, seeding default products...");
                await redis.set('products', DEFAULT_PRODUCTS);
                data = DEFAULT_PRODUCTS;
            }
            return res.status(200).json(data || []);
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error("Products API Error:", error);
        // Fallback to default data in case of Redis error to keep site working
        return res.status(200).json(DEFAULT_PRODUCTS);
    }
}
