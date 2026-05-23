/** Admin panel mobil menü */
(function initAdminMobile() {
    const toggle = document.getElementById('admin-sidebar-toggle');
    const backdrop = document.getElementById('admin-sidebar-backdrop');
    const sidebar = document.querySelector('.sidebar');

    if (!toggle || !sidebar) return;

    const close = () => document.body.classList.remove('admin-sidebar-open');
    const open = () => document.body.classList.add('admin-sidebar-open');

    toggle.addEventListener('click', () => {
        if (document.body.classList.contains('admin-sidebar-open')) close();
        else open();
    });

    backdrop?.addEventListener('click', close);

    sidebar.querySelectorAll('.nav-link').forEach((link) => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 900) close();
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 900) close();
    });
})();
