import { Admin } from './state.js';

export async function saveSettings() {
    try {
        const minOrderInput = document.getElementById('s-min-order');
        const freeShipInput = document.getElementById('s-free-shipping');
        
        if (!minOrderInput || !freeShipInput) {
            alert("Hata: Ayar kutucukları bulunamadı! HTML yapısı bozuk.");
            return;
        }

        const minOrderVal = parseInt(minOrderInput.value);
        const freeShipVal = parseInt(freeShipInput.value);
        
        if (isNaN(minOrderVal) || isNaN(freeShipVal)) {
            alert("Lütfen geçerli sayısal değerler girin!");
            return;
        }
        
        // Global nesneyi güncelle
        Admin.settings = {
            minOrder: minOrderVal,
            freeShipping: freeShipVal
        };
        
        // Manuel Sync Çağrısı (syncData fonksiyonuna güvenmeden doğrudan fetch atıyorum)
        const res = await fetch('/api/settings', {
            method: 'POST',
            body: JSON.stringify(Admin.settings),
            headers: {'Content-Type': 'application/json'}
        });
        
        if (res.ok) {
            // last-update güncelle → site anlık yenilensin
            await fetch('/api/settings?type=last-update', {
                method: 'POST',
                body: JSON.stringify({ time: new Date().toLocaleString('tr-TR') }),
                headers: { 'Content-Type': 'application/json' }
            });
            const t = document.getElementById('toast');
            if (t) { t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }
            else alert(`✅ Ayarlar kaydedildi.\nMin Sepet: ${minOrderVal} TL | Kargo Limiti: ${freeShipVal} TL`);
        } else {
            alert("❌ SUNUCU HATASI: Kaydedilemedi. Lütfen internet bağlantısını kontrol edin.");
        }
        
        // Ekranı güncellemek için render çağırılabilir ama gerek yok, inputlar zaten dolu.
    } catch (e) {
        alert("KRİTİK HATA: " + e.message);
        console.error(e);
    }
}
