import { renderProducts } from './products.js';

export function initSearch() {
    const bar = document.getElementById('search-bar');
    const input = document.getElementById('search-input');
    const countEl = document.getElementById('search-count');

    function closeSearch() {
        bar.classList.remove('active');
        input.value = '';
        if (countEl) countEl.textContent = '';
        renderProducts();
    }

    document.getElementById('open-search')?.addEventListener('click', () => {
        bar.classList.add('active');
        input.value = '';
        if (countEl) countEl.textContent = '';
        setTimeout(() => input.focus(), 50);
    });

    document.getElementById('close-search')?.addEventListener('click', closeSearch);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && bar.classList.contains('active')) closeSearch();
    });

    input?.addEventListener('input', () => {
        const term = input.value.toLowerCase().trim();
        const cards = document.querySelectorAll('.product-card');
        let visible = 0;
        cards.forEach((card) => {
            const title = card.querySelector('.product-title')?.textContent.toLowerCase() || '';
            const show = !term || title.includes(term);
            card.style.display = show ? '' : 'none';
            if (show) visible++;
        });
        if (countEl) countEl.textContent = term ? `${visible} sonuç` : '';
    });
}
