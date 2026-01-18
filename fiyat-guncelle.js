/**
 * Moderra Fiyat Güncelleme Sistemi
 * fiyatlar.txt dosyasını okur ve sitedeki fiyatları günceller.
 */

async function fiyatlariGuncelle() {
    try {
        // fiyatlar.txt dosyasını oku
        // Not: Yerel dosyalar (file://) üzerinden çalışırken tarayıcı güvenliği nedeniyle fetch engellenebilir.
        // Bu durumda bir yerel sunucu (Live Server vb.) üzerinden çalıştırılması önerilir.
        const response = await fetch('fiyatlar.txt?t=' + new Date().getTime()); // Önbelleği önlemek için t parametresi
        if (!response.ok) throw new Error('Fiyat dosyası yüklenemedi.');

        const text = await response.text();
        const lines = text.split('\n');

        lines.forEach(line => {
            if (!line.trim()) return;

            // Format: ID | İsim | Fiyat
            const parts = line.split('|');
            if (parts.length < 3) return;

            const id = parts[0].trim();
            const name = parts[1].trim();
            const price = parts[2].trim();

            // Sayfadaki tüm ürün kartlarını bul
            const productCards = document.querySelectorAll('.product-card');

            productCards.forEach(card => {
                const addToCartBtn = card.querySelector('.add-to-cart');
                if (addToCartBtn && addToCartBtn.dataset.id === id) {
                    // Fiyatı güncelle
                    const currentPriceSpan = card.querySelector('.current-price');
                    if (currentPriceSpan) {
                        // Formatlanmış fiyat (örn: 1100.00 -> ₺1.100,00)
                        const formattedPrice = '₺' + parseFloat(price).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
                        currentPriceSpan.textContent = formattedPrice;
                        currentPriceSpan.dataset.price = price;
                    }

                    // Sepete ekle düğmesindeki datayı da güncelle
                    addToCartBtn.dataset.price = price;
                    // Eğer isim de değişmişse (opsiyonel)
                    // addToCartBtn.dataset.name = name;
                }
            });
        });

        console.log('Fiyatlar başarıyla güncellendi.');
    } catch (error) {
        console.error('Fiyat güncelleme hatası:', error.message);
    }
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', () => {
    fiyatlariGuncelle();

    // "Gerçek zamanlı" etki için her 10 saniyede bir kontrol et
    setInterval(fiyatlariGuncelle, 10000);
});
