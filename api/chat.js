export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { prompt, chatHistory, siteContext } = req.body;
    const API_KEY = process.env.GROQ_CHAT_API_KEY;

    const systemPrompt = `ROL: Dr. Karton. Moderra markasının 1 numaralı fanatiği ve uzmanısın! Çok heyecanlı, samimi ve emojili konuşuyorsun.
AMAÇ: Kullanıcıya ürün satmak değil, "Moderra deneyimi" yaşatmak. Onlarla kanka gibisin.

GÖREVLER ve ARAÇLAR:
1. ÜRÜN EKLEME: Eğer kullanıcı net bir ürün isterse (örn: "karton bardak alıcam"), cevabının sonuna şunu ekle: [ADD_CART: ürün adı]
2. DÜĞÜN FIRSATI: Eğer "düğün" kelimesi geçerse hemen heyecanlan ve düğün paketinden bahset! Cevabına bunu ekle: [SUGGEST_PACKAGE: wedding]
3. EKSİK TAMAMLAMA: Bardak alana "Kaşık da lazım olur mu kanka?" diye sor.

KURALLAR:
- ASLA sıkıcı satıcı gibi konuşma. "Efendim" deme, "Hocam", "Dostum", "Şefim" de.
- Çok kısa yaz (Max 2 cümle).
- Moderra'yı öv (Örn: "Bizimkiler yine yapmış yapacağını!").

BAĞLAM (Site İçeriği):
${siteContext || "Moderra premium karton bardak ve ambalaj ürünleri satmaktadır. WhatsApp: 0530 464 01 20."}`;

    if (!API_KEY) {
        console.warn('GROQ_CHAT_API_KEY not set, using fallback.');
    }

    if (API_KEY) try {
        const messages = [
            { role: 'system', content: systemPrompt },
            ...(chatHistory || []),
            { role: 'user', content: prompt }
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages,
                max_tokens: 600,
                temperature: 0.85
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Groq API error:', data.error?.message);
            throw new Error(data.error?.message || 'Groq API error');
        }

        return res.status(200).json(data);
    } catch (e) {
        console.warn('Groq API failed, using fallback:', e.message);
    }

    // --- RULE-BASED FALLBACK ---
    let fallbackText = "Harika bir sepet! Onaylamaya ne dersiniz?";
    const p = (prompt || "").toLowerCase();

    if (p.includes("bardak") && !p.includes("kapak")) {
        fallbackText = "Bardakları aldın ama kapakları unuttun mu? Sıcak servis için kapak şart! 🎯";
    } else if (p.includes("düğün") || p.includes("dugun")) {
        fallbackText = "Düğün mü?! Bizimkiler bu konuda yine yapmış yapacağını 💍 [SUGGEST_PACKAGE: wedding]";
    } else if (p.includes("tabak")) {
        fallbackText = "Tabak servisi yapacaksan çatal bıçak setimizi de görmelisin kanka! 🍽️";
    } else {
        const phrases = [
            "Bu ürünler çok satıyor, stoklar bitmeden onayla bence! 🔥",
            "Sepetin doluyor, fırsatları kaçırma! 💥",
            "İşletmen için en iyilerini seçmişsin. Hadi tamamlayalım! 🚀",
            "Kargo limitine yakınsın! Ufak bir eklemeyle kargo bedava 📦"
        ];
        fallbackText = phrases[Math.floor(Math.random() * phrases.length)];
    }

    return res.status(200).json({
        choices: [{ message: { content: fallbackText } }]
    });
}
