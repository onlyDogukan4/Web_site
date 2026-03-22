export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { prompt, siteContext } = req.body;
    const API_KEY = process.env.GROQ_CART_API_KEY;

    const systemPrompt = `Sen Moderra'nın VIP sepet asistanısın. Müşteriyi nazikçe yönlendirirsin.
KURALLAR:
- "Efendim", "Değerli Müşterimiz" gibi kibar hitaplar kullan.
- Mağazaya çok hakim olduğunu hissettir.
- Asla "Merhaba" deme. Konuya direkt gir.
- Maksimum 1-2 cümle.
- Ürünleri tamamlayıcı öneriler yap.
${siteContext ? `\nMağaza Bilgisi: ${siteContext}` : ''}`;

    if (API_KEY) try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 200,
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Groq API error');
        }

        return res.status(200).json(data);
    } catch (e) {
        console.warn('Cart Groq API failed, using fallback:', e.message);
    }

    // Fallback
    const fallbacks = [
        "Mükemmel bir seçim, Efendim! Ücretsiz kargoya çok az kaldı.",
        "Harika bir kombinasyon! Yanına bir de kapak seti eklemenizi öneririm.",
        "Çok isabetli tercihler, Efendim. Sepetin tamamlanmaya hazır görünüyor.",
        "Bu ürünler birbirleriyle harika uyum sağlıyor. Tebrikler!"
    ];

    return res.status(200).json({
        choices: [{ message: { content: fallbacks[Math.floor(Math.random() * fallbacks.length)] } }]
    });
}
