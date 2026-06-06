(()=>{var w=JSON.parse(localStorage.getItem("cart")||"[]").map(t=>({...t,price:isNaN(parseFloat(t.price))||parseFloat(t.price)<=0?15:parseFloat(t.price)}));function c(){return w}function T(t){w=t,h()}function h(){localStorage.setItem("cart",JSON.stringify(w))}function u(){try{let t=localStorage.getItem("moderra_settings")||localStorage.getItem("settings");if(t)return JSON.parse(t)}catch{}return{minOrder:500,freeShipping:1e3}}async function E(){try{let t=await fetch("/api/settings?t="+Date.now());if(t.ok){let i=await t.json();localStorage.setItem("moderra_settings",JSON.stringify(i)),typeof updateCartDisplay=="function"&&updateCartDisplay()}}catch(t){console.warn("Ayarlar sunucudan al\u0131namad\u0131:",t)}}function v(){let t=0,i=0;w.forEach(r=>{let n=parseFloat(r.price)||0;if(r.isPackage&&Array.isArray(r.packageItems)){let s=r.packageItems.reduce((o,d)=>o+(parseFloat(d.price)||0)*(d.quantity||1),0);t+=s*(r.quantity||1),i+=s*(r.quantity||1)*((parseFloat(r.discount)||0)/100)}else t+=n*(r.quantity||1)});let e=Math.max(0,t-i);return{subTotal:t,discountTotal:i,total:e}}function k(t){let{freeShipping:i}=u();return t<i?150:0}var q=.2;function g(t){return`\u20BA${parseFloat(t).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})}`}function R(){let{subTotal:t,discountTotal:i,total:e}=v(),r=k(e),n=e+r,s=n-n/(1+q);return{subTotal:t,discountTotal:i,productTotal:e,shipping:r,grandTotal:n,kdvAmount:Math.round(s*100)/100,kdvRatePercent:Math.round(q*100),freeShippingLimit:u().freeShipping}}function F(){if(document.getElementById("moderra-cart-styles"))return;let t=document.createElement("style");t.id="moderra-cart-styles",t.textContent=`
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
        .qty-ctrl span, .qty-value {
            font-weight: 900;
            font-size: 14px;
            min-width: 24px;
            text-align: center;
            color: #1e293b;
            line-height: 1;
        }
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
    `,document.head.appendChild(t)}function m(){let t=document.getElementById("cart-items-list"),i=document.getElementById("cart-count");if(!t)return;let{minOrder:e,freeShipping:r}=u(),{subTotal:n,discountTotal:s,total:o}=v(),d=document.getElementById("cart-progress-sticky");if(d)if(o===0)d.innerHTML="";else if(o<e){let a=Math.min(o/e*100,100);d.innerHTML=`
                <div style="padding:14px 20px;background:linear-gradient(135deg,#fff1f2,#ffe4e6);border-bottom:1px solid #fecdd3;">
                    <div style="font-size:12px;color:#9f1239;font-weight:800;display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span>\u26A0\uFE0F Minimum sipari\u015F i\xE7in eksik</span>
                        <span>\u20BA${(e-o).toLocaleString("tr-TR")}</span>
                    </div>
                    <div style="width:100%;height:6px;background:#fecdd3;border-radius:10px;overflow:hidden;">
                        <div style="width:${a}%;height:100%;background:linear-gradient(90deg,#f43f5e,#e11d48);border-radius:10px;transition:width 0.5s;"></div>
                    </div>
                </div>`}else if(o<r){let a=Math.min(o/r*100,100);d.innerHTML=`
                <div style="padding:14px 20px;background:linear-gradient(135deg,#fefce8,#fef9c3);border-bottom:1px solid #fde047;">
                    <div style="font-size:12px;color:#854d0e;font-weight:800;display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span>\u{1F680} \xDCcretsiz kargo i\xE7in eksik</span>
                        <span>\u20BA${(r-o).toLocaleString("tr-TR")}</span>
                    </div>
                    <div style="width:100%;height:6px;background:rgba(0,0,0,0.1);border-radius:10px;overflow:hidden;">
                        <div style="width:${a}%;height:100%;background:linear-gradient(90deg,#f59e0b,#d97706);border-radius:10px;transition:width 0.5s;"></div>
                    </div>
                </div>`}else d.innerHTML=`
                <div style="padding:14px 20px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-bottom:1px solid #bbf7d0;text-align:center;">
                    <span style="font-size:14px;color:#166534;font-weight:900;">\u{1F389} KARGO B\u0130ZDEN! \xDCcretsiz teslimat kazand\u0131n\u0131z.</span>
                </div>`;if(t.innerHTML="",c().length===0){t.innerHTML=`
            <div style="text-align:center;padding:80px 20px;color:#cbd5e1;">
                <div style="font-size:60px;margin-bottom:16px;">\u{1F6D2}</div>
                <p style="font-weight:800;font-size:15px;color:#94a3b8;">Sepetiniz bo\u015F</p>
                <p style="font-size:13px;color:#cbd5e1;margin-top:6px;">\xDCr\xFCnleri ke\u015Ffetmek i\xE7in al\u0131\u015Fveri\u015Fe ba\u015Flay\u0131n</p>
            </div>`,i&&(i.style.display="none"),P(0,0,0);return}c().forEach(a=>{let l=document.createElement("div");if(l.dataset.cartItemId=a.id,a.isPackage){l.className="cart-item-card";let x=a.packageItems.reduce((f,y)=>f+parseFloat(y.price)*y.quantity,0)*(1-(a.discount||0)/100)*a.quantity;l.innerHTML=`
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;">
                    <div style="display:flex;gap:12px;flex:1;">
                        <img src="${a.image||"images/bardak.png"}" style="width:64px;height:64px;object-fit:contain;border-radius:12px;background:#f8fafc;padding:6px;border:1px solid #e2e8f0;flex-shrink:0;" loading="lazy">
                        <div>
                            <div style="font-weight:900;font-size:14px;color:#1e293b;line-height:1.3;">${a.name}</div>
                            <div style="font-size:11px;color:#64748b;margin-top:3px;">${a.packageItems?a.packageItems.length+" \xFCr\xFCn":""} \xB7 %${a.discount||0} indirim</div>
                            <div class="qty-ctrl" style="margin-top:10px;display:inline-flex;align-items:center;gap:8px;background:#f8fafc;border-radius:10px;padding:3px 8px;border:1px solid #e2e8f0;">
                                <button class="qty-btn" onclick="updateItemQuantity('${a.id}',-1)">\u2212</button>
                                <span class="qty-value" style="font-weight:900;font-size:14px;min-width:24px;text-align:center;color:#1e293b;">${a.quantity}</span>
                                <button class="qty-btn" onclick="updateItemQuantity('${a.id}',1)">+</button>
                            </div>
                        </div>
                    </div>
                    <div style="text-align:right;flex-shrink:0;">
                        <div style="font-size:17px;font-weight:900;color:var(--primary);">\u20BA${x.toLocaleString("tr-TR",{minimumFractionDigits:2})}</div>
                        <button onclick="removeFromCart('${a.id}')" class="trash-btn">\u{1F5D1}</button>
                    </div>
                </div>`}else if(a.isConcept){let x=(parseFloat(a.price)||0)*(a.quantity||1);l.style.cssText=`
                background: linear-gradient(145deg, #fffdf5, #fef9e7);
                border-radius: 20px;
                margin-bottom: 14px;
                border: 2px solid transparent;
                background-clip: padding-box;
                position: relative;
                overflow: visible;
                box-shadow: 0 8px 32px rgba(212,175,55,0.2);
            `,l.style.background="linear-gradient(145deg, #fffdf5, #fef9e7)",l.style.outline="2px solid #d4af37",l.style.outlineOffset="0px",l.style.borderRadius="20px",l.style.marginBottom="14px",l.style.position="relative",l.style.overflow="visible",l.style.boxShadow="0 8px 32px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.8)";let f=a.logo&&a.logo.startsWith("data:application/pdf"),y=a.logo?`<div style="margin-top:10px;">
                    <div style="font-size:10px;font-weight:800;color:#b8860b;margin-bottom:4px;text-transform:uppercase;"><i class="fas fa-check-circle" style="color:#22c55e;"></i> Y\xFCklenen Dosya:</div>
                    ${f?`<div style="display:flex;align-items:center;gap:6px;background:rgba(239,68,68,0.1);border-radius:8px;padding:6px 10px;border:1px solid rgba(239,68,68,0.3);">
                               <i class="fas fa-file-pdf" style="color:#ef4444;font-size:18px;"></i>
                               <span style="font-size:11px;color:#d4af37;word-break:break-all;">${a.logoName||"logo.pdf"}</span>
                           </div>`:`<img src="${a.logo}" style="max-width:80px;max-height:50px;object-fit:contain;border-radius:8px;border:1px solid rgba(212,175,55,0.3);">`}
                   </div>`:'<div style="margin-top:8px;font-size:10px;color:#d4af37;font-style:italic;"><i class="fas fa-upload"></i> Logo hen\xFCz y\xFCklenmedi</div>';l.innerHTML=`
                <!-- VIP Ba\u015Fl\u0131k \u015Eeridi \u2014 Her zaman g\xF6r\xFCn\xFCr, ta\u015Fmaz -->
                <div style="
                    background: linear-gradient(90deg, #b8860b, #daa520, #ffd700, #daa520, #b8860b);
                    border-radius: 16px 16px 0 0;
                    padding: 8px 16px;
                    display: flex; align-items: center; gap: 8px;
                    margin: -2px -2px 0 -2px;
                ">
                    <i class="fas fa-crown" style="color:#1a0e00;font-size:14px;"></i>
                    <span style="font-size:10px;font-weight:900;letter-spacing:2px;color:#1a0e00;text-transform:uppercase;">VIP Premium \xD6zel Sipari\u015F</span>
                    <span style="margin-left:auto;font-size:10px;color:rgba(26,14,0,0.7);">\u2726</span>
                </div>

                <!-- \u0130\xE7erik -->
                <div style="padding:14px 16px 16px;">
                    <div style="display:flex;align-items:flex-start;gap:14px;">
                        <!-- \xDCr\xFCn g\xF6rseli -->
                        <div style="
                            width:72px;height:72px;border-radius:14px;
                            background:linear-gradient(135deg,#fffbeb,#fef3c7);
                            border:2px solid rgba(212,175,55,0.4);
                            display:flex;align-items:center;justify-content:center;
                            overflow:hidden;flex-shrink:0;
                        ">
                            <img src="${a.image||"images/bardak.png"}" style="width:100%;height:100%;object-fit:contain;padding:6px;" loading="lazy">
                        </div>

                        <!-- Bilgiler -->
                        <div style="flex:1;min-width:0;">
                            <div style="font-weight:900;font-size:15px;color:#1a1a1a;margin-bottom:4px;line-height:1.3;">${a.name}</div>

                            ${a.note?`
                            <div style="
                                font-size:11px;color:#7c5f00;background:#fffbeb;
                                padding:6px 10px;border-radius:8px;margin-bottom:8px;
                                border-left:3px solid #d4af37;font-style:italic;
                            ">"${a.note}"</div>`:""}

                            ${y}

                            <!-- Adet kontrol\xFC -->
                            <div style="
                                display:inline-flex;align-items:center;gap:8px;
                                background:#fffbeb;border-radius:10px;padding:4px 10px;
                                border:1px solid rgba(212,175,55,0.4);margin-top:10px;
                            ">
                                <button class="qty-btn" onclick="updateItemQuantity('${a.id}',-1)" style="background:rgba(212,175,55,0.2);">\u2212</button>
                                <span style="font-weight:900;font-size:15px;min-width:24px;text-align:center;color:#b8860b;">${a.quantity}</span>
                                <button class="qty-btn" onclick="updateItemQuantity('${a.id}',1)" style="background:rgba(212,175,55,0.2);">+</button>
                            </div>
                        </div>

                        <!-- Fiyat + Sil -->
                        <div style="text-align:right;flex-shrink:0;">
                            <div style="
                                font-size:20px;font-weight:900;
                                background:linear-gradient(135deg,#b8860b,#d4af37);
                                -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                                background-clip:text;
                            ">\u20BA${x.toLocaleString("tr-TR",{minimumFractionDigits:2})}</div>
                            <div style="font-size:10px;color:#b8860b;margin-top:2px;">adet ba\u015F\u0131na</div>
                            <button onclick="removeFromCart('${a.id}')" style="
                                background:none;border:none;cursor:pointer;font-size:16px;
                                opacity:0.5;transition:opacity 0.2s;display:block;margin:8px 0 0 auto;
                            " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.5'">\u{1F5D1}</button>
                        </div>
                    </div>
                </div>`}else{l.className="cart-item-card";let x=parseFloat(a.price)*a.quantity;l.innerHTML=`
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
                    <div style="display:flex;align-items:center;gap:12px;flex:1;">
                        <img src="${a.image||"images/bardak.png"}" style="width:64px;height:64px;object-fit:contain;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;padding:6px;flex-shrink:0;" loading="lazy">
                        <div style="flex:1;min-width:0;">
                            <div style="font-weight:800;font-size:14px;color:#1e293b;line-height:1.3;margin-bottom:8px;">${a.name}</div>
                            <div class="qty-ctrl" style="display:inline-flex;align-items:center;gap:8px;background:#f8fafc;border-radius:10px;padding:3px 8px;border:1px solid #e2e8f0;">
                                <button class="qty-btn" onclick="updateItemQuantity('${a.id}',-1)">\u2212</button>
                                <span class="qty-value" style="font-weight:900;font-size:14px;min-width:24px;text-align:center;color:#1e293b;">${a.quantity}</span>
                                <button class="qty-btn" onclick="updateItemQuantity('${a.id}',1)">+</button>
                            </div>
                        </div>
                    </div>
                    <div style="text-align:right;flex-shrink:0;">
                        <div style="font-size:17px;font-weight:900;color:var(--primary);">\u20BA${x.toLocaleString("tr-TR",{minimumFractionDigits:2})}</div>
                        <button onclick="removeFromCart('${a.id}')" class="trash-btn">\u{1F5D1}</button>
                    </div>
                </div>`}t.appendChild(l)}),P(n,s,o);let p=c().reduce((a,l)=>a+l.quantity,0);i&&(i.textContent=p,i.style.display=p>0?"flex":"none")}function P(t,i,e){let r=document.getElementById("cart-total-price-area");if(!r)return;let n=k(e),s=e+n,o=Math.round((s-s/1.2)*100)/100;r.innerHTML=`
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#64748b;font-size:13px;">
            <span>\xDCr\xFCnler (ara toplam)</span>
            <span>\u20BA${t.toLocaleString("tr-TR",{minimumFractionDigits:2})}</span>
        </div>
        ${i>0?`
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#16a34a;font-size:13px;font-weight:700;">
            <span>\u{1F381} \u0130ndirim</span>
            <span>\u2212\u20BA${i.toLocaleString("tr-TR",{minimumFractionDigits:2})}</span>
        </div>`:""}
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#475569;font-size:13px;">
            <span>\xDCr\xFCn tutar\u0131</span>
            <span>\u20BA${e.toLocaleString("tr-TR",{minimumFractionDigits:2})}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:${n>0?"#dc2626":"#16a34a"};font-size:13px;font-weight:700;">
            <span>${n>0?"\u{1F69A} Kargo":"\u{1F389} Kargo (\xDCcretsiz)"}</span>
            <span>${n>0?"\u20BA"+n.toLocaleString("tr-TR"):"\xDCcretsiz"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#64748b;font-size:11px;">
            <span>KDV (%20, dahil)</span>
            <span>\u20BA${o.toLocaleString("tr-TR",{minimumFractionDigits:2})}</span>
        </div>
            <div style="display:flex;justify-content:space-between;color:var(--primary);font-weight:900;font-size:18px;margin-top:10px;padding-top:10px;border-top:2px solid #f1f5f9;">
                <span>\xD6DENECEK TOPLAM</span>
                <span style="font-weight:900;font-size:22px;color:var(--primary);">\u20BA${s.toLocaleString("tr-TR",{minimumFractionDigits:2})}</span>
            </div>
            ${e>0?`<div id="checkout-options">
                <button type="button" onclick="whatsappCheckout()">
                    <i class="fab fa-whatsapp" aria-hidden="true"></i>
                    <span>WhatsApp</span>
                </button>
                <button type="button" onclick="payWithPayTR()">
                    <i class="fas fa-credit-card" aria-hidden="true"></i>
                    <span>Kredi Kart\u0131</span>
                </button>
            </div>`:""}
`}function j(){window.addEventListener("storage",t=>{t.key==="cart"&&(T(JSON.parse(t.newValue||"[]")),m())})}function z(t){if(!t)return;let i=document.getElementById("open-cart-modal");if(!i)return;let e=t.cloneNode(!0),r=t.getBoundingClientRect(),n=i.getBoundingClientRect();Object.assign(e.style,{position:"fixed",left:r.left+"px",top:r.top+"px",width:"80px",height:"80px",zIndex:"100000",pointerEvents:"none",transition:"all 0.75s cubic-bezier(0.19, 1, 0.22, 1)",borderRadius:"12px",objectFit:"contain"}),document.body.appendChild(e),requestAnimationFrame(()=>{e.style.transform=`translate(${n.left-r.left}px, ${n.top-r.top}px) scale(0.1)`,e.style.opacity="0.4"}),setTimeout(()=>{e.remove(),i.classList.add("shake"),setTimeout(()=>i.classList.remove("shake"),500)},750)}function C(t){let i=document.getElementById("vip-toast-overlay");i&&i.remove();let e=document.createElement("div");e.id="vip-toast-overlay",e.style.cssText=`
        position: fixed; inset: 0; z-index: 999999;
        display: flex; align-items: center; justify-content: center;
        pointer-events: none;
    `,e.innerHTML=`
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

            <!-- K\xF6\u015Fe s\xFCsleme -->
            <div style="position:absolute;top:12px;left:18px;color:rgba(212,175,55,0.4);font-size:18px;">\u2726</div>
            <div style="position:absolute;top:12px;right:18px;color:rgba(212,175,55,0.4);font-size:18px;">\u2726</div>
            <div style="position:absolute;bottom:12px;left:18px;color:rgba(212,175,55,0.4);font-size:14px;">\u2726</div>
            <div style="position:absolute;bottom:12px;right:18px;color:rgba(212,175,55,0.4);font-size:14px;">\u2726</div>

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

            <!-- Ba\u015Fl\u0131k -->
            <div style="
                font-size: 11px; font-weight: 800; letter-spacing: 3px;
                color: #d4af37; margin-bottom: 10px; text-transform: uppercase;
            ">\u2726 VIP Premium Sipari\u015Fe Eklendi \u2726</div>

            <!-- \xDCr\xFCn ad\u0131 -->
            <div style="
                font-size: 20px; font-weight: 900; color: white;
                margin-bottom: 8px; line-height: 1.3;
            ">${t}</div>

            <div style="
                font-size: 13px; color: rgba(212,175,55,0.8);
                font-style: italic; margin-bottom: 24px;
            ">\xD6zel tasar\u0131m\u0131n\u0131z sepete eklendi</div>

            <!-- \u0130lerleme \xE7ubu\u011Fu -->
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
    `,document.body.appendChild(e),requestAnimationFrame(()=>{let r=document.getElementById("vip-toast-card");r&&(r.style.opacity="1",r.style.transform="scale(1) translateY(0)"),setTimeout(()=>{let n=document.getElementById("vip-toast-bar");n&&(n.style.width="0%")},100)}),setTimeout(()=>{let r=document.getElementById("vip-toast-card");r&&(r.style.opacity="0",r.style.transform="scale(0.9) translateY(-20px)"),setTimeout(()=>e.remove(),500)},3200)}function M(t,i,e,r=!1){let n=t;typeof t=="string"||typeof t=="number"?n={id:String(t),name:i,price:parseFloat(e),quantity:1,isConcept:r}:(n={...n},r&&(n.isConcept=!0),n.quantity||(n.quantity=1));let s=c().find(o=>o.id===n.id);s?s.quantity+=n.quantity||1:c().push(n),h(),m(),n.isConcept&&typeof C=="function"&&C(n.name)}async function B(t){try{let[i,e]=await Promise.all([fetch("/api/packages"),fetch("/api/products")]),r=await i.json(),n=await e.json(),s=r.find(f=>String(f.id)===String(t));if(!s)return;let d=(s.items||"").split(",").map(f=>f.trim()).filter(Boolean).reduce((f,y)=>{let b=n.find(S=>String(S.id)===y);if(b){let S=(window.onCardQuantities||{})[`${t}-${b.id}`]||1;f.push({id:b.id,name:b.name_tr,price:b.price,image:b.image,quantity:S})}return f},[]),p=document.querySelector(`button[onclick*="addPackageToCart('${t}')"]`)?.closest(".package-card"),a=p?p.querySelector("img"):null;a&&z(a);let l=c().findIndex(f=>String(f.id)===String(s.id)),x=(s.name||"").toLowerCase().includes("s\xFCper");l>-1?x?(c()[l].packageItems=d,c()[l].quantity=1):c()[l].quantity++:c().push({id:String(s.id),name:s.name,image:s.image||"images/bardak.png",discount:s.discount||0,quantity:1,isPackage:!0,packageItems:d}),h(),setTimeout(()=>{m(),document.body.classList.add("cart-open")},800)}catch(i){console.error("addPackageToCart hatas\u0131:",i)}}function L(t){T(c().filter(i=>i.id!==t)),m()}function D(t,i){let e=c().find(r=>r.id===t);e&&(e.quantity=Math.max(0,e.quantity+i),e.quantity===0?L(t):(h(),m()))}function _(){let{minOrder:t}=u(),{total:i}=v();if(i<t){alert(`Minimum sipari\u015F tutar\u0131 \u20BA${t.toLocaleString("tr-TR")} TL'dir.`);return}let e=JSON.parse(localStorage.getItem("moderra_user_data")||"{}");if(!e.name||!e.phone||!e.address){alert("L\xFCtfen sipari\u015F i\xE7in profil bilgilerinizi doldurun.");let o=document.getElementById("profile-modal");o&&(o.style.display="block");return}let r=k(i),n=i+r,s=`*Moderra \u2014 Yeni Sipari\u015F*

`;c().forEach(o=>{let d=o.quantity||1,p=o.isPackage?o.packageItems.reduce((a,l)=>a+(parseFloat(l.price)||0)*(l.quantity||1),0)*(1-(parseFloat(o.discount)||0)/100)*d:(parseFloat(o.price)||0)*d;s+=`\u{1F4E6} ${o.quantity}\xD7 ${o.name} \u2014 \u20BA${p.toLocaleString("tr-TR",{minimumFractionDigits:2})}
`,o.note&&(s+=`   \u2514 \u{1F4DD} Not: ${o.note}
`),o.isConcept&&(s+=`   \u2514 \u{1F451} VIP Premium \xD6zel Tasar\u0131m
`),o.logo&&(s+=`   \u2514 \u{1F5BC}\uFE0F Logo y\xFCklendi (WhatsApp \xFCzerinden iletilecek)
`)}),r>0&&(s+=`
\u{1F69A} Kargo: \u20BA${r.toLocaleString("tr-TR")}
`),s+=`
*\u{1F4B0} Toplam: \u20BA${n.toLocaleString("tr-TR",{minimumFractionDigits:2})}*

`,s+=`\u{1F464} ${e.name}
\u{1F4DE} ${e.phone}
\u{1F3E0} ${e.address}`,window.open(`https://wa.me/905304640120?text=${encodeURIComponent(s)}`,"_blank")}function H(t,{compact:i=!1}={}){return`
        <div class="pay-breakdown" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:${i?"10px 12px":"14px 16px"};font-size:${i?"12px":"13px"};">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#64748b;">
                <span>\xDCr\xFCnler (ara toplam)</span>
                <span>${g(t.subTotal)}</span>
            </div>
            ${t.discountTotal>0?`<div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#16a34a;font-weight:700;">
                <span>\u0130ndirim</span><span>\u2212${g(t.discountTotal)}</span>
            </div>`:""}
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#475569;">
                <span>\xDCr\xFCn tutar\u0131</span>
                <span>${g(t.productTotal)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:${t.shipping>0?"#dc2626":"#16a34a"};font-weight:700;">
                <span>${t.shipping>0?"Kargo":"Kargo (\xFCcretsiz)"}</span>
                <span>${t.shipping>0?g(t.shipping):"\xDCcretsiz"}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#64748b;font-size:11px;">
                <span>KDV (%${t.kdvRatePercent}, dahil)</span>
                <span>${g(t.kdvAmount)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding-top:8px;margin-top:6px;border-top:2px solid #e2e8f0;font-weight:900;font-size:${i?"15px":"17px"};color:#4338ca;">
                <span>\xD6denecek tutar</span>
                <span>${g(t.grandTotal)}</span>
            </div>
            ${t.shipping>0&&t.freeShippingLimit?`<p style="margin:8px 0 0;font-size:10px;color:#94a3b8;">\u20BA${t.freeShippingLimit.toLocaleString("tr-TR")} \xFCzeri sipari\u015Flerde kargo \xFCcretsiz.</p>`:""}
        </div>`}async function K(t,i,e,r){i.innerHTML='<p style="text-align:center;color:#64748b;font-size:12px;padding:12px;"><i class="fas fa-spinner fa-spin"></i> Taksit oranlar\u0131 y\xFCkleniyor\u2026</p>';try{let n=await fetch(`/api/paytr-installments?amount=${encodeURIComponent(t)}`),s=await n.json();if(!n.ok||!s.plans?.length)throw new Error(s.error||"Oran al\u0131namad\u0131");let o=`<p style="margin:0 0 10px;font-size:11px;color:#64748b;line-height:1.4;">
            <i class="fas fa-info-circle"></i> ${g(t)} i\xE7in g\xFCncel taksit se\xE7enekleri (PayTR). Kart\u0131n\u0131z\u0131 girdi\u011Finizde iframe i\xE7inde de g\xFCncel taksitler g\xF6r\xFCn\xFCr.
        </p>`;for(let d of s.plans.slice(0,6)){o+=`<div style="margin-bottom:12px;background:#fafafa;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                <div style="padding:8px 10px;background:linear-gradient(135deg,#eef2ff,#f8fafc);font-weight:800;font-size:11px;color:#4338ca;text-transform:uppercase;">${d.label}</div>
                <div style="padding:8px;display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">`;for(let p of d.options)o+=`<div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:8px;text-align:center;">
                    <div style="font-size:10px;color:#94a3b8;">${p.count} Taksit</div>
                    <div style="font-size:13px;font-weight:900;color:#1e293b;">${g(p.monthly)}</div>
                    <div style="font-size:9px;color:#64748b;">/ ay \xB7 toplam ${g(p.total)}</div>
                </div>`;o+="</div></div>"}i.innerHTML=o}catch(n){console.warn("Taksit API:",n),i.innerHTML='<p style="font-size:11px;color:#94a3b8;">Taksit tablosu y\xFCklenemedi. Kart bilgilerinizi girdi\u011Finizde PayTR ekran\u0131nda taksit se\xE7enekleri g\xF6r\xFCnecektir.</p>'}if(e&&r&&!String(e).startsWith("mock_")){let n=document.createElement("script"),s=Math.round(t);n.src=`https://www.paytr.com/odeme/taksit-tablosu/v2?token=${encodeURIComponent(e)}&merchant_id=${encodeURIComponent(r)}&amount=${s}&taksit=12&tumu=1`,n.onload=()=>{let o=document.getElementById("paytr_taksit_tablosu_widget");o&&o.innerHTML.trim()&&(i.insertAdjacentHTML("beforeend",'<p style="margin:12px 0 6px;font-size:10px;font-weight:800;color:#4338ca;">PayTR resmi taksit tablosu</p><div id="paytr_taksit_tablosu_widget_wrap"></div>'),document.getElementById("paytr_taksit_tablosu_widget_wrap")?.appendChild(o))},document.body.appendChild(n)}}async function A(){let t=R(),{minOrder:i}=u();if(t.productTotal<i){alert(`Minimum sipari\u015F tutar\u0131 \u20BA${i.toLocaleString("tr-TR")} TL'dir.`);return}let e=JSON.parse(localStorage.getItem("moderra_user_data")||"{}");if(!e.name||!e.phone||!e.address){alert("L\xFCtfen \xF6deme i\xE7in profil bilgilerinizi doldurun.");let o=document.getElementById("profile-modal");o&&(o.style.display="block");return}if(!await new Promise(o=>{let d=document.createElement("div");d.style.cssText="position:fixed;inset:0;background:rgba(15,23,42,0.7);backdrop-filter:blur(8px);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;",d.innerHTML=`
            <div style="background:white;border-radius:24px;padding:0;max-width:520px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 25px 60px rgba(0,0,0,0.3);">
                <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:22px 24px;color:white;">
                    <h3 style="margin:0;font-size:17px;font-weight:900;">\xD6deme \xD6zeti</h3>
                    <p style="margin:6px 0 0;font-size:12px;opacity:0.85;">Tutar d\xF6k\xFCm\xFCn\xFC kontrol edin</p>
                </div>
                <div style="padding:20px 24px;display:flex;flex-direction:column;gap:14px;">
                    ${H(t,{compact:!0})}
                    <div style="background:#f8fafc;border-radius:14px;padding:14px;font-size:13px;color:#334155;line-height:1.5;">
                        <b>${e.name}</b><br>
                        ${e.phone}<br>
                        <span style="color:#64748b;">${e.address}</span>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                        <button type="button" id="conf-edit-btn" style="padding:14px;border-radius:12px;border:2px solid #e2e8f0;background:white;cursor:pointer;font-weight:700;">D\xFCzenle</button>
                        <button type="button" id="conf-ok-btn" style="padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#4f46e5,#7c3aed);cursor:pointer;font-weight:900;color:white;">Onayla ve \xD6de</button>
                    </div>
                </div>
            </div>`,document.body.appendChild(d),d.querySelector("#conf-ok-btn").onclick=()=>{d.remove(),o(!0)},d.querySelector("#conf-edit-btn").onclick=()=>{d.remove(),document.getElementById("profile-modal").style.display="block",o(!1)},d.addEventListener("click",p=>{p.target===d&&(d.remove(),o(!1))})}))return;let n=document.querySelector('button[onclick="payWithPayTR()"]'),s=n?.innerHTML;n&&(n.disabled=!0,n.innerHTML='<span class="loading-spinner"></span> BEKLEY\u0130N...');try{let d=await(await fetch("/api/paytr-token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({cart:c(),user:e,totalAmount:t.grandTotal})})).json();if(!d.token){alert("\xD6deme ba\u015Flat\u0131lamad\u0131: "+(d.error||"Bilinmeyen hata"));return}document.getElementById("paytr-modal")?.remove();let p=document.createElement("div");if(p.id="paytr-modal",p.style.cssText="position:fixed;inset:0;background:rgba(15,23,42,0.92);backdrop-filter:blur(20px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:10px;",p.innerHTML=`
            <div class="paytr-shell" style="width:100%;max-width:1200px;background:#f8fafc;border-radius:28px;overflow:hidden;height:min(95vh,900px);display:flex;flex-direction:column;box-shadow:0 40px 80px rgba(0,0,0,0.5);">
                <div class="paytr-head" style="padding:16px 22px;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#1e293b,#334155);flex-shrink:0;gap:12px;">
                    <div style="display:flex;align-items:center;gap:12px;min-width:0;">
                        <div style="width:42px;height:42px;background:rgba(16,185,129,0.15);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                            <i class="fas fa-shield-halved" style="color:#10b981;font-size:18px;"></i>
                        </div>
                        <div style="min-width:0;">
                            <h3 style="margin:0;color:white;font-size:16px;font-weight:900;">G\xFCvenli \xD6deme</h3>
                            <p style="margin:2px 0 0;font-size:11px;color:#94a3b8;">PayTR \xB7 SSL</p>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:16px;flex-shrink:0;">
                        <div class="paytr-head-total" style="text-align:right;">
                            <p style="margin:0;font-size:10px;color:#94a3b8;">Toplam</p>
                            <p style="margin:0;font-size:20px;font-weight:900;color:#10b981;">${g(t.grandTotal)}</p>
                        </div>
                        <button type="button" id="paytr-modal-close" style="background:rgba(255,255,255,0.1);border:none;width:38px;height:38px;border-radius:50%;font-size:22px;cursor:pointer;color:#fff;">&times;</button>
                    </div>
                </div>
                <div class="paytr-body" style="flex:1;display:flex;overflow:hidden;min-height:0;">
                    <div class="paytr-side" style="width:min(380px,42vw);flex-shrink:0;background:#f1f5f9;border-right:1px solid #e2e8f0;display:flex;flex-direction:column;overflow-y:auto;">
                        <div style="padding:14px 14px 0;">${H(t)}</div>
                        <div style="margin:12px 14px;background:white;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
                            <div style="padding:12px 14px;background:linear-gradient(135deg,#eef2ff,#f8fafc);border-bottom:1px solid #e2e8f0;">
                                <p style="margin:0;font-size:11px;font-weight:800;color:#4338ca;"><i class="fas fa-credit-card"></i> Taksit se\xE7enekleri</p>
                                <p style="margin:4px 0 0;font-size:10px;color:#64748b;">G\xFCncel PayTR oranlar\u0131 \xB7 ${g(t.grandTotal)}</p>
                            </div>
                            <div id="paytr-installments-panel" style="padding:12px;max-height:42vh;overflow-y:auto;"></div>
                            <div id="paytr_taksit_tablosu" style="display:none;"></div>
                        </div>
                        <p style="margin:0 14px 14px;font-size:10px;color:#64748b;line-height:1.45;">
                            Kart numaran\u0131z\u0131 sa\u011Fdaki alana girdi\u011Finizde bankan\u0131za uygun taksitler otomatik listelenir.
                        </p>
                    </div>
                    <div class="paytr-frame" style="flex:1;display:flex;flex-direction:column;background:white;min-width:0;">
                        <iframe src="https://www.paytr.com/odeme/guvenli/${d.token}" id="paytr-iframe" title="PayTR \xD6deme" style="width:100%;flex:1;border:none;min-height:320px;"></iframe>
                    </div>
                </div>
            </div>`,document.body.appendChild(p),!document.getElementById("paytr-checkout-styles")){let l=document.createElement("style");l.id="paytr-checkout-styles",l.textContent=`
                @media (max-width:768px) {
                    .paytr-body { flex-direction: column !important; }
                    .paytr-side { width: 100% !important; max-height: 38vh !important; border-right: none !important; border-bottom: 1px solid #e2e8f0; }
                    .paytr-frame { min-height: 50vh !important; }
                }
            `,document.head.appendChild(l)}p.querySelector("#paytr-modal-close").onclick=()=>p.remove();let a=document.getElementById("paytr-installments-panel");K(t.grandTotal,a,d.token,d.merchantId||"678000"),localStorage.setItem("last_order_id",d.orderId)}catch(o){console.error("PayTR hatas\u0131:",o),alert("\xD6deme sistemine ba\u011Flan\u0131lamad\u0131.")}finally{n&&(n.disabled=!1,n.innerHTML=s)}}function N(){document.body.classList.add("cart-open"),m()}function $(){document.body.classList.remove("cart-open")}function O(){document.getElementById("open-cart-modal")?.addEventListener("click",N),document.getElementById("cart-close-btn")?.addEventListener("click",$),document.getElementById("cart-overlay")?.addEventListener("click",$),document.addEventListener("keydown",t=>{t.key==="Escape"&&document.body.classList.contains("cart-open")&&$()})}function I(){document.hidden||E()}F();O();j();I();m();document.addEventListener("visibilitychange",()=>{document.hidden||I()});setInterval(I,6e4);Object.assign(window,{addToCart:M,addPackageToCart:B,removeFromCart:L,updateItemQuantity:D,updateCartDisplay:m,whatsappCheckout:_,payWithPayTR:A,flyToCart:z,openCart:N,closeCart:$});})();
