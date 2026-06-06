import { Admin } from './state.js';
import { renderCampaigns, renderPackages, renderConcepts } from './campaigns.js';

export async function checkDBStatus() {
    const dot = document.getElementById('db-status-dot');
    const text = document.getElementById('db-status-text');
    try {
        const res = await fetch('/api/products?t=' + Date.now());
        const result = await res.json();
        
        if (res.ok) {
            dot.style.background = '#10b981';
            text.textContent = 'Veritabanı Bağlı';
        } else {
            dot.style.background = '#ef4444';
            text.textContent = 'Bağlantı Kesik!';
            console.error("DB Error:", result);
            alert("VERİTABANI HATASI: " + (result.error || "Bilinmeyen hata") + "\n\nDetay: " + (result.details || "Yok"));
        }
    } catch (e) {
        dot.style.background = '#ef4444';
        text.textContent = 'Sunucu Hatası!';
        console.error("Fetch Error:", e);
    }
}

export async function init() {
    await checkDBStatus();
    try {
        // Her seferinde taze veri çekelim
        const [resP, resO, resC, resS, resPkg, resCon] = await Promise.all([
            fetch('/api/products?t=' + Date.now()),
            fetch('/api/orders?t=' + Date.now()),
            fetch('/api/campaigns?t=' + Date.now()),
            fetch('/api/settings?t=' + Date.now()),
            fetch('/api/packages?t=' + Date.now()), // Yeni
            fetch('/api/concepts?t=' + Date.now()) // Yeni
        ]);
        
        if (!resP.ok || !resO.ok) throw new Error("API Hatası!");
        
        Admin.products = await resP.json();
        const rawOrders = await resO.json();
        Admin.orders = Array.isArray(rawOrders) ? rawOrders : [];
        Admin.campaigns = resC.ok ? await resC.json() : [];
        Admin.settings = resS.ok ? await resS.json() : { minOrder: 500, freeShipping: 1000 };
        Admin.packages = resPkg.ok ? await resPkg.json() : []; // Yeni
        Admin.concepts = resCon.ok ? await resCon.json() : []; // Yeni
        
        // Verinin dizi olduğundan emin olalım
        if (!Array.isArray(Admin.products)) {
            console.error("Ürünler API'den beklenen formatta gelmedi:", Admin.products);
            Admin.products = []; // Varsayılan boş diziye ayarla
        }
        if (!Array.isArray(Admin.orders)) {
            console.error("Siparişler API'den beklenen formatta gelmedi:", Admin.orders);
            Admin.orders = []; // Varsayılan boş diziye ayarla
        }
        if (!Array.isArray(Admin.packages)) { // Yeni
            console.error("Paketler API'den beklenen formatta gelmedi:", Admin.packages);
            Admin.packages = [];
        }
        if (!Array.isArray(Admin.concepts)) { // Yeni
            console.error("Konseptler API'den beklenen formatta gelmedi:", Admin.concepts);
            Admin.concepts = [];
        }
        
        renderAll();
    } catch(e) { 
        console.error("Yükleme hatası:", e); 
        document.getElementById('p-table').innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding: 40px; color:red;">
                    <i class="fas fa-exclamation-circle fa-2x"></i><br><br>
                    Veriler yüklenirken hata oluştu!<br>
                    <small>${e.message}</small>
                </td>
            </tr>`;
    }
}

export function renderAll() {
    // Ürünleri Çiz (Defensive)
    if(!Array.isArray(Admin.products)) Admin.products = [];
    
    const pt = document.getElementById('p-table');
    if(!pt) return; // DOM not ready
    
    pt.innerHTML = '';
    
    let filtered = [...Admin.products];

    // Search and Filter logic
    const searchTerm = document.getElementById('search-box')?.value.toLowerCase();
    const filterStatus = document.getElementById('filter-status')?.value;

    if (searchTerm) {
        filtered = filtered.filter(p => 
            (p.name_tr && p.name_tr.toLowerCase().includes(searchTerm)) ||
            (p.name_en && p.name_en.toLowerCase().includes(searchTerm)) ||
            (p.id && p.id.toString().includes(searchTerm))
        );
    }

    if (filterStatus) {
        filtered = filtered.filter(p => p.status === filterStatus);
    }


    if (filtered.length === 0) {
        // Now 7 columns
        pt.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">Hiç ürün bulunamadı.</td></tr>`;
    } else {
        filtered.forEach((p, i) => {
            const tr = document.createElement('tr');
            const imgUrl = p.image || 'images/bardak.png';
            
            // Kampanya adını bul
            let cmpName = "-";
            if(p.campaign_id && Admin.campaigns) {
                 const c = Admin.campaigns.find(x => x.id == p.campaign_id);
                 if(c) cmpName = c.name;
            }

            tr.innerHTML = `
                <td><img src="${imgUrl}" style="width:50px; height:50px; object-fit:contain; border-radius:8px;"></td>
                <td><small style="color:#64748b; font-size:10px;">${p.id || 'N/A'}</small></td>
                <td>
                    <div style="font-weight:700; color:var(--text-main)">${p.name_tr || 'İsimsiz'}</div>
                    <div style="font-size:12px; color:var(--text-muted)">${p.name_en || ''}</div>
                </td>
                <td>
                    <div style="font-weight:700">₺${p.price}</div>
                    ${p.old_price ? `<div style="text-decoration:line-through; font-size:12px; color:#9bf">₺${p.old_price}</div>` : ''}
                </td>
                <td><span style="font-size:12px; background:#eff6ff; color:#3b82f6; padding:2px 6px; border-radius:4px;">${cmpName}</span></td>
                <td><span class="status-badge status-${p.status}">${p.status === 'active' ? 'Aktif' : (p.status === 'oos' ? 'Stok Yok' : 'İndirim')}</span></td>
                <td style="text-align:right;">
                    <div style="display:flex; gap:5px; justify-content:flex-end;">
                        <button class="btn btn-secondary" style="padding:8px 12px; background:#3b82f6; color:white;" onclick="openEditProduct(${Admin.products.indexOf(p)})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger" style="padding:8px 12px;" onclick="deleteProduct(${Admin.products.indexOf(p)})">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            `;
            pt.appendChild(tr);
        });
    }

    // Siparişleri Çiz
    const ot = document.getElementById('o-table');
    if(ot) {
        ot.innerHTML = '';
        Admin.orders
            .sort((a, b) => new Date(b.lastUpdate || 0) - new Date(a.lastUpdate || 0))
            .forEach((o) => {
            const tr = document.createElement('tr');
            const priceText = o.totalPrice ? `<b style="color:#10b981">₺${parseFloat(o.totalPrice).toLocaleString('tr-TR')}</b>` : '<span style="color:#94a3b8">-</span>';
            const hasDesign = (o.cartData || []).some(i => i.isConcept || i.note || i.logo);
            const designBadge = hasDesign ? `<span title="Tasarım dosyası var" style="display:inline-flex;align-items:center;gap:4px;background:#e0e7ff;color:#4338ca;font-size:10px;font-weight:800;padding:2px 7px;border-radius:6px;margin-left:6px;"><i class="fas fa-paint-brush"></i> TASARIM</span>` : '';
            tr.innerHTML = `
                <td><b style="color:var(--primary)">#${o.orderId}</b></td>
                <td><b>${o.customerName}</b>${designBadge}</td>
                <td><div style="font-size:12px; color:var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width:160px;">${o.items}</div></td>
                <td>${priceText}</td>
                <td><span class="status-badge status-${o.status}">${o.status.replace(/-/g, ' ')}</span></td>
                <td style="text-align:right;">
                    <button class="btn btn-primary" style="padding:8px" onclick="openEditOrder('${o.orderId}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger" style="padding:8px" onclick="deleteOrder('${o.orderId}')"><i class="fas fa-times"></i></button>
                </td>
            `;
            ot.appendChild(tr);
            });
    }
    
    renderCampaigns(); // Yeni
    renderPackages(); // Yeni
    renderConcepts(); // Yeni

     // Ayarları input'a doldur
    if(document.getElementById('s-min-order')) {
        document.getElementById('s-min-order').value = Admin.settings.minOrder || 500;
        document.getElementById('s-free-shipping').value = Admin.settings.freeShipping || 1000;
    }
}
export function openNewOrder() {
    Admin.editOrderId = null;
    document.getElementById('o-modal-title').innerText = 'Manuel Sipariş Oluştur';
    document.getElementById('o-save-btn').innerText = 'Kaydet ve Kod Üret';
    document.getElementById('o-customer').value = '';
    document.getElementById('o-items').value = '';
    document.getElementById('o-status').value = 'onay-bekliyor';
    document.getElementById('o-price').value = '';
    document.getElementById('o-delivery').value = '';
    document.getElementById('o-design-section').style.display = 'none';
    document.getElementById('order-modal-card').style.maxWidth = '500px';
    document.getElementById('order-modal').style.display = 'flex';
}

export function openEditOrder(id) {
    Admin.editOrderId = id;
    const o = Admin.orders.find((x) => x.orderId === id);
    if(!o) return;

    document.getElementById('o-modal-title').innerText = 'Sipariş Düzenle — #' + o.orderId;
    document.getElementById('o-save-btn').innerText = 'Kaydet';
    document.getElementById('o-customer').value = o.customerName;
    document.getElementById('o-items').value = o.items;
    document.getElementById('o-status').value = o.status;
    document.getElementById('o-price').value = o.totalPrice || '';
    document.getElementById('o-delivery').value = (o.estimatedDelivery === 'Bilgi Bekleniyor' || !o.estimatedDelivery) ? '' : o.estimatedDelivery;

    // Tasarım detayları
    const designSection = document.getElementById('o-design-section');
    const designItems = document.getElementById('o-design-items');
    const customerInfo = document.getElementById('o-customer-info');
    const card = document.getElementById('order-modal-card');

    const conceptItems = (o.cartData || []).filter(i => i.isConcept || i.note || i.logo);
    if (conceptItems.length > 0) {
        card.style.maxWidth = '760px';
        designSection.style.display = 'block';

        customerInfo.innerHTML = [
            o.customerPhone ? `<div><b>📞</b> ${o.customerPhone}</div>` : '',
            o.customerEmail ? `<div><b>📧</b> ${o.customerEmail}</div>` : '',
            o.customerAddress ? `<div style="grid-column:1/-1"><b>📍</b> ${o.customerAddress}</div>` : ''
        ].join('');

        designItems.innerHTML = conceptItems.map(item => {
            const isPDF = item.logo && item.logo.startsWith('data:application/pdf');
            const logoHTML = item.logo
                ? (isPDF
                    ? `<a href="${item.logo}" download="${item.logoName || 'logo.pdf'}" style="display:inline-flex;align-items:center;gap:8px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:8px 14px;color:#dc2626;font-weight:700;font-size:12px;text-decoration:none;margin-top:8px;"><i class="fas fa-file-pdf fa-lg"></i> ${item.logoName || 'logo.pdf'} — İndir</a>`
                    : `<img src="${item.logo}" style="max-height:90px;max-width:180px;border-radius:10px;border:1px solid #e2e8f0;object-fit:contain;margin-top:8px;">`)
                : '<span style="font-size:12px;color:#94a3b8;font-style:italic;">Logo yüklenmemiş</span>';

            return `<div style="background:white;border-radius:12px;padding:14px 16px;border:1px solid #e2e8f0;">
                <div style="font-weight:800;font-size:13px;color:#1e293b;margin-bottom:6px;"><i class="fas fa-crown" style="color:#d4af37;margin-right:6px;"></i>${item.name}</div>
                ${item.note ? `<div style="background:#fffbeb;border-left:3px solid #d4af37;padding:7px 11px;border-radius:8px;font-size:12px;color:#7c5f00;font-style:italic;margin-bottom:6px;">"${item.note}"</div>` : ''}
                ${logoHTML}
            </div>`;
        }).join('');
    } else {
        card.style.maxWidth = '500px';
        designSection.style.display = 'none';
    }

    document.getElementById('order-modal').style.display = 'flex';
}

export function switchSection(s) {
    document.getElementById('sec-p').style.display = s==='p'?'block':'none';
    document.getElementById('sec-c').style.display = s==='c'?'block':'none'; // Yeni
    document.getElementById('sec-o').style.display = s==='o'?'block':'none';
    document.getElementById('sec-s').style.display = s==='s'?'block':'none'; // Yeni
    document.getElementById('sec-pkg').style.display = s==='pkg'?'block':'none'; // Yeni
    document.getElementById('sec-con').style.display = s==='con'?'block':'none'; // Yeni

    document.getElementById('link-p').classList.toggle('active', s==='p');
    document.getElementById('link-c').classList.toggle('active', s==='c'); // Yeni
    document.getElementById('link-o').classList.toggle('active', s==='o');
    document.getElementById('link-s').classList.toggle('active', s==='s'); // Yeni
    document.getElementById('link-pkg').classList.toggle('active', s==='pkg'); // Yeni
    document.getElementById('link-con').classList.toggle('active', s==='con'); // Yeni
}
