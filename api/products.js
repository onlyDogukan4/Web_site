import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Güncel Dil Destekli Başlangıç Verileri
const INITIAL_PRODUCTS = [
    {
        "id": "1",
        "name_tr": "4 oz Karton Bardak (1000 adet)",
        "name_en": "4 oz Paper Cup (1000 pcs)",
        "price": 850,
        "image": "images/bardak.png",
        "description_tr": "Espresso ve tadım için ideal.",
        "description_en": "Ideal for espresso and tasting.",
        "rating": "5.0"
    },
    {
        "id": "2",
        "name_tr": "7 oz Karton Bardak (1000 adet)",
        "name_en": "7 oz Paper Cup (1000 pcs)",
        "price": 1200,
        "image": "images/bardak.png",
        "description_tr": "Çay ve kahve için en çok tercih edilen boy.",
        "description_en": "Most preferred size for tea and coffee.",
        "rating": "4.9"
    },
    {
        "id": "3",
        "name_tr": "8.5 oz Karton Bardak (1000 adet)",
        "name_en": "8.5 oz Paper Cup (1000 pcs)",
        "price": 1453,
        "image": "images/bardak.png",
        "description_tr": "Standard sıcak içecek bardağı.",
        "description_en": "Standard hot drink cup.",
        "rating": "5.0"
    },
    {
        "id": "4",
        "name_tr": "12 oz Karton Bardak (1000 adet)",
        "name_en": "12 oz Paper Cup (1000 pcs)",
        "price": 1850,
        "image": "images/bardak.png",
        "description_tr": "Büyük boy içecekler için ideal.",
        "description_en": "Ideal for large size drinks.",
        "rating": "4.8"
    },
    {
        "id": "5",
        "name_tr": "Ahşap Karıştırıcı (1000'li Paket)",
        "name_en": "Wooden Stirrer (1000 pcs)",
        "price": 189.9,
        "image": "images/karistirici.jpeg",
        "description_tr": "Doğal ahşaptan üretilmiş karıştırıcı.",
        "description_en": "Stirrer made from natural wood.",
        "rating": "4.7"
    },
    {
        "id": "6",
        "name_tr": "Kare Peçete (2000 Adet)",
        "name_en": "Square Napkin (2000 pcs)",
        "price": 240,
        "image": "images/pecete.png",
        "description_tr": "Yumuşak dokulu kare peçeteler.",
        "description_en": "Soft textured square napkins.",
        "rating": "4.9"
    },
    {
        "id": "7",
        "name_tr": "Sıcak İçecek Kapağı (1000 Adet)",
        "name_en": "Hot Drink Lid (1000 pcs)",
        "price": 650,
        "image": "images/kapak.png",
        "description_tr": "Sızdırmaz ve ısıya dayanıklı kapaklar.",
        "description_en": "Leak-proof and heat resistant lids.",
        "rating": "4.8"
    },
    {
        "id": "8",
        "name_tr": "Islak Mendil (1000 Adet)",
        "name_en": "Wet Wipe (1000 pcs)",
        "price": 320,
        "image": "images/mendil.png",
        "description_tr": "Hijyenik ve hoş kokulu ıslak mendil.",
        "description_en": "Hygienic and pleasantly scented wet wipe.",
        "rating": "5.0"
    },
    {
        "id": "9",
        "name_tr": "Karton Bardak Taşıyıcı (500 Adet)",
        "name_en": "Paper Cup Carrier (500 pcs)",
        "price": 450,
        "image": "images/bardak.png",
        "description_tr": "2'li güvenli taşıma aparatı.",
        "description_en": "Secure 2-pack carrier.",
        "rating": "4.6"
    }
];

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'POST') {
            const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            await redis.set('products', data);
            return res.status(200).json({ success: true });
        } else {
            let data = await redis.get('products');
            // Eğer veritabanı boşsa veya eski formatta ise INITIAL_PRODUCTS ile başlat
            if (!data || !Array.isArray(data) || (data.length > 0 && !data[0].name_tr)) {
                await redis.set('products', INITIAL_PRODUCTS);
                data = INITIAL_PRODUCTS;
            }
            return res.status(200).json(data);
        }
    } catch (error) {
        console.error("Redis Products Error:", error);
        // ÖNEMLİ: Veritabanı (Redis) bağlantısı kopsa bile ürün kataloğunun silinmemesi için 
        // ana sayfaya başlangıç verilerini (INITIAL_PRODUCTS) geri döndürüyoruz.
        return res.status(200).json(INITIAL_PRODUCTS);
    }
}
