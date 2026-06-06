export function initSlider() {
    const slides = document.querySelector('.slides');
    const dots = document.querySelectorAll('.slider-dot');
    if (!slides || !dots.length) return;
    let cur = 0;
    const go = (i) => {
        cur = i;
        slides.style.transform = `translateX(-${cur * 100}%)`;
        dots.forEach((d, idx) => d.classList.toggle('active', idx === cur));
    };
    dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
    setInterval(() => go((cur + 1) % dots.length), 5000);
}
