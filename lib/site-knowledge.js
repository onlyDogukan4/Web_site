import { readData } from '../api/_db.js';

const DEFAULT_SETTINGS = { minOrder: 500, freeShipping: 1000 };

/** Mağaza kataloğunu Mr. Karton için metin bağlamına çevirir */
export async function buildSiteKnowledge() {
    const [products, packages, concepts, settings] = await Promise.all([
        readData('products', []),
        readData('packages', []),
        readData('concepts', []),
        readData('settings', DEFAULT_SETTINGS),
    ]);

    const publishedConcepts = (concepts || []).filter((c) => c.published !== false);
    const activeProducts = (products || []).filter((p) => p.status !== 'oos');

    let ctx = `MODERRA MAĞAZA VERİTABANI (güncel):\n`;
    ctx += `- Minimum sipariş: ₺${settings.minOrder ?? 500}\n`;
    ctx += `- Ücretsiz kargo limiti: ₺${settings.freeShipping ?? 1000}\n`;
    ctx += `- WhatsApp: 0530 464 01 20\n`;
    ctx += `- Ödeme: PayTR güvenli kart + WhatsApp sipariş\n`;
    ctx += `- Özel logolu / VIP konsept bardak: konsept-bardaklar.html (boyut, kapak, logo PDF/PNG)\n\n`;

    if (publishedConcepts.length) {
        ctx += `KONSEPT / ÖZEL TASARIM BARDAKLAR:\n`;
        for (const c of publishedConcepts) {
            ctx += `• id="${c.id}" | ${c.name} | taban fiyat ₺${c.price ?? 15}\n`;
            ctx += `  ${(c.desc_tr || '').substring(0, 120)}\n`;
            const vars = c.variations || {};
            const priceSamples = ['4oz-nolid', '8oz-nolid', '12oz-lid']
                .filter((k) => vars[k])
                .map((k) => `${k}=₺${vars[k].price}`)
                .join(', ');
            if (priceSamples) ctx += `  Varyasyon fiyatları: ${priceSamples}\n`;
        }
        ctx += `\n`;
    }

    if (activeProducts.length) {
        ctx += `STANDART ÜRÜNLER (sepete [ADD_CART: tam ürün adı] ile eklenebilir):\n`;
        for (const p of activeProducts.slice(0, 40)) {
            ctx += `• id=${p.id} | ${p.name_tr} | ₺${p.price}\n`;
        }
        if (activeProducts.length > 40) ctx += `… ve ${activeProducts.length - 40} ürün daha\n`;
        ctx += `\n`;
    }

    if (packages?.length) {
        ctx += `PAKETLER:\n`;
        for (const pkg of packages) {
            ctx += `• id=${pkg.id} | ${pkg.name} | indirim %${pkg.discount || 0}\n`;
        }
        ctx += `\n`;
    }

    ctx += `SAYFALAR: index.html (ürünler), konsept-bardaklar.html (özel baskı), takip.html (sipariş), sss.html, about.html\n`;

    return {
        text: ctx,
        products: activeProducts,
        packages: packages || [],
        concepts: publishedConcepts,
        settings,
    };
}

/** Konsept + varyasyondan fiyat */
export function resolveConceptPrice(concept, sizeOz, lid) {
    if (!concept) return 15;
    const key = `${sizeOz}-${lid}`;
    const v = concept.variations?.[key];
    if (v?.price > 0) return parseFloat(v.price);
    if (concept.price > 0) return parseFloat(concept.price);
    return 15;
}
