
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { Redis } from '@upstash/redis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Initialize Upstash Redis
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || 'https://stable-bug-37497.upstash.io',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || 'AZJ5AAIncDJhYWY3ZTMzZmI0NDc0MmJiOTA4ZWJiY2I4OGZlN2Q3MnAyMzc0OTc',
});

// Helper: Seed initial data if database is empty
async function seedData() {
    try {
        const prodCheck = await redis.get('products');
        if (!prodCheck) {
            const initialProducts = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf-8'));
            await redis.set('products', initialProducts);
            console.log("DB: Products seeded.");
        }
        const orderCheck = await redis.get('orders');
        if (!orderCheck) {
            const initialOrders = JSON.parse(fs.readFileSync(path.join(__dirname, 'orders.json'), 'utf-8'));
            await redis.set('orders', initialOrders);
            console.log("DB: Orders seeded.");
        }
    } catch (e) {
        console.error("DB Seed Error:", e);
    }
}
seedData();

// .env dosyasından API anahtarını manuel oku (Vercel'de process.env kullanılır)
function getApiKey() {
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    try {
        const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
        const match = envContent.match(/GEMINI_API_KEY=(.*)/);
        return match ? match[1].trim() : null;
    } catch (e) {
        return null;
    }
}

const server = http.createServer(async (req, res) => {
    // --- DATA ROUTES (UPSTASH REDIS) ---
    if (req.url.startsWith('/products.json')) {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                await redis.set('products', JSON.parse(body));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            });
            return;
        } else if (req.method === 'GET') {
            const data = await redis.get('products');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
            return;
        }
    }

    if (req.url.startsWith('/orders.json')) {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                await redis.set('orders', JSON.parse(body));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            });
            return;
        } else if (req.method === 'GET') {
            const data = await redis.get('orders');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
            return;
        }
    }

    // API Route'u simüle et
    if (req.url === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const { prompt, chatHistory, siteContext } = JSON.parse(body);
                const API_KEY = getApiKey();

                if (!API_KEY) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'API key not found in .env' }));
                }

                const modelName = "gemini-1.5-flash";
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

                const apiRes = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            ...chatHistory,
                            { role: "user", parts: [{ text: "TALİMATLAR:\n" + siteContext + "\n\nSORU: " + prompt }] }
                        ],
                        generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
                    })
                });

                const data = await apiRes.json();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
            } catch (error) {
                console.error("Local Server API Error:", error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'API fetch failure' }));
            }
        });
        return;
    }

    // Statik dosyaları sun (index.html, style.css vb.)
    let filePath = '.' + (req.url === '/' ? '/index.html' : req.url);
    const extname = path.extname(filePath);
    let contentType = 'text/html';

    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
        case '.jpg': contentType = 'image/jpg'; break;
        case '.jpeg': contentType = 'image/jpeg'; break;
    }

    const fullPath = path.join(__dirname, filePath);
    fs.readFile(fullPath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404);
                res.end('Dosya bulunamadı');
            } else {
                res.writeHead(500);
                res.end('Sunucu hatası: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n🚀 Chatbot Yerel Sunucu Başlatıldı!`);
    console.log(`---------------------------------`);
    console.log(`Adres: http://localhost:${PORT}`);
    console.log(`---------------------------------`);
    console.log(`Lütfen chatbot'u test etmek için yukarıdaki adresi tarayıcıda açın.`);
    console.log(`(Go Live eklentisi yerine bu yöntemi kullanmalısınız)\n`);
});
