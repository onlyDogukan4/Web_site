import { kvGet, kvSet } from './_kv.js';

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
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    try {
        if (req.method === 'POST') {
            await kvSet('products', req.body);
            return res.status(200).json({ success: true });
        } else if (req.method === 'GET') {
            const data = await kvGet('products');
            return res.status(200).json(data || DEFAULT_PRODUCTS);
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error("Products API Error:", error.message);
        return res.status(200).json(DEFAULT_PRODUCTS);
    }
}
