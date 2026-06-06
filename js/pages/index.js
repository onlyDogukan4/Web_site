(()=>{typeof window<"u"&&(window.moderraCart||(window.moderraCart=JSON.parse(localStorage.getItem("cart")||"[]").map(t=>({...t,price:isNaN(parseFloat(t.price))||parseFloat(t.price)<=0?15:parseFloat(t.price)}))));function u(){return typeof window<"u"?window.moderraCart:(global.moderraCart||(global.moderraCart=JSON.parse(localStorage.getItem("cart")||"[]").map(t=>({...t,price:isNaN(parseFloat(t.price))||parseFloat(t.price)<=0?15:parseFloat(t.price)}))),global.moderraCart)}function C(t){typeof window<"u"?window.moderraCart=t:global.moderraCart=t,v()}function v(){let t=u();typeof window<"u"&&localStorage.setItem("cart",JSON.stringify(t))}function w(){try{let t=localStorage.getItem("moderra_settings")||localStorage.getItem("settings");if(t)return JSON.parse(t)}catch{}return{minOrder:500,freeShipping:1e3}}function I(){let t=0,e=0;u().forEach(i=>{let r=parseFloat(i.price)||0;if(i.isPackage&&Array.isArray(i.packageItems)){let o=i.packageItems.reduce((l,d)=>l+(parseFloat(d.price)||0)*(d.quantity||1),0);t+=o*(i.quantity||1),e+=o*(i.quantity||1)*((parseFloat(i.discount)||0)/100)}else t+=r*(i.quantity||1)});let n=Math.max(0,t-e);return{subTotal:t,discountTotal:e,total:n}}function T(t){let{freeShipping:e}=w();return t<e?150:0}function b(){let t=document.getElementById("cart-items-list"),e=document.getElementById("cart-count");if(!t)return;let{minOrder:n,freeShipping:i}=w(),{subTotal:r,discountTotal:o,total:l}=I(),d=document.getElementById("cart-progress-sticky");if(d)if(l===0)d.innerHTML="";else if(l<n){let a=Math.min(l/n*100,100);d.innerHTML=`
                <div style="padding:14px 20px;background:linear-gradient(135deg,#fff1f2,#ffe4e6);border-bottom:1px solid #fecdd3;">
                    <div style="font-size:12px;color:#9f1239;font-weight:800;display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span>\u26A0\uFE0F Minimum sipari\u015F i\xE7in eksik</span>
                        <span>\u20BA${(n-l).toLocaleString("tr-TR")}</span>
                    </div>
                    <div style="width:100%;height:6px;background:#fecdd3;border-radius:10px;overflow:hidden;">
                        <div style="width:${a}%;height:100%;background:linear-gradient(90deg,#f43f5e,#e11d48);border-radius:10px;transition:width 0.5s;"></div>
                    </div>
                </div>`}else if(l<i){let a=Math.min(l/i*100,100);d.innerHTML=`
                <div style="padding:14px 20px;background:linear-gradient(135deg,#fefce8,#fef9c3);border-bottom:1px solid #fde047;">
                    <div style="font-size:12px;color:#854d0e;font-weight:800;display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span>\u{1F680} \xDCcretsiz kargo i\xE7in eksik</span>
                        <span>\u20BA${(i-l).toLocaleString("tr-TR")}</span>
                    </div>
                    <div style="width:100%;height:6px;background:rgba(0,0,0,0.1);border-radius:10px;overflow:hidden;">
                        <div style="width:${a}%;height:100%;background:linear-gradient(90deg,#f59e0b,#d97706);border-radius:10px;transition:width 0.5s;"></div>
                    </div>
                </div>`}else d.innerHTML=`
                <div style="padding:14px 20px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-bottom:1px solid #bbf7d0;text-align:center;">
                    <span style="font-size:14px;color:#166534;font-weight:900;">\u{1F389} KARGO B\u0130ZDEN! \xDCcretsiz teslimat kazand\u0131n\u0131z.</span>
                </div>`;if(t.innerHTML="",u().length===0){t.innerHTML=`
            <div style="text-align:center;padding:80px 20px;color:#cbd5e1;">
                <div style="font-size:60px;margin-bottom:16px;">\u{1F6D2}</div>
                <p style="font-weight:800;font-size:15px;color:#94a3b8;">Sepetiniz bo\u015F</p>
                <p style="font-size:13px;color:#cbd5e1;margin-top:6px;">\xDCr\xFCnleri ke\u015Ffetmek i\xE7in al\u0131\u015Fveri\u015Fe ba\u015Flay\u0131n</p>
            </div>`,e&&(e.style.display="none"),L(0,0,0);return}u().forEach(a=>{let c=document.createElement("div");if(c.dataset.cartItemId=a.id,a.isPackage){c.className="cart-item-card";let g=a.packageItems.reduce((x,f)=>x+parseFloat(f.price)*f.quantity,0)*(1-(a.discount||0)/100)*a.quantity;c.innerHTML=`
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
                        <div style="font-size:17px;font-weight:900;color:var(--primary);">\u20BA${g.toLocaleString("tr-TR",{minimumFractionDigits:2})}</div>
                        <button onclick="removeFromCart('${a.id}')" class="trash-btn">\u{1F5D1}</button>
                    </div>
                </div>`}else if(a.isConcept){let g=(parseFloat(a.price)||0)*(a.quantity||1);c.style.cssText=`
                background: linear-gradient(145deg, #fffdf5, #fef9e7);
                border-radius: 20px;
                margin-bottom: 14px;
                border: 2px solid transparent;
                background-clip: padding-box;
                position: relative;
                overflow: visible;
                box-shadow: 0 8px 32px rgba(212,175,55,0.2);
            `,c.style.background="linear-gradient(145deg, #fffdf5, #fef9e7)",c.style.outline="2px solid #d4af37",c.style.outlineOffset="0px",c.style.borderRadius="20px",c.style.marginBottom="14px",c.style.position="relative",c.style.overflow="visible",c.style.boxShadow="0 8px 32px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.8)";let x=a.logo&&a.logo.startsWith("data:application/pdf"),f=a.logo?`<div style="margin-top:10px;">
                    <div style="font-size:10px;font-weight:800;color:#b8860b;margin-bottom:4px;text-transform:uppercase;"><i class="fas fa-check-circle" style="color:#22c55e;"></i> Y\xFCklenen Dosya:</div>
                    ${x?`<div style="display:flex;align-items:center;gap:6px;background:rgba(239,68,68,0.1);border-radius:8px;padding:6px 10px;border:1px solid rgba(239,68,68,0.3);">
                               <i class="fas fa-file-pdf" style="color:#ef4444;font-size:18px;"></i>
                               <span style="font-size:11px;color:#d4af37;word-break:break-all;">${a.logoName||"logo.pdf"}</span>
                           </div>`:`<img src="${a.logo}" style="max-width:80px;max-height:50px;object-fit:contain;border-radius:8px;border:1px solid rgba(212,175,55,0.3);">`}
                   </div>`:'<div style="margin-top:8px;font-size:10px;color:#d4af37;font-style:italic;"><i class="fas fa-upload"></i> Logo hen\xFCz y\xFCklenmedi</div>';c.innerHTML=`
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

                            ${f}

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
                            ">\u20BA${g.toLocaleString("tr-TR",{minimumFractionDigits:2})}</div>
                            <div style="font-size:10px;color:#b8860b;margin-top:2px;">adet ba\u015F\u0131na</div>
                            <button onclick="removeFromCart('${a.id}')" style="
                                background:none;border:none;cursor:pointer;font-size:16px;
                                opacity:0.5;transition:opacity 0.2s;display:block;margin:8px 0 0 auto;
                            " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.5'">\u{1F5D1}</button>
                        </div>
                    </div>
                </div>`}else{c.className="cart-item-card";let g=parseFloat(a.price)*a.quantity;c.innerHTML=`
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
                        <div style="font-size:17px;font-weight:900;color:var(--primary);">\u20BA${g.toLocaleString("tr-TR",{minimumFractionDigits:2})}</div>
                        <button onclick="removeFromCart('${a.id}')" class="trash-btn">\u{1F5D1}</button>
                    </div>
                </div>`}t.appendChild(c)}),L(r,o,l);let p=u().reduce((a,c)=>a+c.quantity,0);e&&(e.textContent=p,e.style.display=p>0?"flex":"none")}function L(t,e,n){let i=document.getElementById("cart-total-price-area");if(!i)return;let r=T(n),o=n+r,l=Math.round((o-o/1.2)*100)/100;i.innerHTML=`
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#64748b;font-size:13px;">
            <span>\xDCr\xFCnler (ara toplam)</span>
            <span>\u20BA${t.toLocaleString("tr-TR",{minimumFractionDigits:2})}</span>
        </div>
        ${e>0?`
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#16a34a;font-size:13px;font-weight:700;">
            <span>\u{1F381} \u0130ndirim</span>
            <span>\u2212\u20BA${e.toLocaleString("tr-TR",{minimumFractionDigits:2})}</span>
        </div>`:""}
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#475569;font-size:13px;">
            <span>\xDCr\xFCn tutar\u0131</span>
            <span>\u20BA${n.toLocaleString("tr-TR",{minimumFractionDigits:2})}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:${r>0?"#dc2626":"#16a34a"};font-size:13px;font-weight:700;">
            <span>${r>0?"\u{1F69A} Kargo":"\u{1F389} Kargo (\xDCcretsiz)"}</span>
            <span>${r>0?"\u20BA"+r.toLocaleString("tr-TR"):"\xDCcretsiz"}</span>
        </div>
            <div style="display:flex;justify-content:space-between;color:var(--primary);font-weight:900;font-size:18px;margin-top:10px;padding-top:10px;border-top:2px solid #f1f5f9;">
                <span>\xD6DENECEK TOPLAM</span>
                <span style="font-weight:900;font-size:22px;color:var(--primary);">\u20BA${o.toLocaleString("tr-TR",{minimumFractionDigits:2})}</span>
            </div>
            ${n>0?`<div id="checkout-options">
                <button type="button" onclick="whatsappCheckout()">
                    <i class="fab fa-whatsapp" aria-hidden="true"></i>
                    <span>WhatsApp</span>
                </button>
                <button type="button" onclick="payWithPayTR()">
                    <i class="fas fa-credit-card" aria-hidden="true"></i>
                    <span>Kredi Kart\u0131</span>
                </button>
            </div>`:""}
`}function $(t){if(!t)return;let e=document.getElementById("open-cart-modal");if(!e)return;let n=t.cloneNode(!0),i=t.getBoundingClientRect(),r=e.getBoundingClientRect();Object.assign(n.style,{position:"fixed",left:i.left+"px",top:i.top+"px",width:"80px",height:"80px",zIndex:"100000",pointerEvents:"none",transition:"all 0.75s cubic-bezier(0.19, 1, 0.22, 1)",borderRadius:"12px",objectFit:"contain"}),document.body.appendChild(n),requestAnimationFrame(()=>{n.style.transform=`translate(${r.left-i.left}px, ${r.top-i.top}px) scale(0.1)`,n.style.opacity="0.4"}),setTimeout(()=>{n.remove(),e.classList.add("shake"),setTimeout(()=>e.classList.remove("shake"),500)},750)}var s={products:[],packages:[],campaigns:[],lang:localStorage.getItem("lang")||"tr",category:"T\xFCm\xFC",page:1};window.onCardQuantities=window.onCardQuantities||{};function h(t,e,n){let i=s.products.find(g=>String(g.id)===String(t)),r=i?.name_tr||e||"\xDCr\xFCn",o=parseFloat(i?.price??n),l=i?.image||"images/bardak.png";if(isNaN(o))return;let d=null,p=document.getElementById("product-detail-modal");p&&p.style.display==="block"&&(d=document.getElementById("detail-img")),d||(d=document.querySelector(`.add-to-cart[onclick*="'${t}'"]`)?.closest(".product-card")?.querySelector("img")),d&&$(d);let a=u(),c=a.find(g=>String(g.id)===String(t));c?c.quantity++:a.push({id:String(t),name:r,image:l,price:o,quantity:1}),v(),b(),document.body.classList.add("cart-open")}function z(t){let e=s.packages.find(p=>String(p.id)===String(t));if(!e)return;let i=(e.items||"").split(",").map(p=>p.trim()).map(p=>{let a=s.products.find(g=>String(g.id)===p);if(!a)return null;let c=window.onCardQuantities[`${t}-${a.id}`]||1;return{id:a.id,name:a.name_tr,price:a.price,image:a.image,quantity:c}}).filter(Boolean),o=document.querySelector(`button[onclick*="addPackageToCart('${t}')"]`)?.closest(".package-card")?.querySelector("img");o&&$(o);let l=u(),d=l.findIndex(p=>String(p.id)===String(e.id));d>-1?e.name.toLowerCase().includes("s\xFCper")?(l[d].packageItems=i,l[d].quantity=1):l[d].quantity++:l.push({id:String(e.id),name:e.name,image:e.image||"images/bardak.png",discount:e.discount||0,quantity:1,isPackage:!0,packageItems:i}),v(),b(),document.body.classList.add("cart-open")}function P(){window.addToCartByMatch=t=>{let e=s.products.find(n=>n.name_tr.toLowerCase().includes(t.toLowerCase()));return e?(h(e.id,e.name_tr,e.price),{success:!0,name:e.name_tr,id:String(e.id)}):{success:!1}}}async function S(){try{let t=Date.now(),[e,n,i]=await Promise.all([fetch(`/api/products?t=${t}`),fetch(`/api/packages?t=${t}`),fetch(`/api/campaigns?t=${t}`)]),[r,o,l]=await Promise.all([e.json(),n.json(),i.json()]);Array.isArray(r)&&r.length&&(s.products=r),Array.isArray(o)&&(s.packages=o),Array.isArray(l)&&(s.campaigns=l)}catch(t){console.warn("Veri y\xFCkleme hatas\u0131:",t.message)}}function B({syncCartPrices:t,renderProducts:e,renderPackages:n}){let i=null,r=null;async function o(){if(!document.hidden)try{let p=await fetch("/api/settings?type=last-update&t="+Date.now());if(!p.ok)return;let a=await p.json();if(i===null){i=a.time;return}a.time!==i&&(i=a.time,await S(),t(),e(),n())}catch{}}function l(){r||(o(),r=setInterval(o,2e4))}function d(){r&&(clearInterval(r),r=null)}document.addEventListener("visibilitychange",()=>{document.hidden?d():l()}),l()}function F(t){q(),document.getElementById("lang-toggle")?.addEventListener("click",e=>{e.preventDefault(),s.lang=s.lang==="tr"?"en":"tr",localStorage.setItem("lang",s.lang),q(),t?.()})}function q(){let t=document.getElementById("lang-toggle");t&&(t.textContent=s.lang==="tr"?"EN":"TR"),document.querySelectorAll("[data-tr]").forEach(e=>{let n=e.getAttribute(`data-${s.lang}`);n&&(e.textContent=n)}),document.querySelectorAll("[data-tr-placeholder]").forEach(e=>{let n=s.lang==="tr"?e.getAttribute("data-tr-placeholder"):e.getAttribute("data-en-placeholder");n&&(e.placeholder=n)})}function y(){return s.lang==="en"}function A(){let t=location.pathname.split("/").pop()||"index.html";document.querySelectorAll(".nav-links a").forEach(e=>{e.classList.toggle("active",e.getAttribute("href")===t)})}function D(t){return"\u20BA"+Number(t).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})}function W(t){let e=`${t.name||""} ${t.id||""} ${t.description||""}`.toLowerCase();return/düğün|dugun|wedding|gelin|damat/.test(e)}function k(){let t=document.getElementById("packages-container");if(!t)return;let e=y(),n=s.packages.filter(i=>i.published).sort((i,r)=>(i.order||0)-(r.order||0));t.innerHTML="",n.forEach(i=>{let r=(i.items||"").split(",").map(a=>a.trim()).filter(Boolean),o=0;r.forEach(a=>{let c=s.products.find(g=>String(g.id)===a);c&&(o+=parseFloat(c.price))});let l=o*(1-(i.discount||0)/100),d=r.length===3?"package-items-grid items-3":"package-items-grid",p=document.createElement("div");p.className=W(i)?"package-card package-card--wedding":"package-card",p.innerHTML=`
                <div class="package-card-badge">%${i.discount||0} \u0130ND\u0130R\u0130M</div>
                <div class="package-card-head">
                    <img src="${i.image||"images/bardak.png"}" alt="">
                    <div>
                        <h3>${i.name}</h3>
                        ${i.description?`<p>${i.description}</p>`:""}
                    </div>
                </div>
                <div class="${d}">
                    ${r.map(a=>{let c=s.products.find(V=>String(V.id)===a);if(!c)return"";let g=`${i.id}-${c.id}`,x=window.onCardQuantities[g]||1,f=e&&c.name_en||c.name_tr;return`
                            <div class="package-item">
                                <img src="${c.image||"images/bardak.png"}" alt="">
                                <span class="package-item-name">${f}</span>
                                <div class="package-item-qty">
                                    <button type="button" class="qty-btn" onclick="adjustPkgQty('${i.id}','${c.id}',-1)" aria-label="Azalt">\u2212</button>
                                    <span class="qty-value" id="qty-${g}">${x}</span>
                                    <button type="button" class="qty-btn" onclick="adjustPkgQty('${i.id}','${c.id}',1)" aria-label="Art\u0131r">+</button>
                                </div>
                            </div>`}).join("")}
                </div>
                <div class="package-footer">
                    <div class="package-price-block">
                        <div class="package-price" id="pkg-price-${i.id}">${D(l)}</div>
                        <div class="package-price-note">Set avantaj\u0131yla tasarruf edin!</div>
                    </div>
                    <button type="button" class="btn-primary package-add-btn" onclick="addPackageToCart('${i.id}')">
                        <i class="fas fa-cart-plus"></i> ${e?"Buy Set":"Paketi Sepete Ekle"}
                    </button>
                </div>`,t.appendChild(p)})}function M(t,e,n){let i=`${t}-${e}`;window.onCardQuantities[i]=Math.max(1,(window.onCardQuantities[i]||1)+n);let r=document.getElementById(`qty-${i}`);r&&(r.textContent=window.onCardQuantities[i]);let o=s.packages.find(p=>String(p.id)===String(t));if(!o)return;let l=0;(o.items||"").split(",").map(p=>p.trim()).forEach(p=>{let a=s.products.find(c=>String(c.id)===p);a&&(l+=parseFloat(a.price)*(window.onCardQuantities[`${t}-${a.id}`]||1))});let d=document.getElementById(`pkg-price-${t}`);d&&(d.textContent=D(l*(1-(o.discount||0)/100)))}function G(t){let e="";for(let i=0;i<Math.floor(t);i++)e+='<i class="fas fa-star"></i>';t%1>=.5&&(e+='<i class="fas fa-star-half-alt"></i>');let n=5-Math.ceil(t);for(let i=0;i<n;i++)e+='<i class="far fa-star"></i>';return e}function _(){document.querySelector(".detail-close")?.addEventListener("click",()=>{document.getElementById("product-detail-modal").style.display="none"})}function N(t){let e=s.products.find(i=>String(i.id)===String(t));if(!e)return;let n=y();document.getElementById("detail-img").src=e.image||"images/bardak.png",document.getElementById("detail-title").textContent=n&&e.name_en||e.name_tr,document.getElementById("detail-price").textContent="\u20BA"+parseFloat(e.price).toLocaleString("tr-TR",{minimumFractionDigits:2}),document.getElementById("detail-rating").innerHTML=G(parseFloat(e.rating)||5),document.getElementById("detail-desc").textContent=n?e.description_en||e.description_tr||"":e.description_tr||"",document.getElementById("detail-add-btn").onclick=()=>{h(e.id,e.name_tr,e.price),document.getElementById("product-detail-modal").style.display="none"},document.getElementById("product-detail-modal").style.display="block"}function j(){let t=document.getElementById("profile-modal");document.getElementById("open-profile-modal")?.addEventListener("click",()=>{t.style.display="block"}),document.querySelector(".profile-close")?.addEventListener("click",()=>{t.style.display="none"}),document.getElementById("profile-form")?.addEventListener("submit",n=>{n.preventDefault(),localStorage.setItem("moderra_user_data",JSON.stringify({name:document.getElementById("user-name").value,phone:document.getElementById("user-phone").value,address:document.getElementById("user-address").value})),t.style.display="none"});let e=JSON.parse(localStorage.getItem("moderra_user_data")||"{}");e.name&&(document.getElementById("user-name").value=e.name),e.phone&&(document.getElementById("user-phone").value=e.phone),e.address&&(document.getElementById("user-address").value=e.address),window.addEventListener("click",n=>{n.target===t&&(t.style.display="none");let i=document.getElementById("product-detail-modal");n.target===i&&(i.style.display="none")})}var H={active:"Standart",hot:"F\u0131rsat",discount:"\u0130ndirimli",oos:"Stok D\u0131\u015F\u0131"};function m(){let t=document.getElementById("products-container");if(!t)return;let e=y(),n=s.category==="T\xFCm\xFC"?s.products:s.products.filter(o=>(H[o.status]||"Standart")===s.category),i=Math.max(1,Math.ceil(n.length/6));s.page>i&&(s.page=1);let r=n.slice((s.page-1)*6,s.page*6);if(Y(),t.innerHTML="",!r.length){t.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted);">
                <i class="fas fa-box-open fa-3x" style="opacity:.3;margin-bottom:15px;display:block;"></i>
                Bu kategoride \xFCr\xFCn bulunamad\u0131.
            </div>`,R(i);return}r.forEach(o=>{let l=e&&o.name_en||o.name_tr,d=o.status==="oos",p=s.campaigns.find(g=>String(g.id)===String(o.campaign_id)),a="";o.status==="hot"&&!p&&(a='<div class="hot-badge"><i class="fas fa-fire"></i> FIRSAT</div>'),d&&(a='<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-15deg);background:rgba(0,0,0,0.8);color:white;padding:10px 20px;font-weight:900;z-index:30;border-radius:10px;border:2px solid #ef4444;font-size:14px;">T\xDCKEND\u0130</div>');let c=document.createElement("div");c.className="product-card"+(d?" oos-card":""),c.style.position="relative",c.innerHTML=`
                <img src="${o.image||"images/bardak.png"}" alt="${l}" class="product-img" loading="lazy"
                     width="400" height="280"
                     style="${d?"filter:grayscale(1) opacity(.5);":"cursor:pointer;"}"
                     onclick="${d?"":`openProductDetail('${o.id}')`}">
                ${a}
                <div class="product-info">
                    <h3 class="product-title" style="${d?"":"cursor:pointer;"}"
                        onclick="${d?"":`openProductDetail('${o.id}')`}">${l}</h3>
                    <div class="product-price">
                        ${o.old_price?`<span style="text-decoration:line-through;font-size:14px;color:#94a3b8;margin-right:5px;">\u20BA${parseFloat(o.old_price).toLocaleString("tr-TR")}</span>`:""}
                        \u20BA${parseFloat(o.price).toLocaleString("tr-TR",{minimumFractionDigits:2})}
                    </div>
                    <div class="product-actions" style="${d?"pointer-events:none;opacity:.5;":""}">
                        <button class="add-to-cart" ${d?"disabled":""}
                                onclick="addToCart('${o.id}','${o.name_tr.replace(/'/g,"\\'")}',${o.price})">
                            <i class="fas fa-shopping-cart"></i>
                            ${d?"Stok Yok":e?"Add to Cart":"Sepete Ekle"}
                        </button>
                        <button class="inspect-btn" onclick="openProductDetail('${o.id}')">
                            <i class="fas fa-expand-alt"></i>
                        </button>
                    </div>
                </div>`,t.appendChild(c)}),R(i)}function Y(){let t=document.getElementById("product-category-nav");if(!t)return;let e=["T\xFCm\xFC",...new Set(s.products.map(n=>H[n.status]||"Standart"))];t.innerHTML=e.map(n=>`
            <button onclick="filterCategory('${n}')" style="
                padding:9px 22px;border-radius:50px;cursor:pointer;font-weight:700;font-size:14px;transition:.2s;
                border:2px solid ${n===s.category?"var(--primary)":"var(--border)"};
                background:${n===s.category?"var(--primary)":"transparent"};
                color:${n===s.category?"white":"var(--text)"};">${n}
            </button>`).join("")}function O(t){s.category=t,s.page=1,m()}function R(t){let e=document.getElementById("product-pagination");if(e){if(t<=1){e.innerHTML="";return}e.innerHTML=Array.from({length:t},(n,i)=>i+1).map(n=>`
            <button onclick="_page=${n};renderProducts()" style="
                width:42px;height:42px;border-radius:50%;cursor:pointer;font-weight:800;font-size:15px;transition:.2s;
                border:2px solid ${n===s.page?"var(--primary)":"var(--border)"};
                background:${n===s.page?"var(--primary)":"transparent"};
                color:${n===s.page?"white":"var(--text)"};">${n}
            </button>`).join("")}}function Q(){let t=document.getElementById("search-bar"),e=document.getElementById("search-input"),n=document.getElementById("search-count");function i(){t.classList.remove("active"),e.value="",n&&(n.textContent=""),m()}document.getElementById("open-search")?.addEventListener("click",()=>{t.classList.add("active"),e.value="",n&&(n.textContent=""),setTimeout(()=>e.focus(),50)}),document.getElementById("close-search")?.addEventListener("click",i),document.addEventListener("keydown",r=>{r.key==="Escape"&&t.classList.contains("active")&&i()}),e?.addEventListener("input",()=>{let r=e.value.toLowerCase().trim(),o=document.querySelectorAll(".product-card"),l=0;o.forEach(d=>{let p=d.querySelector(".product-title")?.textContent.toLowerCase()||"",a=!r||p.includes(r);d.style.display=a?"":"none",a&&l++}),n&&(n.textContent=r?`${l} sonu\xE7`:"")})}function K(){let t=document.querySelector(".slides"),e=document.querySelectorAll(".slider-dot");if(!t||!e.length)return;let n=0,i=r=>{n=r,t.style.transform=`translateX(-${n*100}%)`,e.forEach((o,l)=>o.classList.toggle("active",l===n))};e.forEach((r,o)=>r.addEventListener("click",()=>i(o))),setInterval(()=>i((n+1)%e.length),5e3)}function J(){let t=!1,e=u().map(n=>{if(n.isConcept||n.isPackage)return n;let i=s.products.find(r=>String(r.id)===String(n.id));if(i){let r=parseFloat(i.price);if(!isNaN(r)&&r!==parseFloat(n.price))return t=!0,{...n,price:r}}return n});e=e.map(n=>{if(!n.isPackage||!Array.isArray(n.packageItems))return n;let i=!1,r=n.packageItems.map(o=>{let l=s.products.find(d=>String(d.id)===String(o.id));if(l){let d=parseFloat(l.price);if(!isNaN(d)&&d!==parseFloat(o.price))return i=!0,{...o,price:d}}return o});return i?(t=!0,{...n,packageItems:r}):n}),t&&(C(e),b())}function U(){let t=document.getElementById("theme-toggle");t&&(localStorage.getItem("theme")==="dark"&&(document.documentElement.setAttribute("data-theme","dark"),t.classList.replace("fa-moon","fa-sun")),t.addEventListener("click",()=>{let e=document.documentElement.getAttribute("data-theme")==="dark";document.documentElement.toggleAttribute("data-theme",!e),e?(document.documentElement.removeAttribute("data-theme"),localStorage.setItem("theme","light"),t.classList.replace("fa-sun","fa-moon")):(document.documentElement.setAttribute("data-theme","dark"),localStorage.setItem("theme","dark"),t.classList.replace("fa-moon","fa-sun"))}))}document.addEventListener("DOMContentLoaded",async()=>{U(),F(()=>{m(),k()}),K(),A(),j(),Q(),_(),P(),await S(),m(),k(),B({syncCartPrices:J,renderProducts:m,renderPackages:k})});Object.assign(window,{addToCart:h,addPackageToCart:z,openProductDetail:N,filterCategory:O,adjustPkgQty:M,renderProducts:m});Object.defineProperty(window,"_page",{get:()=>s.page,set:t=>{s.page=t}});})();
