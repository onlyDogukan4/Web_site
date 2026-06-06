import { Admin } from './state.js';

export function closeModal(id) { document.getElementById(id).style.display='none'; }

export function resetPModal() {
    document.getElementById('p-name-tr').value=''; 
    document.getElementById('p-name-en').value='';
    document.getElementById('p-price').value=''; 
    document.getElementById('p-desc-tr').value=''; 
    document.getElementById('p-preview').style.display='none';
    document.getElementById('p-drop-text').style.display='block';
}

// Drag & Drop Gelişmiş
const dz = document.getElementById('p-drop-zone'); 
const fi = document.getElementById('p-file');
dz.onclick = () => fi.click();
dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('hover'); };
dz.ondragleave = () => dz.classList.remove('hover');
dz.ondrop = (e) => {
    e.preventDefault(); dz.classList.remove('hover');
    const file = e.dataTransfer.files[0];
    if(file) loadImg(file);
};
fi.onchange = (e) => { if(fi.files[0]) loadImg(fi.files[0]); };

export function loadImg(file) {
    const r = new FileReader();
    r.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
            // KÖKTEN ÇÖZÜM: Fotoğrafı küçült ve sıkıştır (Vercel 4.5MB Limitini aşmamak için)
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const max = 800; // Maksimum 800px genişlik veya yükseklik

            if (width > height) {
                if (width > max) { height *= max / width; width = max; }
            } else {
                if (height > max) { width *= max / height; height = max; }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // 0.7 kalite ile JPEG olarak kaydet (Boyutu %90 azaltır)
            Admin.curImg = canvas.toDataURL('image/jpeg', 0.7);
            
            document.getElementById('p-preview').src = Admin.curImg; 
            document.getElementById('p-preview').style.display = 'block'; 
            document.getElementById('p-drop-text').style.display = 'none'; 
        };
        img.src = ev.target.result;
    };
    r.readAsDataURL(file);
}

// SyncData'yı güncelle
