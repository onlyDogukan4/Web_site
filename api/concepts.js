async function kvGet(key) {
    const url = 'https://prime-monitor-83024.upstash.io';
    const token = 'gQAAAAAAAURQAAIncDE5OGU4MzFhZjBlZWQ0ZDRkYTNlMWI3NGFlY2Y4NGUwOHAxODMwMjQ';
    if (!url || !token) return null;
    try {
        const res = await fetch(`${url}/get/${key}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!data.result) return null;
        return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
    } catch { return null; }
}

async function kvSet(key, value) {
    const url = 'https://prime-monitor-83024.upstash.io';
    const token = 'gQAAAAAAAURQAAIncDE5OGU4MzFhZjBlZWQ0ZDRkYTNlMWI3NGFlY2Y4NGUwOHAxODMwMjQ';
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

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    if (req.method === 'POST') {
        await kvSet('concepts', req.body);
        return res.status(200).json({ success: true });
    }
    if (req.method === 'GET') {
        const data = await kvGet('concepts');
        return res.status(200).json(data || []);
    }
    return res.status(405).json({ error: 'Method not allowed' });
}
