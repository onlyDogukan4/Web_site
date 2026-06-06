export function showVIPToast(itemName) {
    const existing = document.getElementById('vip-toast-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'vip-toast-overlay';
    overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 999999;
        display: flex; align-items: center; justify-content: center;
        pointer-events: none;
    `;

    overlay.innerHTML = `
        <div id="vip-toast-card" style="
            background: linear-gradient(145deg, #0f0c29, #1a1040, #24243e);
            border: 2px solid rgba(212,175,55,0.6);
            border-radius: 28px;
            padding: 40px 50px;
            text-align: center;
            box-shadow: 0 0 60px rgba(212,175,55,0.3), 0 30px 60px rgba(0,0,0,0.5);
            opacity: 0;
            transform: scale(0.8) translateY(30px);
            transition: all 0.5s cubic-bezier(0.34,1.56,0.64,1);
            min-width: 340px;
            max-width: 90vw;
            position: relative;
            overflow: hidden;
        ">
            <!-- Shimmer arka plan -->
            <div style="
                position: absolute; inset: 0;
                background: linear-gradient(105deg, transparent 40%, rgba(212,175,55,0.07) 50%, transparent 60%);
                animation: vip-shimmer 2.5s infinite;
                pointer-events: none;
            "></div>

            <!-- Köşe süsleme -->
            <div style="position:absolute;top:12px;left:18px;color:rgba(212,175,55,0.4);font-size:18px;">✦</div>
            <div style="position:absolute;top:12px;right:18px;color:rgba(212,175,55,0.4);font-size:18px;">✦</div>
            <div style="position:absolute;bottom:12px;left:18px;color:rgba(212,175,55,0.4);font-size:14px;">✦</div>
            <div style="position:absolute;bottom:12px;right:18px;color:rgba(212,175,55,0.4);font-size:14px;">✦</div>

            <!-- Crown ikonu -->
            <div style="
                width: 80px; height: 80px; border-radius: 50%;
                background: linear-gradient(135deg, #b8860b, #ffd700, #daa520);
                display: flex; align-items: center; justify-content: center;
                margin: 0 auto 20px;
                box-shadow: 0 0 30px rgba(212,175,55,0.5);
                animation: vip-pulse 1.5s ease-in-out infinite;
            ">
                <i class="fas fa-crown" style="color:#1a0e00; font-size:34px;"></i>
            </div>

            <!-- Başlık -->
            <div style="
                font-size: 11px; font-weight: 800; letter-spacing: 3px;
                color: #d4af37; margin-bottom: 10px; text-transform: uppercase;
            ">✦ VIP Premium Siparişe Eklendi ✦</div>

            <!-- Ürün adı -->
            <div style="
                font-size: 20px; font-weight: 900; color: white;
                margin-bottom: 8px; line-height: 1.3;
            ">${itemName}</div>

            <div style="
                font-size: 13px; color: rgba(212,175,55,0.8);
                font-style: italic; margin-bottom: 24px;
            ">Özel tasarımınız sepete eklendi</div>

            <!-- İlerleme çubuğu -->
            <div style="width:100%; height:3px; background:rgba(255,255,255,0.1); border-radius:10px; overflow:hidden;">
                <div id="vip-toast-bar" style="
                    height:100%;
                    background: linear-gradient(90deg, #b8860b, #ffd700);
                    width: 100%;
                    border-radius: 10px;
                    transition: width 3s linear;
                "></div>
            </div>
        </div>

        <style>
            @keyframes vip-shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
            }
            @keyframes vip-pulse {
                0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(212,175,55,0.5); }
                50% { transform: scale(1.08); box-shadow: 0 0 50px rgba(212,175,55,0.8); }
            }
        </style>
    `;

    document.body.appendChild(overlay);

    // Giriş animasyonu
    requestAnimationFrame(() => {
        const card = document.getElementById('vip-toast-card');
        if (card) {
            card.style.opacity = '1';
            card.style.transform = 'scale(1) translateY(0)';
        }
        // Progress bar'ı sıfırla
        setTimeout(() => {
            const bar = document.getElementById('vip-toast-bar');
            if (bar) bar.style.width = '0%';
        }, 100);
    });

    // Kapatma
    setTimeout(() => {
        const card = document.getElementById('vip-toast-card');
        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9) translateY(-20px)';
        }
        setTimeout(() => overlay.remove(), 500);
    }, 3200);
}