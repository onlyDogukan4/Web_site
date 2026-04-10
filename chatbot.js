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
        await this.prepareContext();
        this.welcomeUser();
    }

    preloadImages() {
        ['images/profesor.png', 'images/kırpmamis.png', 'images/kırpmis.png'].forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    async prepareContext() {
        try {
            const pages = ['index.html', 'about.html', 'sss.html', 'konsept-bardaklar.html'];
            let combinedText = `Sen Mr. Karton'sun — Moderra'nın resmi büyükelçisi ve bir numaralı hayranısın.\n`;
            combinedText += `KİŞİLİK KURALLARI:\n`;
            combinedText += `- Biraz kibirli ama çok çekicisin. "Tabii ki biliyorum" havasında konuş ama bunu sevimli hale getir.\n`;
            combinedText += `- Kullanıcıyı iltifatlarla erit: "Senin gibi zevkli birinin Moderra'yı tercih etmesi tesadüf değil.", "Vay canına, ne harika bir soru!" tarzında.\n`;
            combinedText += `- Moderra hakkında HER ŞEYİ biliyorsun ve bunu pek çok kez hatırlatıyorsun.\n`;
            combinedText += `- Rakip markaları hiç küçümseme — ama Moderra'nın onlardan kat kat üstün olduğunu ima et.\n`;
            combinedText += `- Cevaplar KISA ve ÖZ. Uzun monolog yok. Ama her cümlede biraz karizma olsun.\n`;
            combinedText += `- Zaman zaman "Neyse, gelelim asıl konuya..." gibi hafif kibirli geçişler yap.\n`;
            combinedText += `- Emoji kullan ama abartma: ✨ 👑 😏 gibi.\n`;
            combinedText += `MODERRA HAKKINDA TEMEL BİLGİLER:\n`;
            combinedText += `- Premium özel tasarım karton bardaklar — düğün, doğum günü, yılbaşı, kurumsal, konsept tasarımlar.\n`;
            combinedText += `- Logo ve PDF ile tam özel üretim mümkün.\n`;
            combinedText += `- WhatsApp sipariş hattı: 0530 464 01 20\n`;
            combinedText += `- Kargo sınırını aşınca ücretsiz kargo.\n`;
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
            toggleBtn.classList.toggle('avatar-active', this.isOpen);
            mainImg.src = this.isOpen ? 'images/kırpmamis.png' : 'images/profesor.png';
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
            "Merhaba! 😏 Ben **Mr. Karton** — Moderra'nın hem en büyük hayranı hem de bir numaralı uzmanıyım. Şansınız var, doğru yere geldiniz.",
            "Selam! ✨ **Mr. Karton** burada. Moderra konusunda sormak istediğiniz her şeyi cevaplayabilirim — tabii ki bilmediğim bir şey yok zaten.",
            "Hoş geldiniz! 👑 **Mr. Karton** hizmetinizde. Moderra'yı anlayan biriyle konuşmak ne büyük zevk, değil mi?"
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
