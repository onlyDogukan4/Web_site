/**
 * Mr. Karton — Moderra agentic AI (Groq /api/chat)
 */

class ModerraAI {
    constructor() {
        this.isOpen = false;
        this.isThinking = false;
        this.chatHistory = [];
        this.siteContext = '';
        this.catalog = { concepts: [], settings: {} };
        this.agentSession = null;
        this.init();
    }

    async init() {
        this.render();
        this.preloadImages();
        this.addEventListeners();
        this.startBlinking();
        this.showAttentionBadge();
        await this.prepareContext();
        this.welcomeUser();
    }

    preloadImages() {
        ['images/profesor.png', 'images/kırpmamis.png', 'images/kırpmis.png'].forEach((src) => {
            const img = new Image();
            img.src = src;
        });
    }

    showAttentionBadge() {
        if (sessionStorage.getItem('chatbot_seen')) return;
        sessionStorage.setItem('chatbot_seen', '1');

        const btn = document.getElementById('chatbot-toggle');
        if (!btn) return;

        const badge = document.createElement('div');
        badge.id = 'chatbot-badge';
        badge.textContent = window.innerWidth <= 480 ? 'Yardım? 👋' : 'Özel bardak siparişi? ✨';
        badge.style.cssText = `
            position:absolute;bottom:110%;right:0;background:#4338ca;color:white;
            font-size:13px;font-weight:700;padding:9px 14px;border-radius:16px 16px 4px 16px;
            white-space:nowrap;box-shadow:0 8px 24px rgba(67,56,202,0.35);
            pointer-events:none;z-index:10010;
        `;
        btn.style.position = 'relative';
        btn.appendChild(badge);
        setTimeout(() => {
            badge.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            badge.style.opacity = '0';
            badge.style.transform = 'translateY(-8px)';
            setTimeout(() => badge.remove(), 420);
        }, 4500);
    }

    async prepareContext() {
        try {
            const res = await fetch('/api/site-context?t=' + Date.now());
            if (res.ok) {
                const data = await res.json();
                this.siteContext = data.context || '';
                this.catalog.concepts = data.concepts || [];
                this.catalog.settings = data.settings || {};
                return;
            }
        } catch (e) {
            console.warn('site-context:', e);
        }
        this.siteContext =
            'Moderra premium karton bardak, özel konsept baskı, WhatsApp 0530 464 01 20.';
    }

    render() {
        if (document.querySelector('.chatbot-container')) {
            document.querySelector('.chatbot-container').remove();
        }

        const container = document.createElement('div');
        container.className = 'chatbot-container';
        container.innerHTML = `
            <div class="chatbot-window" id="chatbot-window">
                <div class="chatbot-header">
                    <div class="header-info-wrap">
                        <img src="images/profesor.png" alt="Mr. Karton" class="header-avatar-mini">
                        <div class="chatbot-header-text">
                            <h3>Mr. Karton</h3>
                            <p>Moderra AI Danışman ✨</p>
                        </div>
                    </div>
                    <button type="button" class="chatbot-close" id="chatbot-close" aria-label="Sohbeti kapat">
                        <i class="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="chatbot-quick-chips" id="chatbot-chips"></div>
                <div class="chatbot-messages" id="chatbot-messages"></div>
                <div id="ai-typing-indicator" class="chatbot-typing" style="display:none;">
                    <i class="fas fa-magic fa-spin"></i> Mr. Karton düşünüyor…
                </div>
                <div class="chatbot-input-area">
                    <input type="text" id="chatbot-input" placeholder="Örn: Özel logolu düğün bardağı istiyorum…" autocomplete="off">
                    <button class="chatbot-send-btn" id="chatbot-send" type="button" aria-label="Gönder">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
            <button class="chatbot-button" id="chatbot-toggle" type="button" aria-label="Mr. Karton">
                <img src="images/profesor.png" alt="Mr. Karton" id="main-avatar-img">
            </button>
        `;
        document.body.appendChild(container);
        this.injectStyles();
        this.renderQuickChips();
    }

    injectStyles() {
        if (document.getElementById('moderra-chatbot-styles')) return;
        const style = document.createElement('style');
        style.id = 'moderra-chatbot-styles';
        style.textContent = `
            .chatbot-container { position:fixed; bottom:30px; right:30px; z-index:10000; font-family:'Segoe UI',system-ui,sans-serif; }
            .chatbot-button { background:none!important;border:none!important;cursor:pointer;width:160px;height:160px;padding:0;z-index:10002; display:flex;align-items:center;justify-content:center; }
            .chatbot-button img { width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 15px 30px rgba(0,0,0,0.2)); }
            .chatbot-window { position:absolute;bottom:40px;right:0;width:min(420px,calc(100vw - 24px));height:min(650px,85dvh); background:white;border-radius:24px;box-shadow:0 40px 80px rgba(0,0,0,0.25); display:flex;flex-direction:column;overflow:hidden;opacity:0;transform:translateY(20px) scale(0.96); pointer-events:none;transition:0.35s ease;z-index:10001;border:1px solid #e2e8f0; }
            .chatbot-window.active { opacity:1;transform:none;pointer-events:all; }
            .chatbot-header { background:linear-gradient(135deg,#1e293b,#4338ca);color:white;padding:14px 16px;padding-top:max(14px,env(safe-area-inset-top)); display:flex;align-items:center;justify-content:space-between;gap:10px;flex-shrink:0; }
            .header-info-wrap { display:flex;align-items:center;gap:12px;min-width:0;flex:1; }
            .chatbot-close { flex-shrink:0;width:44px;height:44px;border:none;border-radius:50%;background:rgba(255,255,255,0.18);color:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s; -webkit-tap-highlight-color:transparent; }
            .chatbot-close:hover,.chatbot-close:active { background:rgba(255,255,255,0.32); }
            .header-avatar-mini { width:42px;height:42px;border-radius:50%;object-fit:contain;background:rgba(255,255,255,0.12); }
            .chatbot-header-text h3 { margin:0;font-size:18px; }
            .chatbot-header-text p { margin:4px 0 0;font-size:11px;opacity:0.85; }
            .chatbot-quick-chips { display:flex;flex-wrap:wrap;gap:6px;padding:10px 12px;background:#f1f5f9;border-bottom:1px solid #e2e8f0; }
            .chatbot-chip { font-size:11px;padding:6px 10px;border-radius:20px;border:1px solid #c7d2fe;background:white;color:#4338ca;cursor:pointer;font-weight:600; }
            .chatbot-chip:hover { background:#eef2ff; }
            .chatbot-messages { flex:1;padding:16px;overflow-y:auto;display:flex;flex-direction:column;gap:12px;background:#f8fafc; }
            .message { max-width:88%;padding:12px 16px;border-radius:18px;font-size:14px;line-height:1.55; }
            .message.bot { background:white;align-self:flex-start;border:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(0,0,0,0.04); }
            .message.user { background:#4338ca;color:white;align-self:flex-end; }
            .chatbot-typing { padding:8px 16px;font-size:12px;color:#4338ca;font-weight:600; }
            .chatbot-input-area { padding:14px;border-top:1px solid #e2e8f0;display:flex;gap:8px;background:white; }
            .chatbot-input-area input { flex:1;border:1px solid #e2e8f0;padding:12px 14px;border-radius:12px;font-size:16px;outline:none; }
            .chatbot-send-btn { background:#4338ca;color:white;border:none;width:48px;height:48px;border-radius:12px;cursor:pointer;flex-shrink:0; }
            @media (max-width:768px) {
                .chatbot-container { bottom:16px; right:16px; }
                .chatbot-button { width:88px;height:88px; }
                .chatbot-window { position:fixed!important;inset:0!important;width:100%!important;height:100dvh!important;max-height:100dvh!important;border-radius:0!important;z-index:10003!important; }
                .chatbot-container.chat-open .chatbot-button { opacity:0;pointer-events:none; }
                .chatbot-input-area { padding-bottom:max(14px,env(safe-area-inset-bottom)); }
            }
        `;
        document.head.appendChild(style);
    }

    renderQuickChips() {
        const el = document.getElementById('chatbot-chips');
        if (!el) return;
        const chips = [
            { label: '👑 Özel logolu bardak', text: 'Özel logolu bardak siparişi vermek istiyorum, adım adım yardım eder misiniz?' },
            { label: '💍 Düğün konsepti', text: 'Düğün için özel baskılı bardak istiyorum.' },
            { label: '📦 Ürünler', text: 'Popüler ürünleriniz neler?' },
            { label: '🚚 Kargo', text: 'Ücretsiz kargo limiti nedir?' },
        ];
        el.innerHTML = chips
            .map(
                (c) =>
                    `<button type="button" class="chatbot-chip" data-text="${c.text.replace(/"/g, '&quot;')}">${c.label}</button>`
            )
            .join('');
        el.querySelectorAll('.chatbot-chip').forEach((btn) => {
            btn.addEventListener('click', () => {
                const text = btn.dataset.text;
                document.getElementById('chatbot-input').value = text;
                this.sendUserMessage(text);
            });
        });
    }

    startBlinking() {
        const mainImg = document.getElementById('main-avatar-img');
        setInterval(() => {
            if (this.isOpen && mainImg) {
                mainImg.src = 'images/kırpmis.png';
                setTimeout(() => {
                    if (this.isOpen && mainImg) mainImg.src = 'images/kırpmamis.png';
                }, 150);
            }
        }, 6000);
    }

    openChat() {
        const toggleBtn = document.getElementById('chatbot-toggle');
        const windowEl = document.getElementById('chatbot-window');
        const mainImg = document.getElementById('main-avatar-img');
        const container = document.querySelector('.chatbot-container');

        this.isOpen = true;
        windowEl?.classList.add('active');
        container?.classList.add('chat-open');
        document.body.classList.add('chatbot-open');

        if (window.innerWidth > 768 && toggleBtn) {
            toggleBtn.classList.add('avatar-active');
        }
        if (mainImg) mainImg.src = 'images/kırpmamis.png';
        document.getElementById('chatbot-badge')?.remove();
    }

    closeChat() {
        const toggleBtn = document.getElementById('chatbot-toggle');
        const windowEl = document.getElementById('chatbot-window');
        const mainImg = document.getElementById('main-avatar-img');
        const container = document.querySelector('.chatbot-container');

        this.isOpen = false;
        windowEl?.classList.remove('active');
        container?.classList.remove('chat-open');
        document.body.classList.remove('chatbot-open');
        toggleBtn?.classList.remove('avatar-active');
        if (mainImg) mainImg.src = 'images/profesor.png';
    }

    addEventListeners() {
        const toggleBtn = document.getElementById('chatbot-toggle');
        const closeBtn = document.getElementById('chatbot-close');
        const sendBtn = document.getElementById('chatbot-send');
        const inputEl = document.getElementById('chatbot-input');

        toggleBtn.addEventListener('click', () => {
            if (this.isOpen) this.closeChat();
            else this.openChat();
        });

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeChat();
        });

        sendBtn.addEventListener('click', () => this.sendFromInput());
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendFromInput();
        });
    }

    sendFromInput() {
        const inputEl = document.getElementById('chatbot-input');
        const text = inputEl.value.trim();
        if (!text || this.isThinking) return;
        inputEl.value = '';
        this.sendUserMessage(text);
    }

    sendUserMessage(text) {
        this.addUserMessage(text);
        this.callAI(text);
    }

    welcomeUser() {
        const messages = [
            'Hoş geldiniz. ✨ Ben **Mr. Karton** — Moderra\'nın AI danışmanıyım. Ürünler, özel logolu bardak siparişi veya konsept tasarım — ne isterseniz adım adım yardımcı olurum.',
            'Merhaba. 👑 **Mr. Karton** hizmetinizde. Özellikle özel logolu bardak siparişlerinde size tek tek rehberlik edebilirim.',
        ];
        this.addBotMessage(messages[Math.floor(Math.random() * messages.length)]);
    }

    addBotMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message bot';
        msgDiv.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
        document.getElementById('chatbot-messages').appendChild(msgDiv);
        this.scrollToBottom();
    }

    addUserMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message user';
        msgDiv.textContent = text;
        document.getElementById('chatbot-messages').appendChild(msgDiv);
        this.scrollToBottom();
    }

    async callAI(prompt) {
        this.isThinking = true;
        const typing = document.getElementById('ai-typing-indicator');
        if (typing) typing.style.display = 'block';

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    chatHistory: this.chatHistory,
                    agentSession: this.agentSession,
                }),
            });

            if (!response.ok) {
                throw new Error(`Bağlantı hatası (${response.status})`);
            }

            const data = await response.json();
            let botText = data.choices?.[0]?.message?.content || '';

            if (data.agentSession !== undefined) {
                this.agentSession = data.agentSession;
            }

            await this.executeActions(data.actions || []);

            this.chatHistory.push({ role: 'user', content: prompt });
            this.chatHistory.push({ role: 'assistant', content: botText });
            if (this.chatHistory.length > 24) {
                this.chatHistory = this.chatHistory.slice(-24);
            }

            this.addBotMessage(botText);
        } catch (e) {
            console.error('Chat:', e);
            this.addBotMessage(
                `Kısa bir bağlantı sorunu yaşadım (${e.message}). Yine de WhatsApp hattımızdan yazabilirsiniz: 0530 464 01 20 ✨`
            );
        } finally {
            this.isThinking = false;
            if (typing) typing.style.display = 'none';
        }
    }

    async executeActions(actions) {
        for (const action of actions) {
            switch (action.type) {
                case 'add_cart':
                    await this.actionAddCart(action.productQuery);
                    break;
                case 'add_concept_cart':
                    await this.actionAddConceptCart(action.data);
                    break;
                case 'suggest_package':
                    this.actionSuggestPackage(action.packageId);
                    break;
                case 'open_page':
                    this.actionOpenPage(action.url);
                    break;
            }
        }
    }

    async actionAddCart(keyword) {
        if (!window.addToCartByMatch) return;
        const result = await window.addToCartByMatch(keyword);
        if (result?.success) {
            this.showCartAddedToast({ itemId: result.id, name: result.name });
            this.addBotMessage(`✅ **${result.name}** sepetinize eklendi.`);
        } else {
            this.addBotMessage(
                'Bu ürünü katalogda tam eşleştiremedim; ana sayfadaki ürün listesinden de seçebilirsiniz.'
            );
        }
    }

    async actionAddConceptCart(data) {
        if (typeof window.addToCart !== 'function' || !data) {
            this.addBotMessage('Sipariş bilgileri hazır; lütfen konsept sayfasından onaylayın.');
            this.actionOpenPage('konsept-bardaklar.html');
            return;
        }

        const qty = data.quantity || 1;
        const conceptItemId = `concept-ai-${data.conceptId}-${Date.now()}`;
        for (let i = 0; i < qty; i++) {
            window.addToCart({
                id: i === 0 ? conceptItemId : `${conceptItemId}-${i}`,
                conceptId: String(data.conceptId),
                variantKey: `${data.size}-${data.lid}`,
                name: data.conceptName,
                image: data.image || 'images/bardak.png',
                price: parseFloat(data.price) || 15,
                quantity: 1,
                note: data.note || '',
                isConcept: true,
            });
        }

        sessionStorage.setItem(
            'moderra_ai_concept_pending',
            JSON.stringify({ conceptId: data.conceptId, note: data.note })
        );

        this.showCartAddedToast({ itemId: conceptItemId, name: data.conceptName });

        this.addBotMessage(
            `✅ **${qty} adet ${data.conceptName}** sepetinize eklendi (${data.size}, ${data.lid === 'lid' ? 'kapaklı' : 'kapaksız'}).` +
                `<br><br>Logo dosyanızı **Konsept Bardaklar** sayfasından PNG/PDF olarak yükleyebilirsiniz — tasarım ekibimiz aynı notu görecek.`
        );

        if (typeof window.updateCartDisplay === 'function') window.updateCartDisplay();
    }

    showCartAddedToast({ itemId, name }) {
        if (!itemId || !name) return;

        let toast = document.getElementById('moderra-cart-toast');
        if (!toast) {
            toast = document.createElement('button');
            toast.type = 'button';
            toast.id = 'moderra-cart-toast';
            toast.className = 'moderra-cart-toast';
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
            toast.addEventListener('click', () => this.openCartAtItem(itemId));
        }

        toast.innerHTML = `<i class="fas fa-shopping-basket" aria-hidden="true"></i><span><strong>${name}</strong> sepete eklendi — görmek için dokunun</span>`;
        toast.onclick = () => this.openCartAtItem(itemId);

        clearTimeout(this._cartToastTimer);
        toast.classList.add('visible');
        this._cartToastTimer = setTimeout(() => toast.classList.remove('visible'), 7000);
    }

    openCartAtItem(itemId) {
        const toast = document.getElementById('moderra-cart-toast');
        toast?.classList.remove('visible');

        if (this.isOpen) this.closeChat();

        document.body.classList.add('cart-open');
        if (typeof window.updateCartDisplay === 'function') window.updateCartDisplay();

        requestAnimationFrame(() => {
            setTimeout(() => {
                const row = document.querySelector(`[data-cart-item-id="${itemId}"]`);
                row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row?.classList.add('cart-item-highlight');
                setTimeout(() => row?.classList.remove('cart-item-highlight'), 2200);
            }, 280);
        });
    }

    actionSuggestPackage() {
        setTimeout(() => {
            const el = document.getElementById('paketler');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            else window.location.href = 'index.html#paketler';
        }, 600);
    }

    actionOpenPage(url) {
        if (!url) return;
        const path = url.includes('.html') ? url : url + '.html';
        setTimeout(() => {
            window.location.href = path;
        }, 800);
    }

    scrollToBottom() {
        const m = document.getElementById('chatbot-messages');
        if (m) m.scrollTop = m.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.moderraAI = new ModerraAI();
});
