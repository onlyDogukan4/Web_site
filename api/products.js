const DEFAULT_PRODUCTS = [
    { "id": "1", "name_tr": "8.5 oz Karton Bardak (1000 adet)", "name_en": "8.5 oz Paper Cup (1000 pcs)", "price": 1453, "image": "images/bardak.png", "description_tr": "En yüksek kalite standartlarında üretilmiştir.", "description_en": "Produced with the highest quality standards.", "rating": "5.0", "bulk_threshold": 3, "bulk_rate": 20 },
    { "id": "3", "name_tr": "Ahşap Karıştırıcı (1000'li paket)", "name_en": "Wooden Stirrer (1000 pcs)", "price": 189.9, "image": "images/karistirici.jpeg", "description_tr": "Doğal ahşaptan üretilmiş karıştırıcı.", "description_en": "Stirrer made from natural wood.", "rating": "4.7" }
];

async function kvGet(key) {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    try {
        const res = await fetch(`${url}/get/${key}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!data.result) return null;
        return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
    } catch { return null; }
}

async function kvSet(key, value) {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return;
    try {
        await fetch(`${url}/pipeline`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify([['SET', key, JSON.stringify(value)]])
        });
    } catch { }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    if (req.method === 'POST') {
        await kvSet('products', req.body);
        return res.status(200).json({ success: true });
    }
    if (req.method === 'GET') {
        const data = await kvGet('products');
        return res.status(200).json((Array.isArray(data) && data.length > 0) ? data : DEFAULT_PRODUCTS);
    }
    return res.status(405).json({ error: 'Method not allowed' });
}
