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

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
        console.error('API Key Missing from Vercel Environment Variables');
        return res.status(500).json({ error: 'GEMINI_API_KEY eksik. Vercel dashboarddan ekleyiniz.' });
    }

    const modelName = "gemini-1.5-flash";
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

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        if (data.error) {
            return res.status(500).json({ error: data.error.message });
        }
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Gemini API bağlantı hatası.' });
    }
}
