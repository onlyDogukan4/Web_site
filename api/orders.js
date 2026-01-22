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
    const url = (process.env.UPSTASH_REDIS_REST_URL || "").trim();
    const token = (process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();

    if (!url || !token) {
        return res.status(500).json({ error: "Upstash config missing" });
    }

    try {
        if (req.method === 'POST') {
            const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            const response = await fetch(`${url}/set/orders`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            return res.status(200).json({ success: true });
        } else {
            const response = await fetch(`${url}/get/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const body = await response.json();
            let data = body.result;

            if (data === null || data === undefined) {
                return res.status(200).json(INITIAL_ORDERS);
            }
            if (typeof data === 'string') {
                try { data = JSON.parse(data); } catch (e) { }
            }
            return res.status(200).json(data);
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
