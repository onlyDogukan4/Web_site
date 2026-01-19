/**
 * Moderra AIv8 - Dr. Karton (Perfect Pro Persona)
 * Dr. Karton yaslanma pozu, devasa boyut ve dinamik ikon değişimi ile.
 */

// API Key moved to env.js for security
const GEMINI_API_KEY = window.ENV?.GEMINI_API_KEY || "";

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
        this.addEventListeners();
        this.startBlinking(); // Sadece açıkken tetiklenecek şekilde ayarlandı
        await this.prepareContext();
        this.welcomeUser();
    }

    async prepareContext() {
        try {
            const pages = ['index.html', 'about.html', 'sss.html', 'konsept-bardaklar.html'];
            let combinedText = "Sen Dr. Karton'sun. Moderra şirketinin hayranı ve uzman asistanısın. \n";
            combinedText += "KİŞİLİK: Nazik, profesyonel, Moderra aşığı ve bazen sevimli şekilde şımarık. \n";
            combinedText += "ÖNEMLİ KURAL: Cevapların her zaman KISA ve ÖZ olmalı. Uzun paragraflardan kaçın, her cevabın 2-3 cümleyi geçmesin. \n";
            for (const page of pages) {
                const res = await fetch(page);
                const html = await res.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');
                doc.querySelectorAll('script, style').forEach(s => s.remove());
                combinedText += `--- ${page} ---\n${doc.body.innerText.substring(0, 800)}\n\n`;
            }
            this.siteContext = combinedText + "\nWhatsApp: 0530 464 01 20.";
        } catch (e) {
            this.siteContext = "Sen Moderra asistanı Dr. Karton'sun.";
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
                        <img src="images/profesor.png" alt="Dr. Karton" class="header-avatar-mini" id="header-avatar-img">
                        <div class="chatbot-header-text">
                            <h3>Dr. Karton</h3>
                            <p>Moderra Uzmanı</p>
                        </div>
                    </div>
                </div>
                <div class="chatbot-messages" id="chatbot-messages"></div>
                <div id="ai-typing-indicator" style="display: none; padding: 10px 20px; font-size: 12px; color: #4338ca; font-weight: 600;">
                    <i class="fas fa-magic fa-spin"></i> Dr. Karton düşünüyor...
                </div>
                <div class="chatbot-input-area">
                    <input type="text" id="chatbot-input" placeholder="Dr. Karton'a danışın...">
                    <button class="chatbot-send-btn" id="chatbot-send">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
            <button class="chatbot-button" id="chatbot-toggle">
                <img src="images/profesor.png" alt="Dr. Karton" id="main-avatar-img">
            </button>
        `;
        document.body.appendChild(container);

        const style = document.createElement('style');
        style.textContent = `
            .chatbot-container { position: fixed; bottom: 30px; right: 30px; z-index: 10000; font-family: 'Inter', sans-serif; }
            
            .chatbot-button {
                background: none !important; border: none !important; cursor: pointer;
                width: 160px; height: 160px; padding: 0; z-index: 10002;
                transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
                outline: none !important; display: flex; align-items: center; justify-content: center;
                box-shadow: none !important;
            }

            .chatbot-button img { 
                width: 100%; height: 100%; object-fit: contain; 
                filter: drop-shadow(0 15px 30px rgba(0,0,0,0.2));
                transition: transform 0.3s ease;
            }

            .chatbot-window {
                position: absolute; bottom: 40px; right: 0; width: 420px; height: 650px;
                background: white; border-radius: 40px;
                box-shadow: 0 40px 80px rgba(0,0,0,0.25); display: flex; flex-direction: column;
                overflow: hidden; opacity: 0; transform: translateY(40px) scale(0.95);
                pointer-events: none; transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                z-index: 10001; border: 1px solid rgba(0,0,0,0.05);
            }

            .chatbot-window.active { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }

            /* GERÇEKÇİ DEVASA YASLANMA POZU */
            .chatbot-button.avatar-active {
                transform: translateX(-335px) translateY(-395px) scale(3.8) rotate(-4deg) !important; 
                filter: none !important;
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
            .chatbot-send-btn { background: #4338ca; color: white; border: none; width: 50px; height: 50px; border-radius: 12px; cursor: pointer; transition: 0.3s; }
            .chatbot-send-btn:hover { transform: scale(1.1); background: #3730a3; }
        `;
        document.head.appendChild(style);
    }

    startBlinking() {
        const mainImg = document.getElementById('main-avatar-img');

        setInterval(() => {
            // Sadece chat açıkken göz kırpma aktif olur
            if (this.isOpen && mainImg) {
                mainImg.src = 'images/kırpmis.png';

                setTimeout(() => {
                    if (this.isOpen && mainImg) {
                        mainImg.src = 'images/kırpmamis.png';
                    }
                }, 150);
            }
        }, 6000); // Daha yavaş göz kırpma (6 saniye)
    }

    addEventListeners() {
        const toggleBtn = document.getElementById('chatbot-toggle');
        const windowEl = document.getElementById('chatbot-window');
        const mainImg = document.getElementById('main-avatar-img');
        const headerImg = document.getElementById('header-avatar-img');
        const sendBtn = document.getElementById('chatbot-send');
        const inputEl = document.getElementById('chatbot-input');

        toggleBtn.addEventListener('click', () => {
            this.isOpen = !this.isOpen;
            windowEl.classList.toggle('active', this.isOpen);
            toggleBtn.classList.toggle('avatar-active', this.isOpen);

            // Görüntü değişimi: Kapalıyken profesor.png, açıkken kırpmamis.png
            if (this.isOpen) {
                mainImg.src = 'images/kırpmamis.png';
            } else {
                mainImg.src = 'images/profesor.png';
            }
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
        this.addBotMessage("Hoş geldiniz! Ben **Dr. Karton**, Moderra'nın en sadık hayranı! Size rehberlik etmek için sabırsızlanıyorum.");
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

        const modelName = "gemini-2.0-flash"; // Updated to newest 2.0 version
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
        const body = {
            system_instruction: { parts: [{ text: this.siteContext }] },
            contents: [
                ...this.chatHistory,
                { role: "user", parts: [{ text: prompt }] }
            ],
            generationConfig: { temperature: 0.9, maxOutputTokens: 2048 }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            const botText = data.candidates[0].content.parts[0].text;
            this.chatHistory.push({ role: "user", parts: [{ text: prompt }] });
            this.chatHistory.push({ role: "model", parts: [{ text: botText }] });
            this.addBotMessage(botText);
        } catch (e) {
            this.addBotMessage("Ufak bir aksaklık oldu, lütfen tekrar deneyin!");
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
