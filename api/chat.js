export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, chatHistory, siteContext } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!API_KEY) {
        console.error('API Key Missing');
        return res.status(500).json({ error: 'API key not configured on Vercel. Please add GEMINI_API_KEY to Environment Variables.' });
    }

    const modelName = "gemini-1.5-flash"; // More stable for overall use, you can change back to gemma-3-4b-it if preferred
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

    const body = {
        contents: [
            ...chatHistory,
            {
                role: "user",
                parts: [{ text: "TALİMATLAR VE BİLGİLER:\n" + siteContext + "\n\nSORU: " + prompt }]
            }
        ],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
            topP: 0.95
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
            console.error("Gemini API Error:", data.error);
            return res.status(response.status).json({ error: data.error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Fetch error:", error);
        res.status(500).json({ error: 'Failed to connect to Gemini API' });
    }
}
