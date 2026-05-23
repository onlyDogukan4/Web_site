import { Admin } from './state.js';

export function checkLogin() { 
    if(document.getElementById('admin-pass').value === Admin.PASS) { 
        sessionStorage.setItem('adm_logged','1'); 
        document.getElementById('login-overlay').style.display='none'; 
        init(); 
    } else {
        alert("Hatalı şifre!");
    }
}

export function logout() { sessionStorage.removeItem('adm_logged'); location.reload(); }

if(sessionStorage.getItem('adm_logged')) { 
    document.getElementById('login-overlay').style.display='none'; 
    init(); 
}
