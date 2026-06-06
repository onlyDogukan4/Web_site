import { Admin } from './state.js';
import { init } from './core.js';

export function checkLogin() {
    const pass = document.getElementById('admin-pass')?.value ?? '';
    if (pass === Admin.PASS) {
        sessionStorage.setItem('adm_logged', '1');
        document.getElementById('login-overlay').style.display = 'none';
        init();
    } else {
        alert('Hatalı şifre!');
    }
}

export function logout() {
    sessionStorage.removeItem('adm_logged');
    location.reload();
}
