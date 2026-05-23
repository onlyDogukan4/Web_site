import { Admin } from './state.js';
import { renderAll } from './core.js';
import { closeModal } from './modals.js';

export async function createManualOrder() {
    const name = document.getElementById('o-customer').value.trim();
    const items = document.getElementById('o-items').value.trim();
    const status = document.getElementById('o-status').value;
    const delivery = document.getElementById('o-delivery').value;
    const totalPrice = parseFloat(document.getElementById('o-price').value) || 0;
    
    if(!name || !items) return alert("Müşteri ve ürün bilgisi girilmeli!");
    
    let isNew = false;
    let newCode = "";

    if (Admin.editOrderId) {
        // Düzenleme
        const idx = Admin.orders.findIndex((x) => x.orderId === Admin.editOrderId);
        if (idx > -1) {
            Admin.orders[idx].customerName = name;
            Admin.orders[idx].items = items;
            Admin.orders[idx].status = status;
            Admin.orders[idx].totalPrice = totalPrice || Admin.orders[idx].totalPrice;
            Admin.orders[idx].estimatedDelivery = delivery || "Bilgi Bekleniyor";
            Admin.orders[idx].lastUpdate = new Date().toISOString();
        }
        Admin.editOrderId = null;
    } else {
        // Yeni Sipariş
        const randomID = Math.floor(10000 + Math.random() * 90000);
        newCode = "MOD-" + randomID;
        isNew = true;
        
        const newOrder = { 
            orderId: newCode, 
            customerName: name, 
            items,
            totalPrice,
            status, 
            lastUpdate: new Date().toISOString(),
            estimatedDelivery: delivery || "Bilgi Bekleniyor"
        };
        Admin.orders.push(newOrder);
    }
    
    renderAll(); 
    closeModal('order-modal'); 
    
    // Veritabani kaydi bekle
    try {
        await syncData('orders'); 
        if(isNew) {
            alert(`✅ YENİ SİPARİŞ OLUŞTURULDU VE VERİTABANINA YAZILDI!\n\nTakip Kodu: ${newCode}\n\nMüşteriye bu kodu iletebilirsiniz.`);
        }
    } catch(e) {
        alert("Uyarı: Sipariş yerelde oluştu ama veritabanına yazılamadı! Lütfen internet bağlantınızı kontrol edin.");
    }

    // Formu temizle
    document.getElementById('o-customer').value = "";
    document.getElementById('o-items').value = "";
    document.getElementById('o-delivery').value = "";
    document.getElementById('o-price').value = "";
}

export async function deleteOrder(id) { 
    if(confirm("Bu siparişi listeden kaldırmak istiyor musunuz?")) { 
        Admin.orders = Admin.orders.filter((x) => x.orderId !== id); 
        renderAll(); 
        await syncData('orders'); 
    } 
}

export async function syncData(type = 'all') {
    const saveBtn = document.querySelector('.btn-primary[onclick*="syncData"]');
    if (saveBtn) saveBtn.innerHTML = `<span class="loading-spinner"></span> Aktarılıyor...`;

    try {
        const requests = [];
        // Eğer sadece sipariş eklendiyse boşuna ürünleri tekrar göndermeyelim (Limit aşımı önlemi)
        if (type === 'all' || type === 'products') {
            const size = JSON.stringify(Admin.products).length / (1024 * 1024);
            if (size > 4.2) {
                alert(`DİKKAT: Ürün verisi çok büyük (${size.toFixed(2)}MB).\nSinirlenmenize gerek yok, bu sorunu çözmek için eski ürünlerin fotoğraflarını silip yeni 'Otomatik Sıkıştırma' sistemimizle tekrar yüklemeniz yeterlidir.`);
                if (saveBtn) saveBtn.innerHTML = `<i class="fas fa-cloud-upload-alt"></i> TÜMÜNÜ KAYDET VE YAYINLA`;
                return;
            }
            requests.push(fetch('/api/products', {method:'POST', body:JSON.stringify(Admin.products), headers:{'Content-Type':'application/json'}}));
        }
        if (type === 'all' || type === 'orders') {
            requests.push(
                fetch('/api/orders', {
                    method: 'PUT',
                    body: JSON.stringify(Admin.orders),
                    headers: { 'Content-Type': 'application/json' },
                })
            );
        }
        if (type === 'all' || type === 'campaigns') { // Yeni
            requests.push(fetch('/api/campaigns', {method:'POST', body:JSON.stringify(Admin.campaigns), headers:{'Content-Type':'application/json'}}));
        }
        if (type === 'all' || type === 'settings') { 
            requests.push(fetch('/api/settings', {method:'POST', body:JSON.stringify(Admin.settings), headers:{'Content-Type':'application/json'}}));
        }
        if (type === 'all' || type === 'concepts') { 
            requests.push(fetch('/api/concepts', {method:'POST', body:JSON.stringify(Admin.concepts), headers:{'Content-Type':'application/json'}}));
        }
        if (type === 'all' || type === 'packages') { 
            requests.push(fetch('/api/packages', {method:'POST', body:JSON.stringify(Admin.packages), headers:{'Content-Type':'application/json'}}));
        }
        requests.push(fetch('/api/settings?type=last-update', {method:'POST', body:JSON.stringify({time:new Date().toLocaleString('tr-TR')}), headers:{'Content-Type':'application/json'}}));

        const results = await Promise.all(requests);
        
        if (results.every(r => r.ok)) {
            const t = document.getElementById('toast'); 
            t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), 3000);
        } else {
            const errorMsg = await results.find(r => !r.ok).text();
            throw new Error(errorMsg || "Sunucu hatası!");
        }
    } catch(e) { 
        console.error("Sync Error:", e);
        alert("Hata: " + e.message + "\n\nNot: Fotoğraflar çok büyükse (4MB üstü) bu hatayı alabilirsiniz."); 
    } finally {
        if (saveBtn) saveBtn.innerHTML = `<i class="fas fa-cloud-upload-alt"></i> TÜMÜNÜ KAYDET VE YAYINLA`;
    }
}
