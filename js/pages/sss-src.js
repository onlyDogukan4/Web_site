function toggleAnswer(element) {
    const answer = element.nextElementSibling;
    const isExpanded = element.getAttribute('aria-expanded') === 'true';
    
    document.querySelectorAll('.faq-question[aria-expanded="true"]').forEach(q => {
        q.nextElementSibling.style.display = 'none';
        q.setAttribute('aria-expanded', 'false');
        q.querySelector('.icon').style.transform = 'rotate(0deg)';
        q.querySelector('.icon i').className = 'fas fa-plus';
    });

    if (!isExpanded) {
        answer.style.display = 'block';
        element.setAttribute('aria-expanded', 'true');
        element.querySelector('.icon i').className = 'fas fa-minus';
    }
}

const langToggle = document.getElementById('lang-toggle');
let currentLang = localStorage.getItem('lang') || 'tr';

function updateLanguage() {
    document.querySelectorAll('[data-tr]').forEach(el => {
        el.textContent = el.getAttribute('data-' + currentLang);
    });
    if (langToggle) langToggle.textContent = currentLang === 'tr' ? 'EN' : 'TR';
    document.documentElement.lang = currentLang;
}

if (langToggle) {
    langToggle.addEventListener('click', (e) => {
        e.preventDefault();
        currentLang = currentLang === 'tr' ? 'en' : 'tr';
        localStorage.setItem('lang', currentLang);
        updateLanguage();
    });
}

// Theme Toggle Logic
const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'light';

if (currentTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (themeToggle) themeToggle.classList.replace('fa-moon', 'fa-sun');
}

if (themeToggle) {
    themeToggle.onclick = () => {
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeToggle.classList.replace('fa-sun', 'fa-moon');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.classList.replace('fa-moon', 'fa-sun');
        }
    };
}

updateLanguage();

document.addEventListener('DOMContentLoaded', () => {
    const pm = document.getElementById('profile-modal');
    const opm = document.getElementById('open-profile-modal');
    const cl = document.querySelector('.profile-close');
    const profileForm = document.getElementById('profile-form');
    
    if(opm) opm.onclick = () => { pm.style.display = 'block'; };
    if(cl) cl.onclick = () => { pm.style.display = 'none'; };
    window.onclick = (e) => { if(e.target === pm) pm.style.display = 'none'; };

    const savedData = JSON.parse(localStorage.getItem('moderra_user_data') || '{}');
    if(savedData.name) document.getElementById('user-name').value = savedData.name;
    if(savedData.phone) document.getElementById('user-phone').value = savedData.phone;
    if(savedData.address) document.getElementById('user-address').value = savedData.address;

    if(profileForm) {
        profileForm.onsubmit = (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('user-name').value,
                phone: document.getElementById('user-phone').value,
                address: document.getElementById('user-address').value
            };
            localStorage.setItem('moderra_user_data', JSON.stringify(data));
            alert(currentLang === 'tr' ? 'Profil güncellendi!' : 'Profile updated!');
            pm.style.display = 'none';
        };
    }

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        if(link.getAttribute('href') === currentPath) link.classList.add('active');
    });

    const searchIcon = document.getElementById('open-search');
    const searchContainer = document.getElementById('search-bar');
    const closeSearch = document.getElementById('close-search');
    const searchInput = document.getElementById('search-input');

    if(searchIcon) searchIcon.onclick = () => {
        if(searchContainer) searchContainer.classList.add('active');
        setTimeout(() => { if(searchInput) searchInput.focus(); }, 100);
    };
    if(closeSearch) closeSearch.onclick = () => {
        if(searchContainer) searchContainer.classList.remove('active');
    };
});

Object.assign(window, {
    toggleAnswer
});
