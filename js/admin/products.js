import { Admin } from './state.js';
import { renderAll } from './core.js';
import { closeModal, resetPModal } from './modals.js';
import { syncData } from './orders.js';

export function openAddProduct() { 
    Admin.curIdx = -1; Admin.curImg = ""; 
    resetPModal(); 
    document.getElementById('p-modal-title').innerText = "Yeni Ürün Ekle"; 
    document.getElementById('product-modal').style.display = 'flex'; 
}

export function openAddConcept() {
    Admin.editConIdx=-1; curConceptBaseImg=""; curVariantData={};
    resetConModal(); 
    document.getElementById('con-modal-title').innerText = "Yeni Konsept Oluştur";
    document.getElementById('con-published').checked = true; // Default to published for new
    document.getElementById('concept-modal').style.display='flex'; 
}

export function openEditProduct(i) {
    Admin.curIdx = i; const p = Admin.products[i];
    document.getElementById('p-modal-title').innerText = "Ürünü Düzenle";
    document.getElementById('p-name-tr').value = p.name_tr || "";
    document.getElementById('p-name-en').value = p.name_en || "";
    document.getElementById('p-price').value = p.price || 0;
    document.getElementById('p-old-price').value = p.old_price || "";
    document.getElementById('p-rating').value = p.rating || "5.0";
    document.getElementById('p-status').value = p.status || "active";
    document.getElementById('p-campaign').value = p.campaign_id || "";
    
    document.getElementById('p-bulk-rate').value = p.bulk_rate || "";
    document.getElementById('p-bulk-threshold').value = p.bulk_threshold || "";
    document.getElementById('p-cross-rate').value = p.cross_rate || "";
    document.getElementById('p-cross-target').value = p.cross_target || "";
    
    document.getElementById('p-desc-tr').value = p.description_tr || "";
    // Gorsel mantigi
    Admin.curImg = p.image || "images/bardak.png"; 
    document.getElementById('p-preview').src = Admin.curImg; 
    document.getElementById('p-preview').style.display = 'block';
    document.getElementById('p-drop-text').style.display = 'none';

    document.getElementById('product-modal').style.display = 'flex';
}

export async function handleProductSave() {
    const p = {
        id: Admin.curIdx > -1 ? Admin.products[Admin.curIdx].id : Date.now().toString(),
        name_tr: document.getElementById('p-name-tr').value,
        name_en: document.getElementById('p-name-en').value,
        price: parseFloat(document.getElementById('p-price').value),
        old_price: parseFloat(document.getElementById('p-old-price').value) || null,
        image: Admin.curImg || "images/bardak.png",
        rating: document.getElementById('p-rating').value,
        status: document.getElementById('p-status').value,
        campaign_id: document.getElementById('p-campaign').value,
        
        bulk_rate: parseInt(document.getElementById('p-bulk-rate').value) || 0,
        bulk_threshold: parseInt(document.getElementById('p-bulk-threshold').value) || 0,
        cross_rate: parseInt(document.getElementById('p-cross-rate').value) || 0,
        cross_target: document.getElementById('p-cross-target').value || "",
        
        description_tr: document.getElementById('p-desc-tr').value
    };
    if(!p.name_tr || isNaN(p.price)) return alert("Lütfen Ürün Adı ve Fiyat girin!");
    if(Admin.curIdx > -1) Admin.products[Admin.curIdx] = p; else Admin.products.push(p);
    renderAll(); 
    closeModal('product-modal');
    await syncData('products'); 
}

export async function deleteProduct(i) { 
    if(confirm("Bu ürünü silmek istediğinize emin misiniz?")) { 
        Admin.products.splice(i, 1); 
        renderAll(); 
        await syncData('products');
    } 
}
