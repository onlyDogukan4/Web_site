import { isEnglish } from './lang.js';
import { state } from './state.js';
import { addToCart } from './cart-actions.js';

function ratingStars(r) {
    let s = '';
    for (let i = 0; i < Math.floor(r); i++) s += '<i class="fas fa-star"></i>';
    if (r % 1 >= 0.5) s += '<i class="fas fa-star-half-alt"></i>';
    const empty = 5 - Math.ceil(r);
    for (let i = 0; i < empty; i++) s += '<i class="far fa-star"></i>';
    return s;
}

export function initDetailModal() {
    document.querySelector('.detail-close')?.addEventListener('click', () => {
        document.getElementById('product-detail-modal').style.display = 'none';
    });
}

export function openProductDetail(id) {
    const p = state.products.find((x) => String(x.id) === String(id));
    if (!p) return;
    const isEn = isEnglish();
    document.getElementById('detail-img').src = p.image || 'images/bardak.png';
    document.getElementById('detail-title').textContent = isEn ? p.name_en || p.name_tr : p.name_tr;
    document.getElementById('detail-price').textContent =
        '₺' + parseFloat(p.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    document.getElementById('detail-rating').innerHTML = ratingStars(parseFloat(p.rating) || 5);
    document.getElementById('detail-desc').textContent = isEn
        ? p.description_en || p.description_tr || ''
        : p.description_tr || '';
    document.getElementById('detail-add-btn').onclick = () => {
        addToCart(p.id, p.name_tr, p.price);
        document.getElementById('product-detail-modal').style.display = 'none';
    };
    document.getElementById('product-detail-modal').style.display = 'block';
}
