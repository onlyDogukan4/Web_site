/**
 * Groq OpenAI-uyumlu API — ücretsiz katmanda yüksek limitli Llama modelleri
 * https://console.groq.com/docs/models
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** Metin sohbeti — kalite / hız */
export const GROQ_MODELS = {
    primary: process.env.GROQ_CHAT_MODEL || 'llama-3.3-70b-versatile',
    fast: process.env.GROQ_FAST_MODEL || 'llama-3.1-8b-instant',
};

export function getGroqApiKey() {
    return process.env.GROQ_CHAT_API_KEY || process.env.GROQ_API_KEY || '';
}

/**
 * @param {object} opts
 * @param {string} opts.system
 * @param {Array<{role:string,content:string}>} opts.messages
 * @param {number} [opts.maxTokens]
 * @param {number} [opts.temperature]
 * @param {string} [opts.model]
 */
export async function groqChat({
    system,
    messages = [],
    maxTokens = 800,
    temperature = 0.75,
    model = GROQ_MODELS.primary,
}) {
    const apiKey = getGroqApiKey();
    if (!apiKey) {
        throw new Error('GROQ_CHAT_API_KEY tanımlı değil');
    }

    const body = {
        model,
        messages: [{ role: 'system', content: system }, ...messages],
        max_tokens: maxTokens,
        temperature,
    };

    const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
        const msg = data?.error?.message || `Groq HTTP ${response.status}`;
        throw new Error(msg);
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Groq boş yanıt döndü');

    return { content, raw: data };
}
