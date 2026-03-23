/**
 * Moderra Fiyat Güncelleme Sistemi
 * fiyatlar.txt dosyasını okur ve sitedeki fiyatları günceller.
 */

async function fiyatlariGuncelle() {
    try {
        // Eğer index.html'deysek ve renderProducts fonksiyonu varsa onu çağır
        if (typeof renderProducts === 'function') {
            await renderProducts();
            return;
        }

        // Değilsek (diğer sayfalar için sadece fiyat güncellemesi yapabiliriz)
        const response = await fetch('products.json?t=' + new Date().getTime());
        if (!response.ok) throw new Error('Fiyat dosyası yüklenemedi.');

        const products = await response.json();
        const productCards = document.querySelectorAll('.product-card');

        products.forEach(product => {
            const { id, price } = product;
            productCards.forEach(card => {
                const addToCartBtn = card.querySelector('.add-to-cart');
                if (addToCartBtn && (addToCartBtn.dataset.id === id || addToCartBtn.dataset.id == id)) {
                    const currentPriceSpan = card.querySelector('.current-price');
                    if (currentPriceSpan) {
                        const formattedPrice = '₺' + parseFloat(price).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
                        currentPriceSpan.textContent = formattedPrice;
                        currentPriceSpan.dataset.price = price;
                    }
                    addToCartBtn.dataset.price = price;
                }
            });
        });
        console.log('Fiyatlar güncellendi.');
    } catch (error) {
        console.error('Güncelleme hatası:', error.message);
    }
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', () => {
    fiyatlariGuncelle();

    // "Gerçek zamanlı" etki için her 60 saniyede bir kontrol et
    setInterval(fiyatlariGuncelle, 60000);
});
