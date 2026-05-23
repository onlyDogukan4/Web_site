export function initProfile() {
    const modal = document.getElementById('profile-modal');
    document.getElementById('open-profile-modal')?.addEventListener('click', () => {
        modal.style.display = 'block';
    });
    document.querySelector('.profile-close')?.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    document.getElementById('profile-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        localStorage.setItem(
            'moderra_user_data',
            JSON.stringify({
                name: document.getElementById('user-name').value,
                phone: document.getElementById('user-phone').value,
                address: document.getElementById('user-address').value,
            })
        );
        modal.style.display = 'none';
    });

    const saved = JSON.parse(localStorage.getItem('moderra_user_data') || '{}');
    if (saved.name) document.getElementById('user-name').value = saved.name;
    if (saved.phone) document.getElementById('user-phone').value = saved.phone;
    if (saved.address) document.getElementById('user-address').value = saved.address;

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
        const dm = document.getElementById('product-detail-modal');
        if (e.target === dm) dm.style.display = 'none';
    });
}
