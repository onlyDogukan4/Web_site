import { corsHeaders } from './_db.js';
import { groqChat, getGroqApiKey } from './lib/groq.js';
import { buildSiteKnowledge } from './lib/site-knowledge.js';

export default async function handler(req, res) {
    corsHeaders(res);
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { prompt } = req.body || {};

    const knowledge = await buildSiteKnowledge().catch(() => ({
        text: '',
        settings: { freeShipping: 1000 },
    }));

    const system = `Sen Moderra'nın VIP sepet asistanısın (Mr. Karton ekibi üslubu).
- "Siz" hitabı, kibar ve kısa (1-2 cümle).
- Sepeti tamamlamaya teşvik et; ücretsiz kargo limitini hatırlat.
Mağaza: ${knowledge.text}`;

    if (!getGroqApiKey()) {
        return res.status(200).json({
            choices: [{ message: { content: 'Harika seçimler! Sepetiniz neredeyse hazır. ✨' } }],
        });
    }

    try {
        const { content } = await groqChat({
            system,
            messages: [{ role: 'user', content: prompt || 'Sepet önerisi' }],
            maxTokens: 180,
            temperature: 0.65,
        });
        return res.status(200).json({ choices: [{ message: { content } }] });
    } catch (e) {
        console.warn('cart-chat groq:', e.message);
        const fallbacks = [
            'Mükemmel bir seçim. Ücretsiz kargoya çok az kaldı.',
            'Sepetiniz harika görünüyor; onaylamaya hazırsınız.',
        ];
        return res.status(200).json({
            choices: [{ message: { content: fallbacks[Math.floor(Math.random() * fallbacks.length)] } }],
        });
    }
}
