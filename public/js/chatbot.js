(function() {
    // Inject Chatbot HTML
    const chatbotHTML = `
    <div id="ai-chat-widget">
        <button id="ai-chat-toggle" aria-label="Open AI Assistant">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </button>
        <div id="ai-chat-window" class="ai-chat-hidden">
            <div class="ai-chat-header">
                <div>
                    <strong>Bubbles</strong>
                    <span style="display:block; font-size:12px; font-weight:normal; opacity:0.8;">Powered by Gemini AI</span>
                </div>
                <button id="ai-chat-close" aria-label="Close chat">&times;</button>
            </div>
            <div id="ai-chat-messages">
                <div class="ai-message ai-message-bot">
                    <div class="ai-message-content">Hello! I'm Bubbles. I can help you find products, give recommendations, and help you checkout. What are you looking for today?</div>
                </div>
            </div>
            <div class="ai-chat-input-area">
                <textarea id="ai-chat-input" placeholder="Type your message..." rows="1" aria-label="Chat input"></textarea>
                <button id="ai-chat-send" aria-label="Send message">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </div>
        </div>
    </div>
    <style>
        #ai-chat-widget {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 9999;
            font-family: 'Poppins', Arial, sans-serif;
        }
        #ai-chat-toggle {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #8a0c0c;
            color: white;
            border: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s ease;
        }
        #ai-chat-toggle:hover {
            transform: scale(1.05);
        }
        #ai-chat-toggle svg {
            width: 28px;
            height: 28px;
        }
        #ai-chat-window {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 360px;
            height: 520px;
            max-height: calc(100vh - 120px);
            background: #ece7dc;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.25);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: opacity 0.3s ease, transform 0.3s ease;
            transform-origin: bottom right;
        }
        #ai-chat-window.ai-chat-hidden {
            opacity: 0;
            transform: scale(0.8);
            pointer-events: none;
        }
        .ai-chat-header {
            background: #36322b;
            color: white;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 16px;
        }
        #ai-chat-close {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            line-height: 1;
        }
        #ai-chat-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .ai-message {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-width: 85%;
        }
        .ai-message-bot {
            align-self: flex-start;
        }
        .ai-message-user {
            align-self: flex-end;
        }
        .ai-message-content {
            padding: 12px 16px;
            border-radius: 18px;
            font-size: 14px;
            line-height: 1.5;
            white-space: pre-wrap;
        }
        .ai-message-bot .ai-message-content {
            background: white;
            color: #111;
            border-bottom-left-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .ai-message-user .ai-message-content {
            background: #a6814c;
            color: white;
            border-bottom-right-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .ai-chat-input-area {
            padding: 12px;
            background: white;
            border-top: 1px solid #ddd;
            display: flex;
            align-items: flex-end;
            gap: 8px;
        }
        #ai-chat-input {
            flex: 1;
            border: 1px solid #ccc;
            border-radius: 20px;
            padding: 10px 16px;
            font-family: inherit;
            font-size: 14px;
            resize: none;
            outline: none;
            max-height: 120px;
        }
        #ai-chat-input:focus {
            border-color: #a6814c;
        }
        #ai-chat-send {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #8a0c0c;
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: background 0.2s;
        }
        #ai-chat-send:hover {
            background: #6a0808;
        }
        #ai-chat-send svg {
            width: 18px;
            height: 18px;
            transform: translateX(-1px) translateY(1px);
        }
        .ai-typing-indicator {
            display: flex;
            gap: 4px;
            padding: 16px;
            background: white;
            border-radius: 18px;
            border-bottom-left-radius: 4px;
            width: fit-content;
        }
        .ai-typing-dot {
            width: 6px;
            height: 6px;
            background: #aaa;
            border-radius: 50%;
            animation: ai-typing 1.4s infinite ease-in-out;
        }
        .ai-typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .ai-typing-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes ai-typing {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
        


        @media (max-width: 480px) {
            #ai-chat-window {
                width: calc(100vw - 32px);
                right: -8px;
            }
        }
    </style>
    `;

    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    const toggleBtn = document.getElementById('ai-chat-toggle');
    const chatWindow = document.getElementById('ai-chat-window');
    const closeBtn = document.getElementById('ai-chat-close');
    const inputField = document.getElementById('ai-chat-input');
    const sendBtn = document.getElementById('ai-chat-send');
    const messagesContainer = document.getElementById('ai-chat-messages');

    let chatHistory = [];

    // Toggle logic
    toggleBtn.addEventListener('click', () => {
        chatWindow.classList.toggle('ai-chat-hidden');
        if (!chatWindow.classList.contains('ai-chat-hidden')) {
            inputField.focus();
        }
    });

    closeBtn.addEventListener('click', () => {
        chatWindow.classList.add('ai-chat-hidden');
    });

    // Auto-resize textarea
    inputField.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    inputField.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    function formatPrice(num) {
        return 'PHP ' + Number(num).toLocaleString('en-PH', {minimumFractionDigits:2});
    }

    async function sendMessage() {
        const text = inputField.value.trim();
        if (!text) return;

        inputField.value = '';
        inputField.style.height = 'auto';

        // Add user message
        appendMessage('user', text);
        chatHistory.push({ role: 'user', text });

        // Show typing indicator
        const typingId = showTyping();

        try {
            const response = await fetch('/api/v1/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: chatHistory })
            });

            const data = await response.json();
            removeTyping(typingId);

            if (data.reply) {
                appendMessage('bot', data.reply);
                chatHistory.push({ role: 'bot', text: data.reply });
            } else {
                appendMessage('bot', 'Sorry, I encountered an error. Please try again.');
            }
        } catch (error) {
            console.error('Chat error:', error);
            removeTyping(typingId);
            appendMessage('bot', 'Network error. Could not reach the server.');
        }
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function appendMessage(role, text) {
        const div = document.createElement('div');
        div.className = `ai-message ai-message-${role}`;
        
        const content = document.createElement('div');
        content.className = 'ai-message-content';
        
        // Remove any escaping the AI might have accidentally added to brackets
        let cleanText = text.replace(/\\\[/g, '[').replace(/\\\]/g, ']').replace(/\\\(/g, '(').replace(/\\\)/g, ')');
        
        let htmlText = escapeHtml(cleanText)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\[([^\]]+)\]\s*\(([^)]+)\)/g, '<a href="$2" target="_blank" style="text-decoration:underline; color:inherit; font-weight:600;">$1</a>');
            
        content.innerHTML = htmlText;
        
        div.appendChild(content);
        messagesContainer.appendChild(div);
        scrollToBottom();
        return div;
    }

    function showTyping() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'ai-message ai-message-bot';
        div.innerHTML = `
            <div class="ai-typing-indicator">
                <div class="ai-typing-dot"></div>
                <div class="ai-typing-dot"></div>
                <div class="ai-typing-dot"></div>
            </div>
        `;
        messagesContainer.appendChild(div);
        scrollToBottom();
        return id;
    }

    function removeTyping(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }


})();
