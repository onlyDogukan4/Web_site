import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getFileProducts() {
    try {
        const content = readFileSync(join(__dirname, '..', 'products.json'), 'utf8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
    return [
        { "id": "1", "name_tr": "8.5 oz Karton Bardak (1000 adet)", "name_en": "8.5 oz Paper Cup (1000 pcs)", "price": 1453, "image": "images/bardak.png", "description_tr": "En yüksek kalite standartlarında üretilmiştir.", "description_en": "Produced with the highest quality standards.", "rating": "5.0", "bulk_threshold": 3, "bulk_rate": 20 },
        { "id": "3", "name_tr": "Ahşap Karıştırıcı (1000'li paket)", "name_en": "Wooden Stirrer (1000 pcs)", "price": 189.9, "image": "images/karistirici.jpeg", "description_tr": "Doğal ahşaptan üretilmiş karıştırıcı.", "description_en": "Stirrer made from natural wood.", "rating": "4.7" }
    ];
}

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || 'https://prime-monitor-83024.upstash.io';
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || 'gQAAAAAAAURQAAIncDE5OGU4MzFhZjBlZWQ0ZDRkYTNlMWI3NGFlY2Y4NGUwOHAxODMwMjQ';

async function kvGet(key) {
    const url = KV_URL;
    const token = KV_TOKEN;
    if (!url || !token) return null;
    try {
        const res = await fetch(`${url}/get/${key}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!data.result) return null;
        return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
    } catch { return null; }
}

async function kvSet(key, value) {
    const url = KV_URL;
    const token = KV_TOKEN;
    if (!url || !token) return false;
    try {
        const res = await fetch(`${url}/pipeline`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify([['SET', key, JSON.stringify(value)]])
        });
        return res.ok;
    } catch { return false; }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    if (req.method === 'POST') {
        const saved = await kvSet('products', req.body);
        return res.status(200).json({ success: true, stored_in_kv: saved });
    }
    if (req.method === 'GET') {
        const kvData = await kvGet('products');
        const products = (Array.isArray(kvData) && kvData.length > 0) ? kvData : getFileProducts();
        return res.status(200).json(products);
    }
    return res.status(405).json({ error: 'Method not allowed' });
}
