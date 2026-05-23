import { Admin } from './state.js';

export function setupGenericDrop(zoneId, fileId, previewId, textId, callback) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(fileId);
    if(!zone || !input) return;

    zone.onclick = () => input.click();
    zone.ondragover = (e) => { e.preventDefault(); zone.classList.add('hover'); };
    zone.ondragleave = () => zone.classList.remove('hover');
    zone.ondrop = (e) => {
        e.preventDefault();
        zone.classList.remove('hover');
        handleFileSelect(e.dataTransfer.files[0], previewId, textId, callback);
    };
    input.onchange = (e) => handleFileSelect(e.target.files[0], previewId, textId, callback);
}

export function handleFileSelect(file, previewId, textId, callback) {
    if(!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const max = 800; 

            if (width > height) {
                if (width > max) { height *= max / width; width = max; }
            } else {
                if (height > max) { width *= max / height; height = max; }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressed = canvas.toDataURL('image/jpeg', 0.7);
            
            const prev = document.getElementById(previewId);
            const txt = document.getElementById(textId);
            if(prev) { prev.src = compressed; prev.style.display = 'block'; }
            if(txt) txt.style.display = 'none';
            callback(compressed);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

export function setupDropZones() {
    setupGenericDrop('con-drop-zone', 'con-file', 'con-preview', 'con-drop-text', (res) => curConceptBaseImg = res);
    setupGenericDrop('pkg-drop-zone', 'pkg-file', 'pkg-preview', 'pkg-drop-text', (res) => curPkgImg = res);
}

export function fillVariationInputs(savedData = {}) {
    const container = document.getElementById('con-variations');
    if (!container) return;
    container.innerHTML = "";
    curVariantData = { ...savedData };

    const combinations = [
        {sz:'4oz', ld:false}, {sz:'4oz', ld:true},
        {sz:'7oz', ld:false}, {sz:'7oz', ld:true},
        {sz:'8oz', ld:false}, {sz:'8oz', ld:true},
        {sz:'12oz', ld:false}, {sz:'12oz', ld:true}
    ];
    
    combinations.forEach(combo => {
        const key = `${combo.sz}-${combo.ld?'lid':'nolid'}`;
        const data = curVariantData[key] || { img: "", stock: 100, price: 15.0 };
        // Eksik anahtarları varsayılan değerlerle başlat (kullanıcı dokunmasa bile kaydolsun)
        if (!curVariantData[key]) curVariantData[key] = { ...data };
        
        const div = document.createElement('div');
        div.className = "var-card";
        div.style.cssText = "background:white; padding:15px; border-radius:18px; border:1px solid #e2e8f0; display:flex; flex-direction:column; gap:10px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);";
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:13px; font-weight:800; color:var(--primary);">${combo.sz} ${combo.ld?'(Kapaklı)':'(Kapaksız)'}</span>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div style="display:flex; flex-direction:column; gap:3px;">
                    <label style="font-size:10px; font-weight:700; color:#64748b;">STOK</label>
                    <input type="number" value="${data.stock}" oninput="updateVarStock('${key}', this.value)" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:8px; font-size:12px; font-weight:700;">
                </div>
                <div style="display:flex; flex-direction:column; gap:3px;">
                    <label style="font-size:10px; font-weight:700; color:#d4af37;">FİYAT (₺)</label>
                    <input type="number" step="0.01" value="${data.price||15.0}" oninput="updateVarPrice('${key}', this.value)" style="width:100%; padding:8px; border:1px solid #d4af37; border-radius:8px; font-size:12px; font-weight:800; color:#b45309;">
                </div>
            </div>
            <div class="drop-zone" id="dz-${key}" style="height:80px; padding:5px; margin-bottom:0; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:10px;">
                <img id="prev-${key}" src="${data.img}" style="height:100%; display:${data.img?'block':'none'}; margin:0 auto;">
                <span id="txt-${key}" style="font-size:11px; display:${data.img?'none':'block'}; color:#94a3b8; font-weight:600;"><i class="fas fa-plus"></i> Görsel Ekle</span>
            </div>
            <input type="file" id="file-${key}" accept="image/*" style="display:none">
        `;
        container.appendChild(div);

        setTimeout(() => {
            setupGenericDrop(`dz-${key}`, `file-${key}`, `prev-${key}`, `txt-${key}`, (res) => {
                if(!curVariantData[key]) curVariantData[key] = { img: "", stock: 100, price: 15.0 };
                curVariantData[key].img = res;
            });
        }, 0);
    });
}

export function updateVarStock(key, val) {
    if(!curVariantData[key]) curVariantData[key] = { img: "", stock: 100, price: 15.0 };
    const parsed = parseInt(val);
    curVariantData[key].stock = isNaN(parsed) ? 0 : parsed;
}

export function updateVarPrice(key, val) {
    if(!curVariantData[key]) curVariantData[key] = { img: "", stock: 100, price: 0 };
    const parsed = parseFloat(String(val).replace(',', '.')); 
    curVariantData[key].price = isNaN(parsed) ? 0 : parsed;
}

export function openEditConcept(i) {
    Admin.editConIdx=i; const c = Admin.concepts[i];
    curConceptBaseImg = c.base_image || "";
    curVariantData = c.variations || {};

    document.getElementById('con-modal-title').innerText = "Konsepti Düzenle";
    document.getElementById('con-name').value = c.name || "";
    document.getElementById('con-name-en').value = c.name_en || "";
    document.getElementById('con-color').value = c.theme_color || "#e74c3c";
    document.getElementById('con-bg').value = c.bg_color || "#ffffff";
    document.getElementById('con-label').value = c.label_text || "";
    document.getElementById('con-price').value = c.price || '';
    document.getElementById('con-desc-tr').value = c.desc_tr || "";
    document.getElementById('con-desc-en').value = c.desc_en || "";
    document.getElementById('con-published').checked = c.published !== false;
    
    const prev = document.getElementById('con-preview');
    const txt = document.getElementById('con-drop-text');
    if(curConceptBaseImg) { prev.src = curConceptBaseImg; prev.style.display='block'; txt.style.display='none'; }
    else { prev.style.display='none'; txt.style.display='block'; }

    fillVariationInputs(curVariantData);
    document.getElementById('concept-modal').style.display='flex';
}

export function handleConceptSave() {
    const name = document.getElementById('con-name').value.trim();
    if(!name) return alert("Konsept adı (TR) gerekli!");
    const price = parseFloat(document.getElementById('con-price').value);
    if(isNaN(price) || price <= 0) return alert("Geçerli bir varsayılan fiyat girin!");

    // Mevcut kaydın korunması gereken alanları sakla (text_color gibi)
    const existing = Admin.editConIdx > -1 ? Admin.concepts[Admin.editConIdx] : {};
    const con = {
        ...existing,
        id: Admin.editConIdx > -1 ? existing.id : 'con-' + Date.now(),
        name,
        name_en: document.getElementById('con-name-en').value.trim() || name,
        theme_color: document.getElementById('con-color').value,
        bg_color: document.getElementById('con-bg').value,
        text_color: existing.text_color || '#1e293b',
        label_text: document.getElementById('con-label').value.trim(),
        price,
        desc_tr: document.getElementById('con-desc-tr').value.trim(),
        desc_en: document.getElementById('con-desc-en').value.trim(),
        published: document.getElementById('con-published').checked,
        base_image: curConceptBaseImg || existing.base_image || 'images/bardak.png',
        variations: curVariantData
    };
    if(Admin.editConIdx > -1) Admin.concepts[Admin.editConIdx] = con; else concepts.push(con);
    renderAll(); closeModal('concept-modal'); syncData('concepts');
}
