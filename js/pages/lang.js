import { state } from './state.js';

export function initLang(onChange) {
    applyLang();
    document.getElementById('lang-toggle')?.addEventListener('click', (e) => {
        e.preventDefault();
        state.lang = state.lang === 'tr' ? 'en' : 'tr';
        localStorage.setItem('lang', state.lang);
        applyLang();
        onChange?.();
    });
}

export function applyLang() {
    const t = document.getElementById('lang-toggle');
    if (t) t.textContent = state.lang === 'tr' ? 'EN' : 'TR';
    document.querySelectorAll('[data-tr]').forEach((el) => {
        const v = el.getAttribute(`data-${state.lang}`);
        if (v) el.textContent = v;
    });
    document.querySelectorAll('[data-tr-placeholder]').forEach((el) => {
        const v =
            state.lang === 'tr'
                ? el.getAttribute('data-tr-placeholder')
                : el.getAttribute('data-en-placeholder');
        if (v) el.placeholder = v;
    });
}

export function isEnglish() {
    return state.lang === 'en';
}
