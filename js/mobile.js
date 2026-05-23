/**
 * Moderra — mobil UX (menü çekmecesi, viewport, dokunmatik)
 */
(function initModerraMobile() {
    'use strict';

    function setAppHeight() {
        document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    }

    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', () => setTimeout(setAppHeight, 150));

    function closeNavMenu() {
        const navLinks = document.getElementById('nav-links');
        const hamburger = document.getElementById('hamburger-btn') || document.querySelector('.hamburger');
        navLinks?.classList.remove('active');
        navLinks?.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('nav-open');
        hamburger?.classList.remove('is-open');
        hamburger?.setAttribute('aria-expanded', 'false');
        if (hamburger) {
            const icon = hamburger.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-bars';
            }
        }
    }

    function openNavMenu() {
        const navLinks = document.getElementById('nav-links');
        const hamburger = document.getElementById('hamburger-btn') || document.querySelector('.hamburger');
        dockNavLinksToBody();
        navLinks?.classList.add('active');
        navLinks?.setAttribute('aria-hidden', 'false');
        document.body.classList.add('nav-open');
        hamburger?.classList.add('is-open');
        hamburger?.setAttribute('aria-expanded', 'true');
        if (hamburger) {
            const icon = hamburger.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-times';
            }
        }
    }

    function isMobileNavViewport() {
        return window.matchMedia('(max-width: 768px)').matches;
    }

    /** fixed menü navbar blur içinde kalmasın diye body'ye taşınır */
    let navLinksDock = null;

    function dockNavLinksToBody() {
        const navLinks = document.getElementById('nav-links');
        if (!navLinks || navLinks.dataset.docked === 'body') return;
        navLinksDock = { parent: navLinks.parentNode, next: navLinks.nextSibling };
        document.body.appendChild(navLinks);
        navLinks.dataset.docked = 'body';
    }

    function undockNavLinks() {
        const navLinks = document.getElementById('nav-links');
        if (!navLinks || !navLinksDock) return;
        const { parent, next } = navLinksDock;
        if (next) parent.insertBefore(navLinks, next);
        else parent.appendChild(navLinks);
        delete navLinks.dataset.docked;
        navLinksDock = null;
    }

    function teardownMobileNav() {
        const navLinks = document.getElementById('nav-links');
        if (!navLinks) return;
        navLinks
            .querySelectorAll(
                '.nav-drawer-header, .nav-mobile-tools, .nav-mobile-section-label, .nav-mobile-only'
            )
            .forEach((el) => el.remove());
        closeNavMenu();
        undockNavLinks();
    }

    function initMobileNavDrawer() {
        if (!isMobileNavViewport()) return;
        const navLinks = document.getElementById('nav-links');
        if (!navLinks || navLinks.querySelector('.nav-drawer-header')) return;

        const header = document.createElement('li');
        header.className = 'nav-drawer-header nav-mobile-only';
        header.innerHTML = `
            <strong>Menü</strong>
            <button type="button" class="nav-drawer-close" aria-label="Menüyü kapat">&times;</button>`;
        navLinks.insertBefore(header, navLinks.firstChild);
        header.querySelector('.nav-drawer-close')?.addEventListener('click', closeNavMenu);
    }

    function initMobileNavTools() {
        if (!isMobileNavViewport()) return;
        const navLinks = document.getElementById('nav-links');
        if (!navLinks || navLinks.querySelector('.nav-mobile-tools')) return;

        const searchBtn = document.getElementById('open-search');
        const themeBtn = document.getElementById('theme-toggle');
        const profileBtn = document.getElementById('open-profile-modal');

        const pagesLabel = document.createElement('li');
        pagesLabel.className = 'nav-mobile-section-label nav-mobile-only';
        pagesLabel.textContent = 'Sayfalar';

        const firstPageLink = navLinks.querySelector(
            'li:not(.nav-drawer-header):not(.nav-mobile-tools):not(.nav-mobile-section-label):not(.lang-switch) a'
        );
        const insertBefore = firstPageLink?.closest('li') || navLinks.children[1];

        const toolParts = [];
        if (searchBtn) {
            toolParts.push(`
                <button type="button" class="nav-mobile-tool nav-mobile-tool--full" data-nav-tool="search">
                    <i class="fas fa-search"></i><span>Ürün ara</span>
                </button>`);
        }
        if (themeBtn) {
            toolParts.push(`
                <button type="button" class="nav-mobile-tool" data-nav-tool="theme">
                    <i class="fas fa-moon"></i><span>Tema</span>
                </button>`);
        }
        if (profileBtn) {
            toolParts.push(`
                <button type="button" class="nav-mobile-tool" data-nav-tool="profile">
                    <i class="fas fa-user"></i><span>Hesabım</span>
                </button>`);
        }
        const cartBtn = document.getElementById('open-cart-modal');
        if (cartBtn) {
            toolParts.push(`
                <button type="button" class="nav-mobile-tool" data-nav-tool="cart">
                    <i class="fas fa-shopping-cart"></i><span>Sepetim</span>
                </button>`);
        }

        if (toolParts.length) {
            const label = document.createElement('li');
            label.className = 'nav-mobile-section-label nav-mobile-only';
            label.textContent = 'Hızlı erişim';

            const row = document.createElement('li');
            row.className = 'nav-mobile-tools nav-mobile-only';
            row.innerHTML = `
                <div class="nav-mobile-tools-inner" role="group" aria-label="Hızlı erişim">
                    ${toolParts.join('')}
                </div>`;

            if (insertBefore) {
                navLinks.insertBefore(pagesLabel, insertBefore);
                navLinks.insertBefore(row, pagesLabel);
                navLinks.insertBefore(label, row);
            } else {
                navLinks.appendChild(label);
                navLinks.appendChild(row);
                navLinks.appendChild(pagesLabel);
            }

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
            row.querySelector('[data-nav-tool="cart"]')?.addEventListener('click', () => {
                cartBtn?.click();
                closeNavMenu();
            });
        } else if (insertBefore) {
            navLinks.insertBefore(pagesLabel, insertBefore);
        } else if (!navLinks.querySelector('.nav-mobile-section-label')) {
            navLinks.appendChild(pagesLabel);
        }
    }

    function ensureNavBackdrop() {
        if (document.getElementById('nav-backdrop')) return;
        const backdrop = document.createElement('button');
        backdrop.type = 'button';
        backdrop.id = 'nav-backdrop';
        backdrop.className = 'nav-backdrop';
        backdrop.setAttribute('aria-label', 'Menüyü kapat');
        backdrop.addEventListener('click', closeNavMenu);
        document.body.appendChild(backdrop);
    }

    function initNav() {
        const navLinks = document.getElementById('nav-links');
        const hamburger =
            document.getElementById('hamburger-btn') || document.querySelector('.hamburger');

        if (!navLinks || !hamburger) return;

        if (!hamburger.id) hamburger.id = 'hamburger-btn';
        if (hamburger.tagName !== 'BUTTON') {
            hamburger.setAttribute('role', 'button');
            hamburger.setAttribute('tabindex', '0');
        }

        const bindMobileNav = () => {
            if (!isMobileNavViewport()) {
                teardownMobileNav();
                return;
            }

            dockNavLinksToBody();
            navLinks.setAttribute('role', 'dialog');
            navLinks.setAttribute('aria-label', 'Site menüsü');
            navLinks.setAttribute('aria-hidden', 'true');

            ensureNavBackdrop();
            initMobileNavDrawer();
            initMobileNavTools();

            hamburger.setAttribute('aria-label', 'Menüyü aç');
            if (!hamburger.dataset.navBound) {
                hamburger.dataset.navBound = '1';
                hamburger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const willOpen = !navLinks.classList.contains('active');
                    if (willOpen) openNavMenu();
                    else closeNavMenu();
                    hamburger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
                });

                navLinks.querySelectorAll('a').forEach((a) => {
                    a.addEventListener('click', () => closeNavMenu());
                });

                document.addEventListener('click', (e) => {
                    if (!navLinks.classList.contains('active')) return;
                    if (navLinks.contains(e.target) || hamburger.contains(e.target)) return;
                    closeNavMenu();
                });

                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') closeNavMenu();
                });
            }
        };

        bindMobileNav();
        window.matchMedia('(max-width: 768px)').addEventListener('change', bindMobileNav);
    }

    function initConceptDropdowns() {
        if (!isMobileNavViewport()) return;
        document.querySelectorAll('.navbar .dropdown > a').forEach((trigger) => {
            if (trigger.dataset.dropdownBound) return;
            trigger.dataset.dropdownBound = '1';
            trigger.addEventListener('click', (e) => {
                const parent = trigger.closest('.dropdown');
                if (!parent || !parent.querySelector('.dropdown-content')) return;
                e.preventDefault();
                e.stopPropagation();
                parent.classList.toggle('open');
            });
        });
    }

    function initCartScrollLock() {
        const observer = new MutationObserver(() => {
            const open = document.body.classList.contains('cart-open');
            document.documentElement.style.overflow = open ? 'hidden' : '';
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    function boot() {
        initNav();
        initConceptDropdowns();
        initCartScrollLock();
        window.matchMedia('(max-width: 768px)').addEventListener('change', initConceptDropdowns);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
