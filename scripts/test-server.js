/**
 * E2E testleri için yerel sunucu.
 * Statik dosyalar + PayTR API route'ları (mock modda).
 *
 * Kullanım: npm run test:server
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resetMemoryDb } from '../api/_db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PORT = process.env.TEST_PORT || 3099;

process.env.USE_MEMORY_DB = 'true';
process.env.PAYTR_MOCK = 'true';
process.env.SITE_URL = `http://localhost:${PORT}`;

resetMemoryDb();

const routes = {
    '/api/paytr-token': () => import('../api/paytr-token.js'),
    '/api/paytr-callback': () => import('../api/paytr-callback.js'),
    '/api/payment-requests': () => import('../api/payment-requests.js'),
    '/api/orders': () => import('../api/orders.js'),
    '/api/products': () => import('../api/products.js'),
    '/api/settings': () => import('../api/settings.js'),
    '/api/chat': () => import('../api/chat.js'),
    '/api/cart-chat': () => import('../api/cart-chat.js'),
    '/api/site-context': () => import('../api/chat.js'),
    '/api/paytr-installments': () => import('../api/paytr-installments.js'),
};

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

function parseBody(req) {
    return new Promise((resolve) => {
        let data = '';
        req.on('data', (chunk) => (data += chunk));
        req.on('end', () => {
            if (!data) return resolve({});
            const ct = req.headers['content-type'] || '';
            if (ct.includes('application/json')) {
                try {
                    resolve(JSON.parse(data));
                } catch {
                    resolve({});
                }
            } else if (ct.includes('application/x-www-form-urlencoded')) {
                resolve(Object.fromEntries(new URLSearchParams(data)));
            } else {
                try {
                    resolve(JSON.parse(data));
                } catch {
                    resolve({});
                }
            }
        });
    });
}

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

function serveStatic(urlPath, nodeRes) {
    let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
    if (!filePath.startsWith(ROOT)) {
        nodeRes.statusCode = 403;
        nodeRes.end('Forbidden');
        return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }
    if (!fs.existsSync(filePath)) {
        nodeRes.statusCode = 404;
        nodeRes.end('Not Found');
        return;
    }
    const ext = path.extname(filePath);
    nodeRes.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    nodeRes.end(fs.readFileSync(filePath));
}

const server = http.createServer(async (nodeReq, nodeRes) => {
    const url = new URL(nodeReq.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    if (routes[pathname]) {
        try {
            const mod = await routes[pathname]();
            const handler = mod.default;
            const body = await parseBody(nodeReq);
            const req = {
                method: nodeReq.method,
                headers: nodeReq.headers,
                body,
                query: Object.fromEntries(url.searchParams),
                socket: { remoteAddress: nodeReq.socket.remoteAddress },
            };
            const res = createVercelRes(nodeRes);
            await handler(req, res);
        } catch (e) {
            console.error('API hata:', pathname, e);
            nodeRes.statusCode = 500;
            nodeRes.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    serveStatic(pathname, nodeRes);
});

server.listen(PORT, () => {
    console.log(`Test sunucusu: http://localhost:${PORT} (PAYTR_MOCK + bellek DB)`);
});
