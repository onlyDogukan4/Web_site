async function trackOrder() {
    const id = document.getElementById('order-id-input').value.trim().toUpperCase();
    if (!id) return;

    document.getElementById('result-container').style.display = 'none';
    document.getElementById('not-found').style.display = 'none';

    try {
        const response = await fetch('/api/orders?t=' + Date.now());
        if (!response.ok) throw new Error("Veri çekilemedi (500)");
        
        const orders = await response.json();
        
        if (!Array.isArray(orders)) {
            console.error("API hatası veya boş veri:", orders);
            document.getElementById('not-found').style.display = 'block';
            return;
        }

        const order = orders.find(o => o.orderId.trim().toUpperCase() === id);

        if (order) {
            showOrder(order);
        } else {
            document.getElementById('not-found').style.display = 'block';
        }
    } catch (e) {
        console.error("Tracking error", e);
        alert("Sipariş verileri şu an alınamıyor. Sunucu hatası (500).");
    }
}

function showOrder(order) {
    const container = document.getElementById('result-container');
    container.style.display = 'block';

    document.getElementById('display-order-id').innerHTML = `
        <span style="color:var(--text-muted); font-size:14px; display:block; margin-bottom:5px;">Sipariş Sorgulama Sonucu</span>
        #${order.orderId} nolu ${order.customerName} siparişi:
    `;
    document.getElementById('display-customer').textContent = order.customerName;
    document.getElementById('display-delivery').textContent = order.estimatedDelivery || "Bilgi Bekleniyor";
    document.getElementById('display-items').textContent = order.items;
    const priceEl = document.getElementById('display-price');
    if (order.totalPrice && parseFloat(order.totalPrice) > 0) {
        priceEl.textContent = '₺' + parseFloat(order.totalPrice).toLocaleString('tr-TR', {minimumFractionDigits: 2});
    } else {
        priceEl.textContent = 'Bilgi Bekleniyor';
    }
    
    const statusMap = {
        'onay-bekliyor': 'SİPARİŞ ONAY BEKLİYOR',
        'alindi': 'SİPARİŞ ALINDI',
        'hazirlaniyor': 'HAZIRLANIYOR',
        'kargoda': 'KARGODA',
        'teslim': 'TESLİM EDİLDİ',
        'odeme-bekleniyor': 'ÖDEME BEKLENİYOR',
        'odeme-reddedildi': 'ÖDEME REDDEDİLDİ'
    };
    document.getElementById('status-text').textContent = statusMap[order.status] || order.status.toUpperCase();

    const steps = {
        'onay-bekliyor': 1,
        'alindi': 1,
        'hazirlaniyor': 2,
        'kargoda': 3,
        'teslim': 4
    };
    const currentStep = steps[order.status] || 1;

    for (let i = 1; i <= 4; i++) {
        const el = document.getElementById('step-' + i);
        el.classList.remove('active', 'completed');
        if (i < currentStep) el.classList.add('completed');
        if (i === currentStep) el.classList.add('active');
    }

    const progress = ((currentStep - 1) / 3) * 100;
    document.getElementById('progress-bar').style.width = progress + '%';
}

if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
}

Object.assign(window, {
    trackOrder
});
