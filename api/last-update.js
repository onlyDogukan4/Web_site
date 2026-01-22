export default async function handler(req, res) {
    const url = (process.env.UPSTASH_REDIS_REST_URL || "").trim();
    const token = (process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();

    if (!url || !token) return res.status(500).json({ error: "Missing Config" });

    try {
        if (req.method === 'POST') {
            const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            await fetch(`${url}/set/last_update`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            return res.status(200).json({ success: true });
        } else {
            const response = await fetch(`${url}/get/last_update`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const body = await response.json();
            let data = body.result;
            if (typeof data === 'string') {
                try { data = JSON.parse(data); } catch (e) { }
            }
            return res.status(200).json(data || { time: 'Henüz güncellenmedi' });
        }
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
