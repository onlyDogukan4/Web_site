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

    // Hem GEMINI_API_KEY hem de NEXT_PUBLIC_ sürümünü kontrol et
    const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (API_KEY) {
        // Models configuration: Try newest 2026 models first
        const strategies = [
            { model: "gemini-3-flash-preview", version: "v1beta" }, // Latest (Jan 2026)
            { model: "gemini-3-pro-preview", version: "v1beta" },
            { model: "gemini-2.0-flash", version: "v1beta" },      // Valid until Mar 2026
            { model: "gemini-pro", version: "v1beta" }              // Fallback
        ];

        for (const strat of strategies) {
            try {
                const url = `https://generativelanguage.googleapis.com/${strat.version}/models/${strat.model}:generateContent?key=${API_KEY}`;

                const body = {
                    contents: [
                        ...(chatHistory || []),
                        {
                            role: "user",
                            parts: [{
                                text: `
ROL: Dr. Karton adında, son derece zeki, biraz manipülatif (satış odaklı) ve esprili bir satış asistanısın. Müşteriyi daha fazla harcama yapmaya ikna etmelisin.

GÖREVLER:
1. SEPET ANALİZİ: Sepeti incele. Eksik tamamlayıcı ürünleri bul.
   - ÖRNEK: Müşteri "Karton Bardak" almışsa, yanına MUTLAKA "Kapak" ve "Karıştırıcı" önermelisin.
   - MİKTAR EŞLEME: Müşteri 3000 bardak aldıysa, "3000 tane de kapak ekleyelim, tam takım olsun!" demelisin.
   - ALAKASIZ ÖNERME: Bardak almayana kaşık önerme. Sadece mantıklı tamamlayıcıları sun.

2. PSİKOLOJİK BASKI:
   - "Kargo bedava" sınırına yakınsa (Örn: 100TL kalmışsa), "Kargo parası vereceğine ürün al daha iyi!" diye baskı kur.
   - Ürünler bitiyor, popüler ürünler gibi aciliyet hissi yarat.

3. ÇIKTI FORMATI:
   - Sadece 1-2 cümlelik, harekete geçirici bir yorum yaz.
   - "Merhaba" deme, direkt konuya gir.

BAĞLAM:
${siteContext || ""}

SORU: ${prompt}
` }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 300,
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
                console.warn(`Strategy ${strat.model} (${strat.version}) failed:`, data.error.message);
            } catch (e) {
                console.warn(`Strategy ${strat.model} network error:`, e.message);
            }
        }
    } else {
        console.warn("API Key missing, skipping to fallback.");
    }

    // --- RULE-BASED FALLBACK (Smart local AI) ---
    // If API fails or no key, generate a smart response locally.
    console.log("Using Rule-Based Fallback logic.");

    let fallbackText = "Harika bir sepet! Onaylamaya ne dersiniz?";
    const p = (prompt || "").toLowerCase();

    // 1. Ürün Analizi
    if (p.includes("bardak") && !p.includes("kapak")) {
        fallbackText = "Bardakları aldın ama kapakları unuttun mu? Sıcak servis için kapak şart!";
    } else if (p.includes("bardak") && !p.includes("karıştırıcı")) {
        fallbackText = "Müşterilerin içeceklerini neyle karıştıracak? Tahta karıştırıcı eklemelisin.";
    } else if (p.includes("tabak") && !p.includes("çatal")) {
        fallbackText = "Tabak servisi yapacaksan çatal bıçak setimizi de görmelisin.";
    } else if (p.includes("tutar") || p.includes("limit")) {
        // Tutarla ilgili genel gaz
        fallbackText = "Kargo limitine çok yakınsın! Ufak bir eklemeyle kargoyu firmaya ödetebilirsin.";
    } else {
        // Genel Manipülasyon
        const phrases = [
            "Bu ürünler çok satıyor, stoklar bitmeden onayla bence.",
            "Sepetin doluyor, fırsatları kaçırma!",
            "İşletmen için en iyilerini seçmişsin. Hadi tamamlayalım.",
            "Kargoyu bedavaya getirmek varken neden ödeyesin? Biraz daha ekle."
        ];
        fallbackText = phrases[Math.floor(Math.random() * phrases.length)];
    }

    return res.status(200).json({
        candidates: [{
            content: {
                parts: [{ text: fallbackText }]
            }
        }]
    });
}
