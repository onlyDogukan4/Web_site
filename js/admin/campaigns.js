import { Admin } from './state.js';
import { renderAll } from './core.js';
import { closeModal } from './modals.js';
import { syncData } from './orders.js';

export function openAddCampaign() {
    Admin.editCampaignIdx = -1;
    document.getElementById('c-modal-title').innerText = "Yeni Kampanya";
    document.getElementById('c-name').value = "";
    document.getElementById('c-theme').value = "premium";
    // Reset New Fields
    document.getElementById('c-top-text').value = "";
    document.getElementById('c-desc').value = "";
    document.getElementById('c-border-color').value = "#ffd700";
    document.getElementById('c-text-color').value = "#000000";
    
    updateCampaignPreview();
    document.getElementById('campaign-modal').style.display = 'flex';
}

export function updateCampaignPreview() {
     const top = document.getElementById('c-top-text').value;
     const desc = document.getElementById('c-desc').value;
     const border = document.getElementById('c-border-color').value;
     const text = document.getElementById('c-text-color').value;
     
     // Elements
     const tSpan = document.querySelector('#c-preview-top span');
     const bSpan = document.querySelector('#c-preview-bottom span');
     const dDiv = document.getElementById('c-preview-desc');
     
     // Update Top Badge
     if(top) {
         tSpan.parentElement.style.display = 'block';
         tSpan.innerText = top;
         tSpan.style.background = border;
         tSpan.style.color = text;
     } else {
         tSpan.parentElement.style.display = 'none';
     }

     // Bottom Badge removed from logic as it was removed from HTML
     const bBadge = document.getElementById('c-preview-bottom');
     if(bBadge) bBadge.style.display = 'none';
     
     // Update Description
     dDiv.innerText = desc;
}


export function handleCampaignSave() {
    const name = document.getElementById('c-name').value;
    const theme = document.getElementById('c-theme').value;
    // Get new fields
    const top_text = document.getElementById('c-top-text').value;
    const description = document.getElementById('c-desc').value;
    const border_color = document.getElementById('c-border-color').value;
    const text_color = document.getElementById('c-text-color').value;
    
    // New Campaign Type Logic
    const c_type = document.getElementById('c-type')?.value || 'percent'; // percent | buy_x_pay_y
    const c_buy = parseInt(document.getElementById('c-buy-x')?.value) || 0;
    const c_pay = parseInt(document.getElementById('c-pay-y')?.value) || 0;

    if(!name) return alert("Kampanya adı gerekli!");
    
    const cmp = { 
        id: Admin.editCampaignIdx > -1 ? Admin.campaigns[Admin.editCampaignIdx].id : 'c-'+Date.now(), 
        name, 
        theme,
        top_text,
        description,
        border_color,
        text_color,
        type: c_type,
        params: c_type === 'buy_x_pay_y' ? { buy: c_buy, pay: c_pay } : null
    };
    
    if(Admin.editCampaignIdx > -1) {
        Admin.campaigns[Admin.editCampaignIdx] = cmp;
    } else {
        Admin.campaigns.push(cmp);
    }
    
    renderAll();
    closeModal('campaign-modal');
    syncData('campaigns');
}

export function openEditCampaign(i) {
    const c = Admin.campaigns[i];
    if(!c) return;
    Admin.editCampaignIdx = i;
    document.getElementById('c-modal-title').innerText = "Kampanyayı Düzenle";
    document.getElementById('c-name').value = c.name || "";
    document.getElementById('c-theme').value = c.theme || "premium";
    document.getElementById('c-top-text').value = c.top_text || "";
    document.getElementById('c-desc').value = c.description || "";
    document.getElementById('c-border-color').value = c.border_color || "#ffd700";
    document.getElementById('c-text-color').value = c.text_color || "#000000";
    if(document.getElementById('c-type')) document.getElementById('c-type').value = c.type || "percent";
    if(document.getElementById('c-buy-x')) document.getElementById('c-buy-x').value = c.params?.buy || "";
    if(document.getElementById('c-pay-y')) document.getElementById('c-pay-y').value = c.params?.pay || "";
    updateCampaignPreview();
    document.getElementById('campaign-modal').style.display = 'flex';
}

export async function deleteCampaign(idx) {
    if(confirm("Bu kampanyayı silmek istediğine emin misin?")) {
        campaigns.splice(idx, 1);
        renderAll();
        await syncData('campaigns');
    }
}

export function renderCampaigns() {
    const tbody = document.getElementById('c-table');
    if(!tbody) return;
    tbody.innerHTML = Admin.campaigns.map((c, i) => `
        <tr>
            <td style="font-weight:700">${c.name}</td>
            <td style="color:var(--text-muted); font-size:13px;">${c.description || '-'}</td>
            <td style="text-align:right;">
                <button class="btn btn-secondary" style="padding:8px 12px; background:#3b82f6; color:white;" onclick="openEditCampaign(${i})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger" onclick="deleteCampaign(${i})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
    
    const pSelect = document.getElementById('p-campaign');
    if(pSelect) {
        let opts = '<option value="">Yok</option>'; // Changed from "Kampanya Yok" to "Yok" for consistency
        Admin.campaigns.forEach(c => {
            const sel = (Admin.curIdx > -1 && Admin.products[Admin.curIdx] && c.id === Admin.products[Admin.curIdx].campaign_id) ? 'selected' : '';
            opts += `<option value="${c.id}" ${sel}>${c.name}</option>`;
        });
        pSelect.innerHTML = opts;
    }
}



export function renderConcepts() {
    const tbody = document.getElementById('con-table');
    if(!tbody) return;
    tbody.innerHTML = (Admin.concepts || []).map((c, i) => {
        // Fiyat: varsayılan > varyasyonlardan ilki > 0
        const basePrice = parseFloat(c.price) > 0 ? parseFloat(c.price)
            : Object.values(c.variations || {}).map(v => parseFloat(v.price)).find(p => p > 0) || 0;
        const priceStr = basePrice > 0 ? `₺${basePrice.toLocaleString('tr-TR',{minimumFractionDigits:2})}` : '<span style="color:#ef4444;font-weight:700;">Fiyat YOK</span>';
        return `
        <tr>
            <td style="font-weight:700">
                <i class="fas fa-circle" style="color:${c.theme_color}; margin-right:5px;"></i> ${c.name}
            </td>
            <td><span class="status-badge" style="background:${c.published ? '#dcfce7':'#f1f5f9'}; color:${c.published ? '#166534':'#64748b'};">${c.published ? 'YAYINDA' : 'TASLAK'}</span></td>
            <td style="font-weight:700;">${priceStr}</td>
            <td style="color:var(--text-muted); font-size:12px;">${c.label_text || '-'}</td>
            <td style="text-align:right;">
                <button class="btn btn-secondary" style="padding:8px" onclick="openEditConcept(${i})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger" style="padding:8px" onclick="deleteConcept(${i})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
}

export function renderPackages() {
    const tbody = document.getElementById('pkg-table');
    if(!tbody) return;
    tbody.innerHTML = (Admin.packages || []).map((p, i) => `
        <tr>
            <td style="font-weight:700">${p.name}</td>
            <td><span class="status-badge" style="background:${p.published ? '#dcfce7':'#f1f5f9'}; color:${p.published ? '#166534':'#64748b'};">${p.published ? 'YAYINDA' : 'TASLAK'}</span></td>
            <td style="font-size:12px; color:var(--text-muted);">%${p.discount} İndirim</td>
            <td style="text-align:right;">
                <button class="btn btn-secondary" style="padding:8px" onclick="openEditPackage(${i})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger" style="padding:8px" onclick="deletePackage(${i})"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `).join('');
}

export async function deleteConcept(i) { if(confirm("Silmek istediğinize emin misiniz?")) { Admin.concepts.splice(i,1); renderAll(); await syncData('concepts'); } }
export async function deletePackage(i) { if(confirm("Silmek istediğinize emin misiniz?")) { Admin.packages.splice(i,1); renderAll(); await syncData('packages'); } }

// Global state for images and editing
let curConceptBaseImg = "";
let curPkgImg = "";
let curVariantData = {};
