import {
    getSettings,
    calculatePaymentBreakdown,
    formatMoney,
    getCart,
} from './store.js';

function breakdownHtml(b, { compact = false } = {}) {
    const pad = compact ? '10px 12px' : '14px 16px';
    const fs = compact ? '12px' : '13px';
    return `
        <div class="pay-breakdown" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:${pad};font-size:${fs};">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#64748b;">
                <span>Ürünler (ara toplam)</span>
                <span>${formatMoney(b.subTotal)}</span>
            </div>
            ${
                b.discountTotal > 0
                    ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#16a34a;font-weight:700;">
                <span>İndirim</span><span>−${formatMoney(b.discountTotal)}</span>
            </div>`
                    : ''
            }
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#475569;">
                <span>Ürün tutarı</span>
                <span>${formatMoney(b.productTotal)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:${b.shipping > 0 ? '#dc2626' : '#16a34a'};font-weight:700;">
                <span>${b.shipping > 0 ? 'Kargo' : 'Kargo (ücretsiz)'}</span>
                <span>${b.shipping > 0 ? formatMoney(b.shipping) : 'Ücretsiz'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding-top:8px;margin-top:6px;border-top:2px solid #e2e8f0;font-weight:900;font-size:${compact ? '15px' : '17px'};color:#4338ca;">
                <span>Ödenecek tutar</span>
                <span>${formatMoney(b.grandTotal)}</span>
            </div>
            ${
                b.shipping > 0 && b.freeShippingLimit
                    ? `<p style="margin:8px 0 0;font-size:10px;color:#94a3b8;">₺${b.freeShippingLimit.toLocaleString('tr-TR')} üzeri siparişlerde kargo ücretsiz.</p>`
                    : ''
            }
        </div>`;
}

async function loadInstallmentPlans(amount, container, paytrToken, merchantId) {
    container.innerHTML =
        '<p style="text-align:center;color:#64748b;font-size:12px;padding:12px;"><i class="fas fa-spinner fa-spin"></i> Taksit oranları yükleniyor…</p>';

    try {
        const res = await fetch(`/api/paytr-installments?amount=${encodeURIComponent(amount)}`);
        const data = await res.json();

        if (!res.ok || !data.plans?.length) {
            throw new Error(data.error || 'Oran alınamadı');
        }

        let html = `<p style="margin:0 0 10px;font-size:11px;color:#64748b;line-height:1.4;">
            <i class="fas fa-info-circle"></i> ${formatMoney(amount)} için güncel taksit seçenekleri (PayTR). Kartınızı girdiğinizde iframe içinde de güncel taksitler görünür.
        </p>`;

        for (const plan of data.plans.slice(0, 6)) {
            html += `<div style="margin-bottom:12px;background:#fafafa;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                <div style="padding:8px 10px;background:linear-gradient(135deg,#eef2ff,#f8fafc);font-weight:800;font-size:11px;color:#4338ca;text-transform:uppercase;">${plan.label}</div>
                <div style="padding:8px;display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">`;

            for (const opt of plan.options) {
                html += `<div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:8px;text-align:center;">
                    <div style="font-size:10px;color:#94a3b8;">${opt.count} Taksit</div>
                    <div style="font-size:13px;font-weight:900;color:#1e293b;">${formatMoney(opt.monthly)}</div>
                    <div style="font-size:9px;color:#64748b;">/ ay · toplam ${formatMoney(opt.total)}</div>
                </div>`;
            }
            html += `</div></div>`;
        }

        container.innerHTML = html;
    } catch (e) {
        console.warn('Taksit API:', e);
        container.innerHTML =
            '<p style="font-size:11px;color:#94a3b8;">Taksit tablosu yüklenemedi. Kart bilgilerinizi girdiğinizde PayTR ekranında taksit seçenekleri görünecektir.</p>';
    }

    if (paytrToken && merchantId && !String(paytrToken).startsWith('mock_')) {
        const script = document.createElement('script');
        const amountInt = Math.round(amount);
        script.src = `https://www.paytr.com/odeme/taksit-tablosu/v2?token=${encodeURIComponent(paytrToken)}&merchant_id=${encodeURIComponent(merchantId)}&amount=${amountInt}&taksit=12&tumu=1`;
        script.onload = () => {
            const widget = document.getElementById('paytr_taksit_tablosu_widget');
            if (widget && widget.innerHTML.trim()) {
                container.insertAdjacentHTML(
                    'beforeend',
                    '<p style="margin:12px 0 6px;font-size:10px;font-weight:800;color:#4338ca;">PayTR resmi taksit tablosu</p><div id="paytr_taksit_tablosu_widget_wrap"></div>'
                );
                document.getElementById('paytr_taksit_tablosu_widget_wrap')?.appendChild(widget);
            }
        };
        document.body.appendChild(script);
    }
}

export async function payWithPayTR() {
    const breakdown = calculatePaymentBreakdown();
    const { minOrder } = getSettings();

    if (breakdown.productTotal < minOrder) {
        alert(`Minimum sipariş tutarı ₺${minOrder.toLocaleString('tr-TR')} TL'dir.`);
        return;
    }

    const userData = JSON.parse(localStorage.getItem('moderra_user_data') || '{}');
    if (!userData.name || !userData.phone || !userData.address) {
        alert('Lütfen ödeme için profil bilgilerinizi doldurun.');
        const pm = document.getElementById('profile-modal');
        if (pm) pm.style.display = 'block';
        return;
    }

    const confirmed = await new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText =
            'position:fixed;inset:0;background:rgba(15,23,42,0.7);backdrop-filter:blur(8px);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;';
        overlay.innerHTML = `
            <div style="background:white;border-radius:24px;padding:0;max-width:520px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 25px 60px rgba(0,0,0,0.3);">
                <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:22px 24px;color:white;">
                    <h3 style="margin:0;font-size:17px;font-weight:900;">Ödeme Özeti</h3>
                    <p style="margin:6px 0 0;font-size:12px;opacity:0.85;">Tutar dökümünü kontrol edin</p>
                </div>
                <div style="padding:20px 24px;display:flex;flex-direction:column;gap:14px;">
                    ${breakdownHtml(breakdown, { compact: true })}
                    <div style="background:#f8fafc;border-radius:14px;padding:14px;font-size:13px;color:#334155;line-height:1.5;">
                        <b>${userData.name}</b><br>
                        ${userData.phone}<br>
                        <span style="color:#64748b;">${userData.address}</span>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                        <button type="button" id="conf-edit-btn" style="padding:14px;border-radius:12px;border:2px solid #e2e8f0;background:white;cursor:pointer;font-weight:700;">Düzenle</button>
                        <button type="button" id="conf-ok-btn" style="padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#4f46e5,#7c3aed);cursor:pointer;font-weight:900;color:white;">Onayla ve Öde</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('#conf-ok-btn').onclick = () => {
            overlay.remove();
            resolve(true);
        };
        overlay.querySelector('#conf-edit-btn').onclick = () => {
            overlay.remove();
            document.getElementById('profile-modal').style.display = 'block';
            resolve(false);
        };
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        });
    });
    if (!confirmed) return;

    const btn = document.querySelector('button[onclick="payWithPayTR()"]');
    const originalContent = btn?.innerHTML;
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> BEKLEYİN...';
    }

    try {
        const response = await fetch('/api/paytr-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cart: getCart(),
                user: userData,
                totalAmount: breakdown.grandTotal,
            }),
        });

        const data = await response.json();
        if (!data.token) {
            alert('Ödeme başlatılamadı: ' + (data.error || 'Bilinmeyen hata'));
            return;
        }

        document.getElementById('paytr-modal')?.remove();

        const modal = document.createElement('div');
        modal.id = 'paytr-modal';
        modal.style.cssText =
            'position:fixed;inset:0;background:rgba(15,23,42,0.92);backdrop-filter:blur(20px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:10px;';

        modal.innerHTML = `
            <div class="paytr-shell" style="width:100%;max-width:1200px;background:#f8fafc;border-radius:28px;overflow:hidden;height:min(95vh,900px);display:flex;flex-direction:column;box-shadow:0 40px 80px rgba(0,0,0,0.5);">
                <div class="paytr-head" style="padding:16px 22px;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#1e293b,#334155);flex-shrink:0;gap:12px;">
                    <div style="display:flex;align-items:center;gap:12px;min-width:0;">
                        <div style="width:42px;height:42px;background:rgba(16,185,129,0.15);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                            <i class="fas fa-shield-halved" style="color:#10b981;font-size:18px;"></i>
                        </div>
                        <div style="min-width:0;">
                            <h3 style="margin:0;color:white;font-size:16px;font-weight:900;">Güvenli Ödeme</h3>
                            <p style="margin:2px 0 0;font-size:11px;color:#94a3b8;">PayTR · SSL</p>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:16px;flex-shrink:0;">
                        <div class="paytr-head-total" style="text-align:right;">
                            <p style="margin:0;font-size:10px;color:#94a3b8;">Toplam</p>
                            <p style="margin:0;font-size:20px;font-weight:900;color:#10b981;">${formatMoney(breakdown.grandTotal)}</p>
                        </div>
                        <button type="button" id="paytr-modal-close" style="background:rgba(255,255,255,0.1);border:none;width:38px;height:38px;border-radius:50%;font-size:22px;cursor:pointer;color:#fff;">&times;</button>
                    </div>
                </div>
                <div class="paytr-body" style="flex:1;display:flex;overflow:hidden;min-height:0;">
                    <div class="paytr-side" style="width:min(380px,42vw);flex-shrink:0;background:#f1f5f9;border-right:1px solid #e2e8f0;display:flex;flex-direction:column;overflow-y:auto;">
                        <div style="padding:14px 14px 0;">${breakdownHtml(breakdown)}</div>
                        <div style="margin:12px 14px;background:white;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
                            <div style="padding:12px 14px;background:linear-gradient(135deg,#eef2ff,#f8fafc);border-bottom:1px solid #e2e8f0;">
                                <p style="margin:0;font-size:11px;font-weight:800;color:#4338ca;"><i class="fas fa-credit-card"></i> Taksit seçenekleri</p>
                                <p style="margin:4px 0 0;font-size:10px;color:#64748b;">Güncel PayTR oranları · ${formatMoney(breakdown.grandTotal)}</p>
                            </div>
                            <div id="paytr-installments-panel" style="padding:12px;max-height:42vh;overflow-y:auto;"></div>
                            <div id="paytr_taksit_tablosu" style="display:none;"></div>
                        </div>
                        <p style="margin:0 14px 14px;font-size:10px;color:#64748b;line-height:1.45;">
                            Kart numaranızı sağdaki alana girdiğinizde bankanıza uygun taksitler otomatik listelenir.
                        </p>
                    </div>
                    <div class="paytr-frame" style="flex:1;display:flex;flex-direction:column;background:white;min-width:0;">
                        <iframe src="https://www.paytr.com/odeme/guvenli/${data.token}" id="paytr-iframe" title="PayTR Ödeme" style="width:100%;flex:1;border:none;min-height:320px;"></iframe>
                    </div>
                </div>
            </div>`;

        document.body.appendChild(modal);

        if (!document.getElementById('paytr-checkout-styles')) {
            const style = document.createElement('style');
            style.id = 'paytr-checkout-styles';
            style.textContent = `
                @media (max-width:768px) {
                    .paytr-body { flex-direction: column !important; }
                    .paytr-side { width: 100% !important; max-height: 38vh !important; border-right: none !important; border-bottom: 1px solid #e2e8f0; }
                    .paytr-frame { min-height: 50vh !important; }
                }
            `;
            document.head.appendChild(style);
        }

        modal.querySelector('#paytr-modal-close').onclick = () => modal.remove();

        const instPanel = document.getElementById('paytr-installments-panel');
        loadInstallmentPlans(
            breakdown.grandTotal,
            instPanel,
            data.token,
            data.merchantId || '678000'
        );

        localStorage.setItem('last_order_id', data.orderId);
    } catch (e) {
        console.error('PayTR hatası:', e);
        alert('Ödeme sistemine bağlanılamadı.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    }
}
