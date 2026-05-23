import { Admin } from './state.js';

export function openAddPackage() {
    Admin.editPkgIdx=-1; curPkgImg=""; resetPkgModal();
    document.getElementById('package-modal').style.display='flex';
}
export function openEditPackage(i) {
    Admin.editPkgIdx=i; const p = Admin.packages[i];
    curPkgImg = p.image || "";
    document.getElementById('pkg-name').value = p.name || "";
    document.getElementById('pkg-items').value = p.items || "";
    document.getElementById('pkg-discount').value = p.discount || 0;
    document.getElementById('pkg-order').value = p.order || 0;
    document.getElementById('pkg-published').checked = p.published || false;
    
    const prev = document.getElementById('pkg-preview');
    const txt = document.getElementById('pkg-drop-text');
    if(curPkgImg) { prev.src = curPkgImg; prev.style.display='block'; txt.style.display='none'; }
    else { prev.style.display='none'; txt.style.display='block'; }

    document.getElementById('package-modal').style.display='flex';
}
export function handlePackageSave() {
    const pkg = {
        id: Admin.editPkgIdx>-1 ? Admin.packages[Admin.editPkgIdx].id : 'pkg-'+Date.now(),
        name: document.getElementById('pkg-name').value,
        items: document.getElementById('pkg-items').value,
        discount: parseInt(document.getElementById('pkg-discount').value)||0,
        order: parseInt(document.getElementById('pkg-order').value)||0,
        published: document.getElementById('pkg-published').checked,
        image: curPkgImg
    };
    if(!pkg.name || !pkg.items) return alert("Hata");
    if(Admin.editPkgIdx>-1) Admin.packages[Admin.editPkgIdx]=pkg; else packages.push(pkg);
    renderAll(); closeModal('package-modal'); syncData('packages');
}

export function resetConModal() {
    document.querySelectorAll('#concept-modal input[type="text"], #concept-modal input[type="number"]').forEach(e=>e.value='');
    document.querySelectorAll('#concept-modal textarea').forEach(e=>e.value='');
    document.getElementById('con-color').value = '#6366f1';
    document.getElementById('con-bg').value = '#f0f4ff';
    document.getElementById('con-published').checked = true;
    document.getElementById('con-preview').style.display='none';
    document.getElementById('con-drop-text').style.display='block';
    fillVariationInputs();
}
export function resetPkgModal() {
    document.querySelectorAll('#package-modal input').forEach(e=>e.value='');
    document.getElementById('pkg-preview').style.display='none';
    document.getElementById('pkg-drop-text').style.display='block';
}

// Initialize drag drops on load
document.addEventListener('DOMContentLoaded', () => {
    setupDropZones();
    loadPaymentLinks();
});
