export function injectCartStyles() {
    if (document.getElementById('moderra-cart-styles')) return;
    const s = document.createElement('style');
    s.id = 'moderra-cart-styles';
    s.textContent = `
        .cart-item-card {
            background: white; border-radius: 18px; padding: 16px;
            margin-bottom: 12px; border: 1px solid #f1f5f9;
            transition: all 0.25s ease; position: relative; overflow: visible;
        }
        .cart-item-card:hover { border-color: #c7d2fe; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.06); }
        .qty-btn {
            background: #f1f5f9; border: none; border-radius: 7px; cursor: pointer;
            font-weight: 900; font-size: 15px; width: 26px; height: 26px;
            display: flex; align-items: center; justify-content: center;
            color: #1e293b; transition: all 0.2s;
        }
        .qty-btn:hover { background: var(--primary,#6366f1); color: white; }
        .trash-btn {
            background: none; border: none; cursor: pointer; font-size: 15px;
            margin-top: 8px; padding: 4px; border-radius: 6px; opacity: 0.5;
            transition: opacity 0.2s; display: block; margin-left: auto;
        }
        .trash-btn:hover { opacity: 1; }
        @keyframes shake {
            0%,100% { transform: rotate(0deg); }
            20%,60% { transform: rotate(-10deg); }
            40%,80% { transform: rotate(10deg); }
        }
        .shake { animation: shake 0.5s ease; }
    `;
    document.head.appendChild(s);
}