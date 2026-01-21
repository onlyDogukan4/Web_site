import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Initial data if Redis is empty
const INITIAL_PRODUCTS = [
    { "id": "1", "name": "6.5 oz Karton Bardak (1000 adet)", "price": 1100, "image": "images/bardak.png", "description": "En yüksek kalite standartlarında üretilmiştir.", "rating": "5.0" },
    { "id": "3", "name": "Ahşap Karıştırıcı (1000'li Paket)", "price": 189.9, "image": "images/karistirici.jpeg", "description": "Doğal ahşaptan üretilmiş karıştırıcı.", "rating": "4.7" },
    { "id": "4", "name": "Kare Peçete (1000 Adet)", "price": 99.9, "image": "images/pecete.png", "description": "Yumuşak dokulu kare peçeteler.", "rating": "4.9" },
    { "id": "6", "name": "Sıcak İçecek Kapağı (1000 Adet)", "price": 149.9, "image": "images/kapak.png", "description": "Sızdırmaz kapaklar.", "rating": "4.8" },
    { "id": "7", "name": "Stick Şeker (1000 Adet)", "price": 449.5, "image": "images/seker.png", "description": "Hijyenik beyaz stick şeker.", "rating": "5.0" },
    { "id": "8", "name": "Logolu Kalem (50 Adet)", "price": 119.9, "image": "images/kalem.png", "description": "Markanıza özel tükenmez kalem.", "rating": "4.6" },
    { "id": "9", "name": "Çakmak (10 Adet)", "price": 219.9, "image": "images/çakmak.png", "description": "Güvenilir mekanizmalı çakmaklar.", "rating": "4.7" },
    { "id": "10", "name": "Soğuk İçecek Bardağı 12 oz (100 Adet)", "price": 199.9, "image": "images/pet.png", "description": "Şeffaf pet bardaklar.", "rating": "4.9" },
    { "id": "11", "name": "Tekli Paket Islak Mendil (1000 Adet)", "price": 279.9, "image": "images/mendil.png", "description": "Hijyenik ıslak mendil.", "rating": "5.0" }
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
            await redis.set('products', data);
            return res.status(200).json({ success: true });
        } else {
            let data = await redis.get('products');
            if (!data) {
                await redis.set('products', INITIAL_PRODUCTS);
                data = INITIAL_PRODUCTS;
            }
            return res.status(200).json(data);
        }
    } catch (error) {
        console.error("Redis Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
