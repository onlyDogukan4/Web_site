export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, chatHistory, siteContext } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    // Hem GEMINI_API_KEY hem de NEXT_PUBLIC_ sürümünü kontrol et
    const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!API_KEY) {
        console.error('Chat Error: GEMINI_API_KEY is missing in environment variables.');
        return res.status(500).json({
            error: 'AI Anahtarı Eksik!',
            details: 'Lütfen Vercel ayarlarından GEMINI_API_KEY eklediğinizden ve Redeploy yaptığınızdan emin olun.'
        });
    }

    const models = ["gemini-1.5-flash", "gemini-pro"];

    // Fallback logic
    for (const modelName of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
            const body = {
                contents: [
                    ...(chatHistory || []),
                    {
                        role: "user",
                        parts: [{ text: "TALİMATLAR VE BİLGİLER:\n" + (siteContext || "") + "\n\nSORU: " + prompt }]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 600,
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!data.error) {
                return res.status(200).json(data);
            }
            console.warn(`Model ${modelName} failed:`, data.error.message);
        } catch (e) {
            console.warn(`Model ${modelName} network error:`, e.message);
        }
    }

    // If all fail, return Safe Mock Response (Don't 500)
    console.error("All Gemini models failed. Returning mock.");
    return res.status(200).json({
        candidates: [{
            content: {
                parts: [{
                    text: "Bağlantım biraz yavaş ama seçimlerin harika! Yanına bir şeyler daha eklemeye ne dersin?"
                }]
            }
        }]
    });
}
