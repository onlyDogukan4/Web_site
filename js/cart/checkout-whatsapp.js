import { getCart, getSettings, calculateCartTotal } from './store.js';
import { getShippingFee } from './store.js';

export function whatsappCheckout() {
    const { minOrder } = getSettings();
    const { total } = calculateCartTotal();

    if (total < minOrder) {
        alert(`Minimum sipariş tutarı ₺${minOrder.toLocaleString('tr-TR')} TL'dir.`);
        return;
    }

    const user = JSON.parse(localStorage.getItem('moderra_user_data') || '{}');
    if (!user.name || !user.phone || !user.address) {
        alert('Lütfen sipariş için profil bilgilerinizi doldurun.');
        const pm = document.getElementById('profile-modal');
        if (pm) pm.style.display = 'block';
        return;
    }

    const shipping   = getShippingFee(total);
    const grandTotal = total + shipping;

    let msg = '*Moderra — Yeni Sipariş*\n\n';
    getCart().forEach(item => {
        const itemQty = item.quantity || 1;
        const lineTotal = item.isPackage
            ? item.packageItems.reduce((a, si) => a + (parseFloat(si.price) || 0) * (si.quantity || 1), 0)
              * (1 - (parseFloat(item.discount) || 0) / 100) * itemQty
            : (parseFloat(item.price) || 0) * itemQty;
        msg += `📦 ${item.quantity}× ${item.name} — ₺${lineTotal.toLocaleString('tr-TR', {minimumFractionDigits:2})}\n`;
        if (item.note) msg += `   └ 📝 Not: ${item.note}\n`;
        if (item.isConcept) msg += `   └ 👑 VIP Premium Özel Tasarım\n`;
        if (item.logo) msg += `   └ 🖼️ Logo yüklendi (WhatsApp üzerinden iletilecek)\n`;
    });
    if (shipping > 0) msg += `\n🚚 Kargo: ₺${shipping.toLocaleString('tr-TR')}\n`;
    msg += `\n*💰 Toplam: ₺${grandTotal.toLocaleString('tr-TR', {minimumFractionDigits:2})}*\n\n`;
    msg += `👤 ${user.name}\n📞 ${user.phone}\n🏠 ${user.address}`;

    window.open(`https://wa.me/905304640120?text=${encodeURIComponent(msg)}`, '_blank');
}