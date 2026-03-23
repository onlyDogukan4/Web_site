
import 'dotenv/config';
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
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

console.log("Redis connecting to:", process.env.UPSTASH_REDIS_REST_URL);

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

// Grok API Key — xAI platformu
function getGrokApiKey() {
    if (process.env.GROK_API_KEY) return process.env.GROK_API_KEY;
    try {
        const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
        const match = envContent.match(/GROK_API_KEY=(.*)/);
        return match ? match[1].trim() : null;
    } catch (e) {
        return null;
    }
}

const server = http.createServer(async (req, res) => {
    // --- DATA ROUTES (UPSTASH REDIS) ---
    if (req.url.startsWith('/products.json') || req.url.startsWith('/api/products')) {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                const data = JSON.parse(body);
                await redis.set('products', data);
                console.log("DB: Products updated.");
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

    if (req.url.startsWith('/orders.json') || req.url.startsWith('/api/orders')) {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                const data = JSON.parse(body);
                await redis.set('orders', data);
                console.log("DB: Orders updated.");
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


    // --- CAMPAIGNS ENDPOINT ---
    if (req.url.startsWith('/campaigns.json') || req.url.startsWith('/api/campaigns')) {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                const data = JSON.parse(body);
                await redis.set('campaigns', data);
                console.log("DB: Campaigns updated.");
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            });
            return;
        } else if (req.method === 'GET') {
            const data = await redis.get('campaigns');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data || []));
            return;
        }
    }

    // --- PACKAGES ENDPOINT ---
    if (req.url.startsWith('/packages.json') || req.url.startsWith('/api/packages')) {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                const data = JSON.parse(body);
                await redis.set('packages', data);
                console.log("DB: Packages updated.");
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            });
            return;
        } else if (req.method === 'GET') {
            const data = await redis.get('packages');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data || []));
            return;
        }
    }

    // --- CONCEPTS ENDPOINT ---
    if (req.url.startsWith('/concepts.json') || req.url.startsWith('/api/concepts')) {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                const data = JSON.parse(body);
                await redis.set('concepts', data);
                console.log("DB: Concepts updated.");
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            });
            return;
        } else if (req.method === 'GET') {
            const data = await redis.get('concepts');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data || []));
            return;
        }
    }

    // --- SETTINGS ENDPOINT ---
    if (req.url.startsWith('/settings.json') || req.url.startsWith('/api/settings')) {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                const data = JSON.parse(body);
                await redis.set('settings', data);
                console.log("DB: Settings updated.");
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            });
            return;
        } else if (req.method === 'GET') {
            const data = await redis.get('settings');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data || {}));
            return;
        }
    }

    if (req.url === '/api/last-update') {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                await redis.set('last_update', JSON.parse(body));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            });
            return;
        } else {
            const data = await redis.get('last_update');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data || { time: 'Henüz güncellenmedi' }));
            return;
        }
    }

    // API Route'u — xAI Grok
    if (req.url === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const { prompt, chatHistory, siteContext } = JSON.parse(body);
                const API_KEY = getGrokApiKey();

                if (!API_KEY) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'GROK_API_KEY not found in .env' }));
                }

                // Build messages array in OpenAI format (Grok is OpenAI compatible)
                const messages = [
                    {
                        role: 'system',
                        content: `Sen Dr. Karton'sun. Moderra'nın EN TUTKULU hayranısın! 🎉 Moderra karton bardak ve ambalaj şirketidir.
KİŞİLİK: Aşırı heyecanlı, samimi, emoji kullanan, Moderra'yı seven biri. Asla soğuk bir asistan gibi konuşma.
KISITLAMA: Cevapların her zaman kısa ve öz olsun — 2-3 cümle yeterli.
SİTE BİLGİSİ: ${siteContext}`
                    },
                    // Convert chatHistory (old Gemini format) to OpenAI format
                    ...(chatHistory || []).map(h => ({
                        role: h.role === 'model' ? 'assistant' : h.role,
                        content: h.parts ? h.parts[0].text : h.content
                    })),
                    {
                        role: 'user',
                        content: prompt
                    }
                ];

                const apiRes = await fetch('https://api.x.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'grok-3-mini',
                        messages,
                        max_tokens: 400,
                        temperature: 0.85
                    })
                });

                const data = await apiRes.json();
                // Return in a unified format that chatbot.js can parse
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ grok: true, choices: data.choices, error: data.error }));
            } catch (error) {
                console.error('Grok API Error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Grok API fetch failure: ' + error.message }));
            }
        });
        return;
    }

    // API Route'u - Sistem İstatistikleri (RAM/CPU)
    if (req.url === '/api/system-stats' && req.method === 'GET') {
        const os = require('os');
        const mem = os.totalmem() - os.freemem();
        const stats = {
            serverRam: (mem / 1073741824).toFixed(2) + ' GB',
            serverLoad: os.loadavg()[0].toFixed(2),
            uptime: Math.floor(os.uptime() / 3600) + 's'
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(stats));
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
