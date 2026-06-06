import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readData, writeData } from './lib/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

// ── Yardımcılar ──────────────────────────────────────────────────────────────

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

// ── Vercel API handler adaptörü ─────────────────────────────────────────────

function createVercelRes(nodeRes) {
    const res = {
        statusCode: 200,
        setHeader(k, v) {
            nodeRes.setHeader(k, v);
        },
        status(code) {
            res.statusCode = code;
            return res;
        },
        json(data) {
            nodeRes.statusCode = res.statusCode;
            nodeRes.setHeader('Content-Type', 'application/json');
            nodeRes.end(JSON.stringify(data));
        },
        send(data) {
            nodeRes.statusCode = res.statusCode;
            nodeRes.end(typeof data === 'string' ? data : String(data));
        },
        end() {
            nodeRes.statusCode = res.statusCode;
            nodeRes.end();
        },
    };
    return res;
}

async function runApiHandler(importPath, req, nodeRes) {
    const mod = await import(importPath);
    const handler = mod.default;
    const body = await parseBody(req);
    const vercelReq = {
        method: req.method,
        headers: req.headers,
        body,
        query: Object.fromEntries(new URL(req.url, 'http://localhost').searchParams),
    };
    const vercelRes = createVercelRes(nodeRes);
    await handler(vercelReq, vercelRes);
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
                return json(res, await readData(key, defaults[key]));
            }

            if (req.method === 'POST') {
                const body = await parseBody(req);
                if (key === 'orders') {
                    const { normalizeOrders, upsertOrder } = await import('./lib/orders.js');
                    if (Array.isArray(body)) {
                        await writeData('orders', normalizeOrders(body));
                    } else if (body?.orderId) {
                        const existing = await readData('orders', []);
                        await writeData('orders', upsertOrder(existing, body));
                    }
                } else {
                    await writeData(key, body);
                }
                return json(res, { success: true });
            }

            if (req.method === 'PUT') {
                const body = await parseBody(req);
                await writeData(key, body);
                return json(res, { success: true });
            }
        }

    // ── AI (Groq — api/chat.js, cart-chat.js) ──────────────────────────────

    const aiRoutes = {
        '/api/chat': { path: './api/chat.js', query: {} },
        '/api/cart-chat': { path: './api/chat.js', query: { mode: 'cart' } },
        '/api/site-context': { path: './api/chat.js', query: {} },
        '/api/paytr-installments': { path: './api/paytr.js', query: { action: 'installments' } },
        '/api/paytr-token': { path: './api/paytr.js', query: { action: 'token' } },
        '/api/paytr-callback': { path: './api/paytr.js', query: { action: 'callback' } },
        '/api/payment-requests': { path: './api/paytr.js', query: { action: 'payment-requests' } },
    };

    if (aiRoutes[url]) {
        try {
            const route = aiRoutes[url];
            const mod = await import(route.path);
            const handler = mod.default;
            const body = await parseBody(req);
            const vercelReq = {
                method: req.method,
                headers: req.headers,
                body,
                query: {
                    ...Object.fromEntries(new URL(req.url, 'http://localhost').searchParams),
                    ...route.query,
                },
                socket: { remoteAddress: req.socket.remoteAddress },
            };
            const vercelRes = createVercelRes(res);
            await handler(vercelReq, vercelRes);
            return;
        } catch (e) {
            return json(res, { error: 'API hatası: ' + e.message }, 500);
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
