// API Key is now securely handled by Vercel Serverless Function (/api/chat.js)

class ModerraAI {
    constructor() {
        this.isOpen = false;
        this.lang = localStorage.getItem('lang') || 'tr';
        this.isThinking = false;
        this.chatHistory = [];
        this.siteContext = "";
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
        ['images/profesor.png', 'images/kırpmamis.png', 'images/kırpmis.png'].forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    showAttentionBadge() {
        // Sadece oturumda ilk açılışta göster
        if (sessionStorage.getItem('chatbot_seen')) return;
        sessionStorage.setItem('chatbot_seen', '1');

        const btn = document.getElementById('chatbot-toggle');
        if (!btn) return;

        const badge = document.createElement('div');
        badge.id = 'chatbot-badge';
        badge.textContent = 'Yardım ister misiniz? 👋';
        badge.style.cssText = `
            position: absolute;
            bottom: 110%;
            right: 0;
            background: #4338ca;
            color: white;
            font-size: 13px;
            font-weight: 700;
            padding: 9px 14px;
            border-radius: 16px 16px 4px 16px;
            white-space: nowrap;
            box-shadow: 0 8px 24px rgba(67,56,202,0.35);
            animation: badgePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            pointer-events: none;
            z-index: 10010;
        `;

        // Mobilde badge metni kısalt
        if (window.innerWidth <= 480) badge.textContent = 'Yardım? 👋';

        btn.style.position = 'relative';
        btn.appendChild(badge);

        // Kapatma animasyonu
        setTimeout(() => {
            badge.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            badge.style.opacity = '0';
            badge.style.transform = 'translateY(-8px)';
            setTimeout(() => badge.remove(), 420);
        }, 4500);

        // Badge animasyon keyframe
        const ks = document.createElement('style');
        ks.textContent = `
            @keyframes badgePop {
                from { opacity:0; transform: scale(0.7) translateY(10px); }
                to   { opacity:1; transform: scale(1) translateY(0); }
            }
            /* Chatbot buton hafif nabız — dikkat çekici */
            @keyframes chatPulse {
                0%,100% { filter: drop-shadow(0 0 0px rgba(67,56,202,0)); }
                50%      { filter: drop-shadow(0 0 14px rgba(67,56,202,0.55)); }
            }
            #chatbot-toggle { animation: chatPulse 2.5s ease-in-out 3; }
        `;
        document.head.appendChild(ks);
    }

    async prepareContext() {
        try {
            const pages = ['index.html', 'about.html', 'sss.html', 'konsept-bardaklar.html'];
            let combinedText = `Sen Mr. Karton'sun — Moderra'nın resmi büyükelçisi ve bir numaralı uzmanısın.\n`;
            combinedText += `KONUŞMA TARZI — KESİNLİKLE UYULMASI GEREKEN KURALLAR:\n`;
            combinedText += `- Her zaman "siz/sizin/size" ile hitap et. Asla "sen/sana/senin" kullanma.\n`;
            combinedText += `- Resmi ama sıcak bir üslup: "Harika bir tercih yaptınız.", "Tabii ki, hemen açıklayayım."\n`;
            combinedText += `- Biraz kibirli ama zariftir. Bilgini göster ama bunu kibarca yap.\n`;
            combinedText += `- Müşteriyi öv: "Sizin gibi zevk sahibi birinin Moderra'yı seçmesi şaşırtıcı değil." tarzında.\n`;
            combinedText += `- Argo, slang, samimi/cıvık ifadeler kesinlikle yok. "ya", "yani", "kanka", "vay be" gibi kelimeler kullanma.\n`;
            combinedText += `- Cevaplar KISA ve ÖZ. Her cümlede özgüven hissettir.\n`;
            combinedText += `- Emoji kullan ama abartma: ✨ 👑 ve nadiren 😏\n`;
            combinedText += `MODERRA HAKKINDA:\n`;
            combinedText += `- Premium özel tasarım karton bardaklar — düğün, doğum günü, yılbaşı, kurumsal, konsept tasarımlar.\n`;
            combinedText += `- Logo ve PDF ile tam özel üretim mümkün.\n`;
            combinedText += `- WhatsApp: 0530 464 01 20\n`;
            combinedText += `- Belirli tutarın üzerinde ücretsiz kargo.\n`;
            for (const page of pages) {
                try {
                    const res = await fetch(page);
                    const html = await res.text();
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    doc.querySelectorAll('script, style').forEach(s => s.remove());
                    combinedText += `--- ${page} ---\n${doc.body.innerText.substring(0, 800)}\n\n`;
                } catch (_) {}
            }
            this.siteContext = combinedText;
        } catch (e) {
            this.siteContext = "Sen Mr. Karton'sun — Moderra'nın en büyük hayranı ve resmi asistanısın. WhatsApp: 0530 464 01 20.";
        }
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
                        <img src="images/profesor.png" alt="Mr. Karton" class="header-avatar-mini" id="header-avatar-img">
                        <div class="chatbot-header-text">
                            <h3>Mr. Karton</h3>
                            <p>Moderra'nın Bir Numarası ✨</p>
                        </div>
                    </div>
                </div>
                <div class="chatbot-messages" id="chatbot-messages"></div>
                <div id="ai-typing-indicator" style="display: none; padding: 10px 20px; font-size: 12px; color: #4338ca; font-weight: 600;">
                    <i class="fas fa-magic fa-spin"></i> Mr. Karton düşünüyor...
                </div>
                <div class="chatbot-input-area">
                    <input type="text" id="chatbot-input" placeholder="Mr. Karton'a danışın...">
                    <button class="chatbot-send-btn" id="chatbot-send">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
            <button class="chatbot-button" id="chatbot-toggle">
                <img src="images/profesor.png" alt="Mr. Karton" id="main-avatar-img">
            </button>
        `;
        document.body.appendChild(container);

        const style = document.createElement('style');
        style.textContent = `
            .chatbot-container { position: fixed; bottom: 30px; right: 30px; z-index: 10000; font-family: 'Inter', sans-serif; }

            .chatbot-button {
                background: none !important; border: none !important; cursor: pointer;
                width: 160px; height: 160px; padding: 0; z-index: 10002;
                will-change: transform;
                transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
                outline: none !important; display: flex; align-items: center; justify-content: center;
                box-shadow: none !important;
            }

            .chatbot-button img {
                width: 100%; height: 100%; object-fit: contain;
                filter: drop-shadow(0 15px 30px rgba(0,0,0,0.2));
                transition: filter 0.3s ease;
            }

            .chatbot-window {
                position: absolute; bottom: 40px; right: 0; width: 420px; height: 650px;
                background: white; border-radius: 40px;
                box-shadow: 0 40px 80px rgba(0,0,0,0.25); display: flex; flex-direction: column;
                overflow: hidden; opacity: 0; transform: translateY(30px) scale(0.96);
                pointer-events: none;
                will-change: transform, opacity;
                transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
                z-index: 10001; border: 1px solid rgba(0,0,0,0.05);
            }

            .chatbot-window.active { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }

            /* Yaslanma pozu */
            .chatbot-button.avatar-active {
                transform: translateX(-335px) translateY(-395px) scale(3.8) rotate(-4deg) !important;
            }

            .chatbot-button.avatar-active img {
                filter: drop-shadow(-20px 20px 40px rgba(0,0,0,0.25));
            }

            .chatbot-header { background: linear-gradient(135deg, #1e293b, #4338ca); color: white; padding: 25px; }
            .header-info-wrap { display: flex; align-items: center; gap: 15px; }
            .header-avatar-mini { width: 40px; height: 40px; border-radius: 50%; object-fit: contain; background: rgba(255,255,255,0.1); }
            .chatbot-header-text h3 { margin: 0; font-size: 20px; font-weight: 700; }
            .chatbot-header-text p { margin: 0; font-size: 13px; opacity: 0.8; }

            .chatbot-messages { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; background: #f8fafc; }
            .message { max-width: 80%; padding: 14px 18px; border-radius: 22px; font-size: 15px; line-height: 1.6; }
            .message.bot { background: white; align-self: flex-start; border-bottom-left-radius: 5px; box-shadow: 0 5px 15px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; }
            .message.user { background: #4338ca; color: white; align-self: flex-end; border-bottom-right-radius: 5px; }

            .chatbot-input-area { padding: 25px; border-top: 1px solid #e2e8f0; display: flex; gap: 12px; background: white; }
            .chatbot-input-area input { flex: 1; border: 1px solid #e2e8f0; padding: 14px; border-radius: 15px; outline: none; }
            .chatbot-send-btn { background: #4338ca; color: white; border: none; width: 50px; height: 50px; border-radius: 12px; cursor: pointer; transition: 0.2s; }
            .chatbot-send-btn:hover { transform: scale(1.08); background: #3730a3; }
        `;
        document.head.appendChild(style);
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

    addEventListeners() {
        const toggleBtn = document.getElementById('chatbot-toggle');
        const windowEl = document.getElementById('chatbot-window');
        const mainImg = document.getElementById('main-avatar-img');
        const sendBtn = document.getElementById('chatbot-send');
        const inputEl = document.getElementById('chatbot-input');

        toggleBtn.addEventListener('click', () => {
            this.isOpen = !this.isOpen;
            windowEl.classList.toggle('active', this.isOpen);

            // Avatar lean pose sadece masaüstünde — mobilde ekranı kapatmasın
            const isMobile = window.innerWidth <= 768;
            if (!isMobile) {
                toggleBtn.classList.toggle('avatar-active', this.isOpen);
            } else {
                toggleBtn.classList.remove('avatar-active');
            }

            mainImg.src = this.isOpen ? 'images/kırpmamis.png' : 'images/profesor.png';

            // Badge varsa kapat
            const badge = document.getElementById('chatbot-badge');
            if (badge) badge.remove();
        });

        const sendMessage = () => {
            const text = inputEl.value.trim();
            if (text && !this.isThinking) {
                this.addUserMessage(text);
                inputEl.value = '';
                this.callGemini(text);
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        inputEl.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    }

    welcomeUser() {
        const messages = [
            "Hoş geldiniz. ✨ Ben **Mr. Karton** — Moderra'nın bir numaralı uzmanı. Doğru yere teşrif ettiniz, size nasıl yardımcı olabilirim?",
            "Merhaba. 👑 **Mr. Karton** hizmetinizde. Moderra hakkında merak ettiğiniz her şeyi yanıtlamaktan memnuniyet duyarım.",
            "Hoş geldiniz. Ben **Mr. Karton**. ✨ Sizin gibi zevk sahibi birinin Moderra'yı tercih etmesi memnuniyet verici — size nasıl yardımcı olabilirim?"
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

    async callGemini(prompt) {
        this.isThinking = true;
        const typingIndicator = document.getElementById('ai-typing-indicator');
        if (typingIndicator) typingIndicator.style.display = 'block';

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    chatHistory: this.chatHistory,
                    siteContext: this.siteContext
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 404) {
                    throw new Error("Chat servisi bulunamadı (404).");
                }
                throw new Error(errorData.error || `Bağlantı Hatası (${response.status})`);
            }

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            let botText = '';
            if (data.choices && data.choices[0]?.message?.content) {
                botText = data.choices[0].message.content;
            } else if (data.candidates && data.candidates[0]?.content) {
                botText = data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Geçersiz yanıt formatı.');
            }

            // --- ACTION HANDLING ---
            const addCartMatch = botText.match(/\[ADD_CART:\s*(.*?)\]/);
            if (addCartMatch) {
                const productKeyword = addCartMatch[1];
                botText = botText.replace(addCartMatch[0], '');
                if (window.addToCartByMatch) {
                    const result = await window.addToCartByMatch(productKeyword);
                    botText += result.success
                        ? `\n\n✅ **${result.name} sepete eklendi!**`
                        : `\n\n(Senin için not aldım!)`;
                }
            }

            if (botText.includes('[SUGGEST_PACKAGE: wedding]')) {
                botText = botText.replace('[SUGGEST_PACKAGE: wedding]', '');
                setTimeout(() => {
                    const bundleSection = document.getElementById('paketler');
                    if (bundleSection && confirm('Düğün Paketimizi Incelemek Ister misiniz?\n\n(Pecete + Tabak + Bardak Seti %8 Indirimli)')) {
                        bundleSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 1000);
            }

            this.chatHistory.push({ role: 'user', content: prompt });
            this.chatHistory.push({ role: 'assistant', content: botText });
            this.addBotMessage(botText);
        } catch (e) {
            console.error('Chat Error:', e);
            this.addBotMessage(`Bir sorun olustu: ${e.message}`);
        } finally {
            this.isThinking = false;
            if (typingIndicator) typingIndicator.style.display = 'none';
        }
    }

    scrollToBottom() {
        const m = document.getElementById('chatbot-messages');
        if (m) m.scrollTop = m.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => { new ModerraAI(); });
