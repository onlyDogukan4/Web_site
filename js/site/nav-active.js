/**
 * Aktif menü sekmesini mevcut sayfaya göre işaretler (tüm site sayfaları).
 */
(function initActiveNav() {
    'use strict';

    function markActiveNav() {
        const path = location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-links a[href]').forEach((link) => {
            const href = link.getAttribute('href');
            if (!href || href === '#') return;
            link.classList.toggle('active', href === path);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', markActiveNav);
    } else {
        markActiveNav();
    }
})();
