const root = document.documentElement;
let concepts = [];
const itemsPerPage = 2;
let currentPage = 1;
let currentLang = localStorage.getItem('lang') || 'tr';

const getCart = () => window.moderraCart || [];

async function initConcepts() {
    try {
        const res = await fetch('/api/concepts?t=' + Date.now());
        const raw = await res.json();
        concepts = (raw || []).filter(c => c.published);
        renderConceptSections();
    } catch (e) { console.error('Konseptler yüklenemedi:', e); }
}

function renderConceptSections() {
    const wrapper = document.getElementById('concepts-wrapper');
    const filtered = concepts;

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const currentItems = filtered.slice(start, end);

    wrapper.innerHTML = '';
    
    if (currentItems.length === 0) {
        wrapper.innerHTML = '<div style="text-align:center; padding:100px; font-size:24px; opacity:0.5;">Bu kategoride ürün bulunamadı.</div>';
    }

    currentItems.forEach((c) => {
        const section = document.createElement('section');
        section.className = 'concept-section';
        section.id = c.id;
        section.dataset.color = c.theme_color;
        section.dataset.bg = c.bg_color;

        const isEn = localStorage.getItem('lang') === 'en';
        const name = isEn ? (c.name_en || c.name) : c.name;
        const desc = isEn ? (c.desc_en || c.desc_tr) : (c.desc_tr || 'Özel tasarım bardaklar.');

        const variants = c.variations || {};
        
        section.innerHTML = `
            <div class="concept-container">
                <div class="concept-visual">
                    <div class="cup-preview">
                        <img src="${c.base_image}" alt="${name}" class="dynamic-cup">
                        ${c.label_text ? `<div class="modern-cup-label" style="background:${c.theme_color}; color:white;">${c.label_text}</div>` : ''}
                    </div>
                </div>
                <div class="concept-details">
                    <h1 style="color:var(--theme-color)">${name}</h1>
                    <p>${desc}</p>
                    
                    <div class="customize-group">
                        <span class="customize-label" data-tr="BOYUT SEÇİMİ" data-en="SIZE SELECTION">Boyut Seçimi</span>
                        <div class="option-list" data-concept-id="${c.id}">
                            ${['4oz', '7oz', '8oz', '12oz'].map(oz => {
                                const isOOS = variants[`${oz}-nolid`]?.stock === 0;
                                return `<button class="size-btn ${oz === '4oz' ? 'active' : ''} ${isOOS ? 'oos' : ''}" 
                                    data-oz="${oz}" onclick="selectSize(this)" ${isOOS ? 'disabled' : ''}>${oz.replace('oz', ' oz')}</button>`;
                            }).join('')}
                        </div>
                    </div>

                    <div class="customize-group">
                        <span class="customize-label" data-tr="KAPAK SEÇENEĞİ" data-en="LID OPTION">Kapak Seçeneği</span>
                        <div class="option-list" data-concept-id="${c.id}">
                            <button class="lid-btn active" data-lid="nolid" onclick="selectLid(this)">
                                <i class="fas fa-times"></i> <span data-tr="KAPAKSIZ" data-en="NO LID">Kapaksız</span>
                            </button>
                            <button class="lid-btn" data-lid="lid" onclick="selectLid(this)">
                                <i class="fas fa-coffee"></i> <span data-tr="KAPAKLI" data-en="WITH LID">Kapaklı</span>
                            </button>
                        </div>
                    </div>

                    <div id="stock-info-${c.id}" style="font-weight:700; font-size:14px; margin-bottom:20px;"></div>

                    <div style="display:flex; flex-direction:column; gap:12px; margin-top:20px;">
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <label style="font-size:12px; font-weight:800; color:var(--theme-text); display:flex; align-items:center; gap:5px;">
                                <i class="fas fa-pencil-alt"></i> <span data-tr="ÖZEL İSTEK NOTUNUZ" data-en="YOUR SPECIAL REQUEST NOTE">ÖZEL İSTEK NOTUNUZ</span>
                            </label>
                            <textarea id="note-${c.id}" placeholder="Üzerine ne yazılmasını istersiniz? Veya diğer özel istekleriniz..." style="width:100%; height:80px; padding:12px; border-radius:12px; border:2px solid var(--theme-color); background:rgba(255,255,255,0.1); color:var(--theme-text); font-family:inherit; font-size:13px; outline:none; resize:none;"></textarea>
                        </div>

                        <!-- Logo / PDF Yükleme Alanı -->
                        <div style="margin-bottom:4px;">
                            <label style="font-size:12px; font-weight:800; color:var(--theme-text); display:flex; align-items:center; gap:5px; margin-bottom:8px;">
                                <i class="fas fa-file-upload" style="color:var(--theme-color);"></i>
                                <span data-tr="LOGO / TASARIM DOSYANIZ" data-en="YOUR LOGO / DESIGN FILE">LOGO / TASARIM DOSYANIZ</span>
                                <span style="font-weight:400; opacity:0.7; font-size:11px;">(PNG, JPG, PDF)</span>
                            </label>
                            <label for="logo-upload-${c.id}" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; width:100%; min-height:90px; border:2px dashed var(--theme-color); border-radius:14px; cursor:pointer; background:rgba(255,255,255,0.06); transition:background 0.2s; padding:12px; box-sizing:border-box;" id="logo-drop-${c.id}" onmouseover="this.style.background='rgba(255,255,255,0.13)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">
                                <div id="logo-preview-${c.id}" style="display:none; width:100%; text-align:center;">
                                    <img id="logo-img-${c.id}" src="" style="max-height:70px; max-width:100%; border-radius:8px; object-fit:contain;" />
                                    <div id="logo-filename-${c.id}" style="font-size:11px; margin-top:5px; opacity:0.8; word-break:break-all;"></div>
                                </div>
                                <div id="logo-placeholder-${c.id}" style="display:flex; flex-direction:column; align-items:center; gap:4px; pointer-events:none;">
                                    <i class="fas fa-cloud-upload-alt" style="font-size:24px; color:var(--theme-color); opacity:0.7;"></i>
                                    <span style="font-size:12px; opacity:0.7;">Dosya seçmek için tıklayın</span>
                                </div>
                            </label>
                            <input type="file" id="logo-upload-${c.id}" accept="image/*,.pdf" style="display:none;" onchange="handleLogoUpload(this, '${c.id}')">
                            <div id="logo-error-${c.id}" style="color:#ef4444; font-size:11px; margin-top:4px; display:none;">Dosya 5MB'dan küçük olmalıdır.</div>
                        </div>

                        <div id="price-display-${c.id}" style="font-size:32px; font-weight:900; color:var(--theme-color); margin-bottom:15px;">₺15,00</div>

                        <button onclick="addToCartConcept('${c.id}')" id="add-btn-${c.id}" class="order-btn" style="background:var(--theme-color); color:white; border:none; width:100%; border-radius:15px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; font-weight:800; padding:18px; margin-top:10px;">
                            <i class="fas fa-crown"></i><span data-tr="PREMIUM SEPETE EKLE" data-en="ADD PREMIUM TO CART">PREMIUM SEPETE EKLE</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        wrapper.appendChild(section);
        // Initial price refresh
        setTimeout(() => updateConceptPrice(c.id), 100);
    });

    renderPagination(totalPages);
    setupObserver();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderPagination(totalPages) {
    const pag = document.getElementById('pagination');
    if (totalPages <= 1) {
        pag.innerHTML = '';
        return;
    }

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `
            <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>
        `;
    }
    pag.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    renderConceptSections();
}

function updateCupVisual(conceptId) {
    const concept = concepts.find(c => c.id == conceptId);
    if (!concept) return;

    const section = document.getElementById(conceptId);
    const sizeBtn = section.querySelector('.size-btn.active');
    const lidBtn = section.querySelector('.lid-btn.active');
    
    const oz = sizeBtn.dataset.oz;
    const lid = lidBtn.dataset.lid;
    const scale = sizeBtn.dataset.scale || 1.0;
    const variantKey = `${oz}-${lid}`;
    
    const variantData = (concept.variations && concept.variations[variantKey]) 
                       ? concept.variations[variantKey] 
                       : { img: concept.base_image, stock: 100 };
    
    const targetSrc = variantData.img || concept.base_image;
    const stock = variantData.stock !== undefined ? variantData.stock : 100;

    const cupImg = section.querySelector('.dynamic-cup');
    const preview = section.querySelector('.cup-preview');
    
    const oldLayer = preview.querySelector('.oos-layer');
    if(oldLayer) oldLayer.remove();

    if (stock <= 0) {
        cupImg.style.filter = "grayscale(1) opacity(0.3)";
        preview.classList.add('oos-active');
        setTimeout(() => preview.classList.remove('oos-active'), 600);
        
        const layer = document.createElement('div');
        layer.className = 'oos-layer';
        layer.style.cssText = "position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-15deg); background:#ef4444; color:white; padding:12px 25px; font-weight:900; border-radius:15px; z-index:50; box-shadow:0 15px 30px rgba(239, 68, 68, 0.4); font-size:16px; border:3px solid white; pointer-events:none;";
        layer.innerHTML = "STOKTA YOK";
        preview.appendChild(layer);
    } else {
        cupImg.style.filter = "none";
        preview.classList.remove('oos-active');
    }

    cupImg.style.transform = `scale(${scale})`;
    cupImg.src = targetSrc;

    // Update WA
    const waBtn = section.querySelector('.order-btn:not([onclick*="addToCart"])');
    if (waBtn) {
        const name = concept.name;
        if(stock <= 0) {
            waBtn.style.opacity = "0.5";
            waBtn.style.pointerEvents = "none";
            waBtn.innerHTML = `<i class="fas fa-clock"></i> <span data-tr="STOK BEKLENİYOR" data-en="AWAITING STOCK">STOK BEKLENİYOR</span>`;
        } else {
            waBtn.style.opacity = "1";
            waBtn.style.pointerEvents = "auto";
            waBtn.innerHTML = `<i class="fab fa-whatsapp"></i> <span data-tr="TEKLİF AL / SİPARİŞ VER" data-en="GET QUOTE / ORDER">TEKLİF AL / SİPARİŞ VER</span>`;
            waBtn.href = `https://wa.me/905304640120?text=Merhaba, ${name} konsepti (${oz}, ${lid === 'lid' ? 'Kapaklı' : 'Kapaksız'}) hakkında bilgi almak istiyorum.`;
        }
    }
}

function updateThemeColors(section) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const themeColor = section.dataset.color;
    const themeBg = isDark ? '#0a0f1e' : section.dataset.bg;
    const themeText = isDark ? '#f1f5f9' : section.dataset.text;

    root.style.setProperty('--theme-color', themeColor);
    root.style.setProperty('--theme-bg', themeBg);
    root.style.setProperty('--theme-text', themeText);
}

function selectSize(btn) {
    const list = btn.parentElement;
    list.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const conceptId = list.dataset.conceptId;
    updateConceptPrice(conceptId);

    const oz = btn.dataset.oz;
    const scaleMap = { '4oz': 0.8, '7oz': 1.0, '8oz': 1.1, '12oz': 1.25 };
    const img = document.querySelector(`#${conceptId} .dynamic-cup`);
    if(img) img.style.transform = `scale(${scaleMap[oz] || 1})`;
}

function selectLid(btn) {
    const list = btn.parentElement;
    list.querySelectorAll('.lid-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const conceptId = list.dataset.conceptId;
    updateConceptPrice(conceptId);
    updateCupVisual(conceptId);
}

function updateConceptPrice(conceptId) {
    const concept = concepts.find(c => c.id == conceptId);
    if(!concept) return;

    const section = document.getElementById(conceptId);
    const size = section.querySelector('.size-btn.active').dataset.oz;
    const lid = section.querySelector('.lid-btn.active').dataset.lid;
    const variantKey = `${size}-${lid}`;
    const variant = (concept.variations && concept.variations[variantKey]) || {};
    
    const variantPrice  = parseFloat(variant.price);
    const conceptPrice  = parseFloat(concept.price);
    
    let cleanPrice = 15.0;
    if (!isNaN(variantPrice) && variantPrice > 0) {
        cleanPrice = variantPrice;
    } else if (!isNaN(conceptPrice) && conceptPrice > 0) {
        cleanPrice = conceptPrice;
    }
    const stock = variant.stock === undefined ? 999 : variant.stock;

    const priceEl = document.getElementById(`price-display-${conceptId}`);
    if(priceEl) priceEl.innerText = `₺${cleanPrice.toLocaleString('tr-TR', {minimumFractionDigits:2})}`;

    const addBtn = document.getElementById(`add-btn-${conceptId}`);
    if(addBtn) {
        if(stock <= 0) {
            addBtn.disabled = true;
            addBtn.style.opacity = "0.5";
            addBtn.innerHTML = `<i class="fas fa-times-circle"></i> STOKTA YOK`;
        } else {
            addBtn.disabled = false;
            addBtn.style.opacity = "1";
            addBtn.innerHTML = `<i class="fas fa-crown"></i> ${localStorage.getItem('lang') === 'en' ? 'ADD PREMIUM TO CART' : 'PREMIUM SEPETE EKLE'}`;
        }
    }
}

function setupObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                updateThemeColors(entry.target);
                document.querySelectorAll('.dot').forEach(dot => 
                    dot.classList.toggle('active', dot.dataset.target === entry.target.id)
                );
            }
        });
    }, { threshold: 0.6 });

    document.querySelectorAll('.concept-section').forEach(s => observer.observe(s));

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
         if(link.getAttribute('href') === currentPath) link.classList.add('active');
    });
}

function handleLogoUpload(input, conceptId) {
    const file = input.files[0];
    if (!file) return;
    const errEl = document.getElementById(`logo-error-${conceptId}`);
    if (file.size > 5 * 1024 * 1024) {
        errEl.style.display = 'block';
        input.value = '';
        return;
    }
    errEl.style.display = 'none';
    const reader = new FileReader();
    reader.onload = (e) => {
        const base64 = e.target.result;
        const preview = document.getElementById(`logo-preview-${conceptId}`);
        const placeholder = document.getElementById(`logo-placeholder-${conceptId}`);
        const imgEl = document.getElementById(`logo-img-${conceptId}`);
        const nameEl = document.getElementById(`logo-filename-${conceptId}`);

        if (file.type === 'application/pdf') {
            imgEl.style.display = 'none';
            nameEl.innerHTML = `<i class="fas fa-file-pdf" style="font-size:28px; color:#ef4444;"></i><br>${file.name}`;
        } else {
            imgEl.style.display = '';
            imgEl.src = base64;
            nameEl.textContent = file.name;
        }
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        input._base64 = base64;
        input._filename = file.name;
    };
    reader.readAsDataURL(file);
}

function addToCartConcept(conceptId) {
    const concept = concepts.find(c => c.id == conceptId);
    if(!concept) return;
    const section = document.getElementById(conceptId);
    const ozVariant = section.querySelector('.size-btn.active').dataset.oz;
    const lidVariant = section.querySelector('.lid-btn.active')?.dataset.lid || 'nolid';
    const variantKey = `${ozVariant}-${lidVariant}`;
    const variantData = (concept.variations && concept.variations[variantKey]) || null;

    const varPrice     = variantData ? parseFloat(variantData.price) : 0;
    const conceptPrice = parseFloat(concept.price);
    const priceEl      = document.getElementById(`price-display-${conceptId}`);
    const domPrice     = priceEl ? parseFloat(
        (priceEl.innerText || '').replace(/[^0-9,.]/g, '').replace(/\./g, '').replace(',', '.')
    ) : 0;
    
    let price = 15.0;
    if (!isNaN(varPrice) && varPrice > 0) {
        price = varPrice;
    } else if (!isNaN(conceptPrice) && conceptPrice > 0) {
        price = conceptPrice;
    } else if (!isNaN(domPrice) && domPrice > 0) {
        price = domPrice;
    }

    const logoInput = document.getElementById(`logo-upload-${conceptId}`);
    const logoData = logoInput?._base64 || null;
    const logoName = logoInput?._filename || null;
    const noteInput = document.getElementById(`note-${conceptId}`);
    const noteText = noteInput ? noteInput.value : '';

    const modal = document.getElementById('confirm-modal');
    document.getElementById('conf-name').innerText = concept.name;
    document.getElementById('conf-size').innerText = ozVariant;
    document.getElementById('conf-lid').innerText = lidVariant==='lid'?'Kapaklı':'Kapaksız';
    document.getElementById('conf-price').innerText = `₺${price.toLocaleString('tr-TR', {minimumFractionDigits:2})}`;
    modal.style.display = 'flex';

    document.getElementById('conf-cancel').onclick = () => modal.style.display = 'none';
    document.getElementById('conf-approve').onclick = () => {
        window.addToCart({
            id: `concept-${concept.id}-${Date.now()}`,
            conceptId: String(concept.id),
            variantKey: variantKey,
            name: `${concept.name || concept.name_en || 'Konsept'} (${ozVariant})`,
            image: variantData?.img || concept.base_image,
            price: price,
            quantity: 1,
            note: noteText,
            isConcept: true,
            logo: logoData,
            logoName: logoName
        });
        modal.style.display = 'none';
        document.body.classList.add('cart-open');
    };
}

async function triggerCartAI() {
    const cart = getCart();
    if (cart.length === 0) return;
    const textEl = document.getElementById('mr-karton-ai-text');
    if (!textEl) return;
    let freeShip = 1000;
    try { freeShip = JSON.parse(localStorage.getItem('settings'))?.freeShipping || 1000; } catch(e){}
    const total = cart.reduce((s, i) => s + (parseFloat(i.price) * i.quantity), 0);
    const prompt = `Sepet: ${cart.map(i => `${i.quantity}x ${i.name}${i.isConcept ? ' (VIP konsept)' : ''}`).join(', ')}. Toplam: ${total} TL. Ücretsiz kargo limiti ${freeShip} TL.`;
    try {
        const res = await fetch('/api/cart-chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ prompt })
        });
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content || "Mükemmel seçim, Efendim!";
        textEl.innerText = text;
    } catch(e) { textEl.innerText = "Harika seçimler! Sepetiniz hazır."; }
}

function updateLanguage() {
    const currentLang = localStorage.getItem('lang') || 'tr';
    document.querySelectorAll('[data-tr]').forEach(el => el.textContent = el.getAttribute('data-' + currentLang));
    const langToggle = document.getElementById('lang-toggle');
    if(langToggle) langToggle.textContent = currentLang === 'tr' ? 'EN' : 'TR';
}

document.addEventListener('DOMContentLoaded', () => {
    initConcepts().then(() => syncConceptCartPrices());
    window.updateCartDisplay();
    
    function syncConceptCartPrices() {
        let changed = false;
        let cartList = window.moderraCart || [];
        cartList = cartList.map(item => {
            if (!item.isConcept || !item.conceptId || !item.variantKey) return item;
            const concept = concepts.find(c => String(c.id) === item.conceptId);
            if (!concept) return item;
            const variant      = concept.variations?.[item.variantKey] || {};
            const variantPrice = parseFloat(variant.price);
            const conceptPrice = parseFloat(concept.price);
            const newPrice     = (variantPrice > 0) ? variantPrice
                              : (conceptPrice > 0) ? conceptPrice
                              : 15.0;
            if (newPrice !== parseFloat(item.price)) {
                changed = true;
                return { ...item, price: newPrice };
            }
            return item;
        });
        if (changed) {
            window.moderraCart = cartList;
            localStorage.setItem('cart', JSON.stringify(cartList));
            window.updateCartDisplay();
        }
    }

    let _lastUpdateTime = null;
    async function checkForUpdates() {
        try {
            const r = await fetch('/api/settings?type=last-update&t=' + Date.now());
            if (!r.ok) return;
            const d = await r.json();
            if (_lastUpdateTime === null) { _lastUpdateTime = d.time; return; }
            if (d.time !== _lastUpdateTime) {
                _lastUpdateTime = d.time;
                await initConcepts();
                syncConceptCartPrices();
                window.updateCartDisplay();
            }
        } catch(e) {}
    }
    setInterval(checkForUpdates, 8000);

    const pm = document.getElementById('profile-modal');
    const opm = document.getElementById('open-profile-modal');
    const cl = document.querySelector('.profile-close');
    const profileForm = document.getElementById('profile-form');
    
    if(opm) opm.onclick = (e) => { e.preventDefault(); pm.style.display = 'block'; };
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

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.onclick = () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                themeToggle.classList.replace('fa-sun', 'fa-moon');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                themeToggle.classList.replace('fa-moon', 'fa-sun');
            }
            const activeSection = Array.from(document.querySelectorAll('.concept-section')).find(s => {
                const rect = s.getBoundingClientRect();
                return rect.top >= -window.innerHeight/2 && rect.top <= window.innerHeight/2;
            });
            if (activeSection) updateThemeColors(activeSection);
        };
    }

    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.onclick = (e) => { 
            e.preventDefault(); 
            currentLang = (currentLang === 'tr' ? 'en' : 'tr'); 
            localStorage.setItem('lang', currentLang); 
            updateLanguage(); 
            renderConceptSections();
        };
    }

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        if(link.getAttribute('href') === currentPath) link.classList.add('active');
    });
    
    const searchIcon = document.getElementById('open-search');
    const searchContainer = document.querySelector('.search-container');
    const closeSearch = document.getElementById('close-search');
    const searchInput = document.getElementById('search-input');

    if(searchIcon) searchIcon.onclick = () => {
        if(searchContainer) searchContainer.classList.add('active');
        setTimeout(() => { if(searchInput) searchInput.focus(); }, 100);
    };
    if(closeSearch) closeSearch.onclick = () => {
        if(searchContainer) searchContainer.classList.remove('active');
        if(searchInput) searchInput.value = '';
    };
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && searchContainer?.classList.contains('active')) {
            searchContainer.classList.remove('active');
            if(searchInput) searchInput.value = '';
        }
    });
});

(function applyStoredTheme() {
    const saved = localStorage.getItem('theme');
    const themeToggle = document.getElementById('theme-toggle');
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeToggle) themeToggle.classList.replace('fa-moon', 'fa-sun');
    } else {
        document.documentElement.removeAttribute('data-theme');
        if (themeToggle) themeToggle.classList.replace('fa-sun', 'fa-moon');
    }
})();

Object.assign(window, {
    selectSize,
    selectLid,
    handleLogoUpload,
    addToCartConcept,
    changePage,
    initConcepts,
    updateCupVisual,
    updateConceptPrice
});
