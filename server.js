
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

// ── JSON dosya yardımcıları ──────────────────────────────────────────────────

function readJSON(filename, fallback = []) {
    try {
        const raw = fs.readFileSync(path.join(__dirname, `${filename}.json`), 'utf-8');
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

function writeJSON(filename, data) {
    try {
        fs.writeFileSync(path.join(__dirname, `${filename}.json`), JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (e) {
        console.error(`writeJSON(${filename}) hata:`, e.message);
        return false;
    }
}

function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try { resolve(JSON.parse(body)); } catch { resolve({}); }
        });
    });
}

function json(res, data, status = 200) {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(data));
}

// ── Chatbot API anahtarı ─────────────────────────────────────────────────────

function getGrokApiKey() {
    if (process.env.GROK_API_KEY) return process.env.GROK_API_KEY;
    try {
        const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
        const match = envContent.match(/GROK_API_KEY=(.*)/);
        return match ? match[1].trim() : null;
    } catch {
        return null;
    }
}

// ── Sunucu ───────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
    const url = req.url.split('?')[0];

    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    // ── Veri API'leri (JSON dosyalarından) ──────────────────────────────────

    const dataRoutes = {
        '/api/products':    'products',
        '/api/packages':    'packages',
        '/api/concepts':    'concepts',
        '/api/campaigns':   'campaigns',
        '/api/settings':    'settings',
        '/api/orders':      'orders',
        '/api/last-update': 'last-update',
    };

    const defaults = {
        products:    [],
        packages:    [],
        concepts:    [],
        campaigns:   [],
        settings:    { minOrder: 500, freeShipping: 1000 },
        orders:      [],
        'last-update': { time: 'Henüz güncellenmedi' }
    };

    if (dataRoutes[url]) {
        const key = dataRoutes[url];

        if (req.method === 'GET') {
            return json(res, readJSON(key, defaults[key]));
        }

        if (req.method === 'POST') {
            const body = await parseBody(req);
            if (key === 'orders') {
                // Siparişleri biriktir (üzerine yazma)
                const existing = readJSON('orders', []);
                const newOrders = Array.isArray(body) ? body : [body];
                writeJSON('orders', [...existing, ...newOrders]);
            } else {
                writeJSON(key, body);
            }
            return json(res, { success: true });
        }

        if (req.method === 'PUT') {
            const body = await parseBody(req);
            writeJSON(key, body);
            return json(res, { success: true });
        }
    }

    // ── Chatbot (xAI Grok) ──────────────────────────────────────────────────

    if (url === '/api/chat' && req.method === 'POST') {
        const { prompt, chatHistory, siteContext } = await parseBody(req);
        const API_KEY = getGrokApiKey();

        if (!API_KEY) {
            return json(res, { error: 'GROK_API_KEY .env dosyasında bulunamadı' }, 500);
        }

        try {
            const messages = [
                {
                    role: 'system',
                    content: `Sen Dr. Karton'sun. Moderra'nın EN TUTKULU hayranısın! Moderra karton bardak ve ambalaj şirketidir. Kısa ve öz cevap ver (2-3 cümle). SİTE: ${siteContext}`
                },
                ...(chatHistory || []).map(h => ({
                    role: h.role === 'model' ? 'assistant' : h.role,
                    content: h.parts ? h.parts[0].text : h.content
                })),
                { role: 'user', content: prompt }
            ];

            const apiRes = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
                body: JSON.stringify({ model: 'grok-3-mini', messages, max_tokens: 400, temperature: 0.85 })
            });
            const data = await apiRes.json();
            return json(res, { grok: true, choices: data.choices, error: data.error });
        } catch (e) {
            return json(res, { error: 'Grok API hatası: ' + e.message }, 500);
        }
    }

    if (url === '/api/cart-chat' && req.method === 'POST') {
        const { prompt, siteContext } = await parseBody(req);
        const API_KEY = getGrokApiKey();
        if (!API_KEY) return json(res, { choices: [{ message: { content: 'Harika seçimler!' } }] });

        try {
            const apiRes = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
                body: JSON.stringify({
                    model: 'grok-3-mini',
                    messages: [
                        { role: 'system', content: `Moderra sepet danışmanısın. Kısa teşvik et. Ürünler: ${siteContext}` },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 150, temperature: 0.7
                })
            });
            const data = await apiRes.json();
            return json(res, { choices: data.choices });
        } catch {
            return json(res, { choices: [{ message: { content: 'Harika seçimler, Efendim!' } }] });
        }
    }

    // ── Statik dosyalar ─────────────────────────────────────────────────────

    let filePath = url === '/' ? '/index.html' : url;
    const ext = path.extname(filePath);
    const contentTypes = {
        '.html': 'text/html',
        '.js':   'text/javascript',
        '.css':  'text/css',
        '.json': 'application/json',
        '.png':  'image/png',
        '.jpg':  'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg':  'image/svg+xml',
        '.ico':  'image/x-icon',
        '.webp': 'image/webp'
    };

    const fullPath = path.join(__dirname, filePath);
    fs.readFile(fullPath, (err, content) => {
        if (err) {
            res.writeHead(err.code === 'ENOENT' ? 404 : 500);
            res.end(err.code === 'ENOENT' ? 'Dosya bulunamadı' : 'Sunucu hatası');
        } else {
            res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n Moderra Sunucu Başlatıldı`);
    console.log(`---------------------------`);
    console.log(` http://localhost:${PORT}`);
    console.log(`---------------------------\n`);
});
