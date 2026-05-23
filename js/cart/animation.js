export function flyToCart(imgElement) {
    if (!imgElement) return;
    const cartIcon = document.getElementById('open-cart-modal');
    if (!cartIcon) return;

    const flyImg = imgElement.cloneNode(true);
    const rect = imgElement.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    Object.assign(flyImg.style, {
        position: 'fixed',
        left: rect.left + 'px',
        top: rect.top + 'px',
        width: '80px',
        height: '80px',
        zIndex: '100000',
        pointerEvents: 'none',
        transition: 'all 0.75s cubic-bezier(0.19, 1, 0.22, 1)',
        borderRadius: '12px',
        objectFit: 'contain'
    });

    document.body.appendChild(flyImg);

    requestAnimationFrame(() => {
        flyImg.style.transform = `translate(${cartRect.left - rect.left}px, ${cartRect.top - rect.top}px) scale(0.1)`;
        flyImg.style.opacity = '0.4';
    });

    setTimeout(() => {
        flyImg.remove();
        cartIcon.classList.add('shake');
        setTimeout(() => cartIcon.classList.remove('shake'), 500);
    }, 750);
}