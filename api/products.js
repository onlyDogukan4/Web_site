import { readData, writeData, corsHeaders } from './_db.js';

const FALLBACK = [
    { id: "1", name_tr: "8.5 oz Karton Bardak (1000 adet)", name_en: "8.5 oz Paper Cup (1000 pcs)", price: 1453, image: "images/bardak.png", description_tr: "En yüksek kalite standartlarında üretilmiştir.", description_en: "Produced with the highest quality standards.", rating: "5.0", bulk_threshold: 3, bulk_rate: 20 },
    { id: "2", name_tr: "Plastik Kapak (1000 adet)", name_en: "Plastic Lid (1000 pcs)", price: 320, image: "images/kapak.png", description_tr: "8.5 oz bardaklarla uyumlu plastik kapak.", description_en: "Plastic lid compatible with 8.5 oz cups.", rating: "4.8" },
    { id: "3", name_tr: "Ahşap Karıştırıcı (1000'li paket)", name_en: "Wooden Stirrer (1000 pcs)", price: 189.9, image: "images/karistirici.jpeg", description_tr: "Doğal ahşaptan üretilmiş karıştırıcı.", description_en: "Stirrer made from natural wood.", rating: "4.7" }
];

export default async function handler(req, res) {
    corsHeaders(res);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    if (req.method === 'GET') {
        const data = readData('products', FALLBACK);
        const products = (Array.isArray(data) && data.length > 0) ? data : FALLBACK;
        return res.status(200).json(products);
    }

    if (req.method === 'POST') {
        const ok = writeData('products', req.body);
        return res.status(200).json({ success: true, saved: ok });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
