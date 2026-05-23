import { corsHeaders } from '../lib/db.js';
import cartChat from '../lib/routes/cart-chat.js';
import { groqChat, getGroqApiKey } from '../lib/groq.js';
import { buildSiteKnowledge, resolveConceptPrice } from '../lib/site-knowledge.js';
import { parseAgentCommands } from '../lib/agent-commands.js';
import { buildMrKartonSystemPrompt } from '../lib/mr-karton-prompt.js';

function mergeAgentSession(prev, update) {
    if (!update?.type) return prev;
    if (!prev || prev.type !== update.type) return update;
    return {
        type: update.type,
        data: { ...(prev.data || {}), ...(update.data || {}) },
    };
}

function enrichConceptCartPayload(data, concepts) {
    const concept = concepts.find((c) => c.id === data.conceptId);
    const size = data.size || '8oz';
    const lid = data.lid || 'nolid';
    const price = data.price || resolveConceptPrice(concept, size, lid);
    const name =
        data.conceptName ||
        (concept ? `${concept.name} (${size}${lid === 'lid' ? ', kapaklı' : ''})` : `Özel Konsept (${size})`);

    return {
        conceptId: data.conceptId,
        conceptName: name,
        size,
        lid,
        quantity: Math.max(1, parseInt(data.quantity, 10) || 1),
        note: data.note || '',
        price,
        image: data.image || concept?.base_image || 'images/bardak.png',
    };
}

async function handleSiteContext(req, res) {
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

export default async function handler(req, res) {
    corsHeaders(res);
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.query?.mode === 'cart') {
        return cartChat(req, res);
    }
    if (req.method === 'GET') {
        return handleSiteContext(req, res);
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { prompt, chatHistory = [], agentSession: clientAgent } = req.body || {};

    if (!prompt?.trim()) {
        return res.status(400).json({ error: 'prompt gerekli' });
    }

    let knowledge;
    try {
        knowledge = await buildSiteKnowledge();
    } catch (e) {
        console.error('buildSiteKnowledge:', e);
        knowledge = {
            text: 'Moderra premium karton bardak satar.',
            concepts: [],
            products: [],
            settings: { minOrder: 500, freeShipping: 1000 },
        };
    }

    const system = buildMrKartonSystemPrompt({
        siteKnowledgeText: knowledge.text,
        agentSession: clientAgent,
        concepts: knowledge.concepts,
    });

    const messages = [
        ...(chatHistory || []).slice(-20).map((h) => ({
            role: h.role === 'assistant' ? 'assistant' : 'user',
            content: h.content || h.parts?.[0]?.text || '',
        })),
        { role: 'user', content: prompt.trim() },
    ];

    if (!getGroqApiKey()) {
        return res.status(200).json({
            choices: [
                {
                    message: {
                        content:
                            'Şu an AI servisim bağlantı kuramıyor. Lütfen GROQ_CHAT_API_KEY ayarlayın veya WhatsApp: 0530 464 01 20 ✨',
                    },
                },
            ],
            agentSession: clientAgent,
            actions: [],
        });
    }

    try {
        const { content } = await groqChat({
            system,
            messages,
            maxTokens: 900,
            temperature: 0.72,
        });

        const { actions, agentStateUpdate, cleanText } = parseAgentCommands(content);

        let agentSession = mergeAgentSession(clientAgent, agentStateUpdate);

        const finalActions = actions.map((a) => {
            if (a.type === 'add_concept_cart') {
                return {
                    type: 'add_concept_cart',
                    data: enrichConceptCartPayload(a.data, knowledge.concepts),
                };
            }
            return a;
        });

        if (
            agentSession?.type === 'custom_cup' &&
            finalActions.some((a) => a.type === 'add_concept_cart')
        ) {
            agentSession = null;
        }

        return res.status(200).json({
            choices: [{ message: { content: cleanText } }],
            agentSession,
            actions: finalActions,
        });
    } catch (e) {
        console.error('Groq chat error:', e.message);

        const fallback =
            'Kısa bir bağlantı sorunu yaşadım. Yine de yardımcı olabilirim — özel logolu bardak için konsept sayfamıza bakabilir veya WhatsApp hattımıza yazabilirsiniz. ✨';

        return res.status(200).json({
            choices: [{ message: { content: fallback } }],
            agentSession: clientAgent,
            actions: [],
            error: e.message,
        });
    }
}
