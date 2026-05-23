import { Admin } from './state.js';

export async function loadPaymentLinks() {
    const tbody = document.getElementById('pl-table-body');
    if (!tbody) return;
    try {
        const res  = await fetch('/api/payment-requests?t=' + Date.now());
        const list = res.ok ? await res.json() : [];
        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="padding:20px;text-align:center;color:#94a3b8;">Henüz link oluşturulmadı.</td></tr>';
            return;
        }
        tbody.innerHTML = list.slice().reverse().map(r => {
            const statusBadge = r.status === 'odendi'
                ? '<span style="background:#dcfce7;color:#16a34a;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:800;">Ödendi</span>'
                : '<span style="background:#fef9c3;color:#b45309;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:800;">Bekliyor</span>';
            const linkUrl = `${location.origin}/odeme-link.html?id=${r.id}`;
            return `
                <tr style="border-top:1px solid #f1f5f9;">
                    <td style="padding:10px 12px;font-weight:700;">${r.customerName || '—'}</td>
                    <td style="padding:10px 12px;color:#64748b;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.description || '—'}</td>
                    <td style="padding:10px 12px;font-weight:900;color:#4f46e5;">₺${parseFloat(r.amount).toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
                    <td style="padding:10px 12px;">${statusBadge}</td>
                    <td style="padding:10px 12px;display:flex;gap:6px;">
                        <button onclick="navigator.clipboard.writeText('${linkUrl}').then(()=>alert('Link kopyalandı!'))" style="background:#4f46e5;color:white;border:none;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:11px;font-weight:700;">
                            <i class="far fa-copy"></i> Link
                        </button>
                        <button onclick="deletePaymentLink('${r.id}')" style="background:#fee2e2;color:#dc2626;border:none;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:11px;font-weight:700;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
        }).join('');
    } catch(e) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding:20px;text-align:center;color:#ef4444;">Yüklenemedi.</td></tr>';
    }
}

export async function createPaymentLink() {
    const name   = document.getElementById('pl-name').value.trim();
    const phone  = document.getElementById('pl-phone').value.trim();
    const desc   = document.getElementById('pl-desc').value.trim();
    const amount = parseFloat(document.getElementById('pl-amount').value);

    if (!name)          return alert('Müşteri adı giriniz.');
    if (!desc)          return alert('Açıklama giriniz.');
    if (!amount || amount <= 0) return alert('Geçerli bir tutar giriniz.');

    try {
        const res  = await fetch('/api/payment-requests', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ customerName: name, customerPhone: phone, description: desc, amount })
        });
        const data = await res.json();
        if (!data.success) { alert('Hata: ' + (data.error || 'Bilinmeyen')); return; }

        const linkUrl = `${location.origin}/odeme-link.html?id=${data.request.id}`;
        document.getElementById('pl-link-input').value = linkUrl;
        document.getElementById('pl-result').style.display = 'flex';

        // Formu temizle
        document.getElementById('pl-name').value   = '';
        document.getElementById('pl-phone').value  = '';
        document.getElementById('pl-desc').value   = '';
        document.getElementById('pl-amount').value = '';

        loadPaymentLinks();
    } catch(e) {
        alert('Sunucu hatası: ' + e.message);
    }
}

export function copyPaymentLink() {
    const input = document.getElementById('pl-link-input');
    navigator.clipboard.writeText(input.value).then(() => {
        alert('✅ Link panoya kopyalandı!');
    });
}

export async function deletePaymentLink(id) {
    if (!confirm('Bu ödeme linkini silmek istediğinize emin misiniz?')) return;
    await fetch('/api/payment-requests', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'delete', id })
    });
    loadPaymentLinks();
}
