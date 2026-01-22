import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Güncel Dil Destekli Başlangıç Verileri
const INITIAL_PRODUCTS = [
    {
        "id": "1",
        "name_tr": "8.5 oz Karton Bardak (1000 adet)",
        "name_en": "8.5 oz Paper Cup (1000 pcs)",
        "price": 1453,
        "image": "images/bardak.png",
        "description_tr": "En yüksek kalite standartlarında üretilmiştir.",
        "description_en": "Produced with the highest quality standards.",
        "rating": "5.0"
    },
    {
        "id": "3",
        "name_tr": "Ahşap Karıştırıcı (100'lü Paket)",
        "name_en": "Wooden Stirrer (100 pcs)",
        "price": 189.9,
        "image": "images/karistirici.jpeg",
        "description_tr": "Doğal ahşaptan üretilmiş karıştırıcı.",
        "description_en": "Stirrer made from natural wood.",
        "rating": "4.7"
    },
    {
        "id": "4",
        "name_tr": "Kare Peçete (1000 Adet)",
        "name_en": "Square Napkin (1000 pcs)",
        "price": 99.9,
        "image": "images/pecete.png",
        "description_tr": "Yumuşak dokulu kare peçeteler.",
        "description_en": "Soft textured square napkins.",
        "rating": "4.9"
    },
    {
        "id": "6",
        "name_tr": "Sıcak İçecek Kapağı (1000 Adet)",
        "name_en": "Hot Drink Lid (1000 pcs)",
        "price": 149.9,
        "image": "images/kapak.png",
        "description_tr": "Sızdırmaz kapaklar.",
        "description_en": "Leak-proof lids.",
        "rating": "4.8"
    },
    {
        "id": "11",
        "name_tr": "Tekli Paket Islak Mendil (1000 Adet)",
        "name_en": "Single Pack Wet Wipe (1000 pcs)",
        "price": 279.9,
        "image": "images/mendil.png",
        "description_tr": "Hijyenik ıslak mendil.",
        "description_en": "Hygienic wet wipe.",
        "rating": "5.0"
    }
];

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'POST') {
            const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            await redis.set('products', data);
            return res.status(200).json({ success: true });
        } else {
            let data = await redis.get('products');
            // Eğer veritabanı boşsa veya eski formatta ise INITIAL_PRODUCTS ile başlat
            if (!data || !Array.isArray(data) || (data.length > 0 && !data[0].name_tr)) {
                await redis.set('products', INITIAL_PRODUCTS);
                data = INITIAL_PRODUCTS;
            }
            return res.status(200).json(data);
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
