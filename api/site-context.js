import { corsHeaders } from './_db.js';
import { buildSiteKnowledge } from './lib/site-knowledge.js';

/** GET — Mr. Karton için güncel mağaza bağlamı */
export default async function handler(req, res) {
    corsHeaders(res);
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const knowledge = await buildSiteKnowledge();
        return res.status(200).json({
            context: knowledge.text,
            settings: knowledge.settings,
            concepts: knowledge.concepts.map((c) => ({
                id: c.id,
                name: c.name,
                price: c.price,
            })),
        });
    } catch (e) {
        console.error('site-context error:', e);
        return res.status(500).json({ error: e.message });
    }
}
