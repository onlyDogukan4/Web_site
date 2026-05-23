/**
 * Moderra — mobil UX (menü, viewport, dokunmatik)
 */
(function initModerraMobile() {
    'use strict';

    /** iOS 100vh hatası */
    function setAppHeight() {
        document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    }

    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', () => setTimeout(setAppHeight, 150));

    function closeNavMenu() {
        const navLinks = document.getElementById('nav-links');
        navLinks?.classList.remove('active');
        document.body.classList.remove('nav-open');
    }

    /** Mobil menüde ara / tema / hesap kısayolları */
    function initMobileNavTools() {
        const navLinks = document.getElementById('nav-links');
        if (!navLinks || navLinks.querySelector('.nav-mobile-tools')) return;

        const searchBtn = document.getElementById('open-search');
        const themeBtn = document.getElementById('theme-toggle');
        const profileBtn = document.getElementById('open-profile-modal');
        if (!searchBtn && !themeBtn && !profileBtn) return;

        const row = document.createElement('li');
        row.className = 'nav-mobile-tools';
        row.innerHTML = `
            <div class="nav-mobile-tools-inner" role="group" aria-label="Hızlı erişim">
                <button type="button" class="nav-mobile-tool" data-nav-tool="search" aria-label="Ara">
                    <i class="fas fa-search"></i><span>Ara</span>
                </button>
                <button type="button" class="nav-mobile-tool" data-nav-tool="theme" aria-label="Tema">
                    <i class="fas fa-moon"></i><span>Tema</span>
                </button>
                <button type="button" class="nav-mobile-tool" data-nav-tool="profile" aria-label="Hesabım">
                    <i class="fas fa-user"></i><span>Hesabım</span>
                </button>
            </div>`;

        navLinks.insertBefore(row, navLinks.firstChild);

        row.querySelector('[data-nav-tool="search"]')?.addEventListener('click', () => {
            searchBtn?.click();
            closeNavMenu();
        });
        row.querySelector('[data-nav-tool="theme"]')?.addEventListener('click', () => {
            themeBtn?.click();
            const icon = row.querySelector('[data-nav-tool="theme"] i');
            if (icon && themeBtn) {
                icon.className = themeBtn.classList.contains('fa-sun') ? 'fas fa-sun' : 'fas fa-moon';
            }
        });
        row.querySelector('[data-nav-tool="profile"]')?.addEventListener('click', () => {
            profileBtn?.click();
            closeNavMenu();
        });
    }

    /** Hamburger menü — tüm sayfalarda */
    function initNav() {
        const navLinks = document.getElementById('nav-links');
        const hamburger =
            document.getElementById('hamburger-btn') ||
            document.querySelector('.hamburger');

        if (!navLinks || !hamburger) return;

        if (!hamburger.id) hamburger.id = 'hamburger-btn';

        initMobileNavTools();

        const toggle = () => {
            const open = navLinks.classList.toggle('active');
            document.body.classList.toggle('nav-open', open);
        };

        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            toggle();
        });

        navLinks.querySelectorAll('a').forEach((a) => {
            a.addEventListener('click', () => closeNavMenu());
        });

        document.addEventListener('click', (e) => {
            if (!navLinks.classList.contains('active')) return;
            if (navLinks.contains(e.target) || hamburger.contains(e.target)) return;
            closeNavMenu();
        });
    }

    /** Sepet açıkken body kilidi (iOS bounce) */
    function initCartScrollLock() {
        const observer = new MutationObserver(() => {
            const open = document.body.classList.contains('cart-open');
            document.documentElement.style.overflow = open ? 'hidden' : '';
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initNav();
            initCartScrollLock();
        });
    } else {
        initNav();
        initCartScrollLock();
    }
})();
