export function initActiveNav() {
    const path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach((a) => {
        a.classList.toggle('active', a.getAttribute('href') === path);
    });
}
