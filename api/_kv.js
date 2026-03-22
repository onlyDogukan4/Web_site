// Direct Upstash REST API wrapper — no SDK dependency
// Works with Vercel KV (KV_REST_API_URL / KV_REST_API_TOKEN)
// or standalone Upstash (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)

function getConfig() {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    return { url, token, ready: !!(url && token) };
}

export async function kvGet(key) {
    const { url, token, ready } = getConfig();
    if (!ready) return null;
    try {
        const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.result === null || data.result === undefined) return null;
        try { return JSON.parse(data.result); } catch { return data.result; }
    } catch { return null; }
}

export async function kvSet(key, value) {
    const { url, token, ready } = getConfig();
    if (!ready) return;
    try {
        await fetch(`${url}/pipeline`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify([['SET', key, JSON.stringify(value)]])
        });
    } catch { /* ignore write errors */ }
}
