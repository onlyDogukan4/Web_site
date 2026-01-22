import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Senin orijinal ve eksiksiz ürün kataloğun
const INITIAL_PRODUCTS = [
    {
        "id": "1",
        "name_tr": "8.5 oz Karton Bardak (1000 adet)",
        "name_en": "8.5 oz Paper Cup (1000 pcs)",
        "price": 1453,
        "image": "images/bardak.png",
        "description_tr": "En yüksek kalite standartlarında üretilmiş sızdırmaz karton bardak.",
        "description_en": "Leak-proof paper cup produced to the highest quality standards.",
        "rating": "5.0"
    },
    {
        "id": "2",
        "name_tr": "7 oz Karton Bardak (1000 adet)",
        "name_en": "7 oz Paper Cup (1000 pcs)",
        "price": 1250,
        "image": "images/bardak.png",
        "description_tr": "Çay ve kahve servisi için en ideal boy.",
        "description_en": "The most ideal size for tea and coffee service.",
        "rating": "4.9"
    },
    {
        "id": "3",
        "name_tr": "Ahşap Karıştırıcı (1000'li Paket)",
        "name_en": "Wooden Stirrer (1000 pcs)",
        "price": 189.9,
        "image": "images/karistirici.jpeg",
        "description_tr": "Doğal ahşaptan üretilmiş, hijyenik karıştırıcılar.",
        "description_en": "Hygienic stirrers made from natural wood.",
        "rating": "4.7"
    },
    {
        "id": "4",
        "name_tr": "Kare Peçete (2000 Adet)",
        "name_en": "Square Napkin (2000 pcs)",
        "price": 240,
        "image": "images/pecete.png",
        "description_tr": "Yumuşak dokulu ve emici kare peçeteler.",
        "description_en": "Soft textured and absorbent square napkins.",
        "rating": "4.9"
    },
    {
        "id": "5",
        "name_tr": "Plastik Kaşık (1000 Adet)",
        "name_en": "Plastic Spoon (1000 pcs)",
        "price": 350,
        "image": "images/kasık.jpeg",
        "description_tr": "Dayanıklı ve şık tasarımlı servis kaşığı.",
        "description_en": "Durable and stylish design serving spoon.",
        "rating": "4.8"
    },
    {
        "id": "6",
        "name_tr": "Sıcak İçecek Kapağı (1000 Adet)",
        "name_en": "Hot Drink Lid (1000 pcs)",
        "price": 149.9,
        "image": "images/kapak.png",
        "description_tr": "Bardaklara tam uyumlu, sızdırmaz kapaklar.",
        "description_en": "Leak-proof lids perfectly compatible with cups.",
        "rating": "4.8"
    },
    {
        "id": "7",
        "name_tr": "Plastik Çatal (1000 Adet)",
        "name_en": "Plastic Fork (1000 pcs)",
        "price": 350,
        "image": "images/catal.jpeg",
        "description_tr": "Kırılmaya dayanıklı kaliteli plastik çatal.",
        "description_en": "High quality break-resistant plastic fork.",
        "rating": "4.7"
    },
    {
        "id": "11",
        "name_tr": "Tekli Paket Islak Mendil (1000 Adet)",
        "name_en": "Single Pack Wet Wipe (1000 pcs)",
        "price": 279.9,
        "image": "images/mendil.png",
        "description_tr": "Ferahlatan kokusuyla hijyenik ıslak mendil.",
        "description_en": "Hygienic wet wipe with a refreshing scent.",
        "rating": "5.0"
    },
    {
        "id": "12",
        "name_tr": "Promosyon Çakmak",
        "name_en": "Promotional Lighter",
        "price": 45,
        "image": "images/çakmak.png",
        "description_tr": "Moderra logolu kaliteli baskılı çakmak.",
        "description_en": "Quality printed lighter with Moderra logo.",
        "rating": "4.6"
    }
];

export default async function handler(req, res) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        return res.status(500).json({ error: "UPSTASH_REDIS_REST_URL veya TOKEN eksik! Vercel'den Environment Variables ayarlarını kontrol edin." });
    }

    const redis = new Redis({ url, token });

    try {
        if (req.method === 'POST') {
            const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            if (!Array.isArray(data)) throw new Error("Gönderilen veri bir liste (array) olmalı.");
            await redis.set('products', data);
            return res.status(200).json({ success: true });
        } else {
            let data = await redis.get('products');
            if (data === null || data === undefined) {
                return res.status(200).json(INITIAL_PRODUCTS);
            }
            return res.status(200).json(data);
        }
    } catch (error) {
        console.error("Redis Products Error:", error);
        return res.status(500).json({
            error: "Veritabanı bağlantı hatası!",
            details: error.message,
            tip: "Upstash şifrelerinizi ve URL'nizi tekrar kontrol edin."
        });
    }
}
