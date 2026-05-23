export const PER_PAGE = 6;

export const state = {
    products: [],
    packages: [],
    campaigns: [],
    lang: localStorage.getItem('lang') || 'tr',
    category: 'Tümü',
    page: 1,
};

window.onCardQuantities = window.onCardQuantities || {};
