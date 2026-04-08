export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');

    const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
    const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();

    if (!url || !token) {
        if (req.method === 'POST') return res.status(200).json({ success: true });
        return res.status(200).json({ time: 'Henüz güncellenmedi' });
    }

    try {
        if (req.method === 'POST') {
            const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            await fetch(`${url}/pipeline`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify([['SET', 'last_update', JSON.stringify(data)]])
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
        if (req.method === 'POST') return res.status(200).json({ success: true });
        return res.status(200).json({ time: 'Henüz güncellenmedi' });
    }
}
