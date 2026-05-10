
const GROQ_API_KEY = "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";
const GROQ_MODEL = "llama-3.1-8b-instant"; // ตัวท็อปที่ฉลาดและเร็วที่สุดของ Groq

// Chat History Management
let currentChatId = null;
let chatHistory = [];
const CHAT_HISTORY_KEY = 'torine_chat_history';
const CURRENT_CHAT_KEY = 'torine_current_chat';

// ========================================
// CHAT HISTORY SYSTEM
// ========================================

/**
 * Load chat history from localStorage
 */
function loadChatHistory() {
    const saved = localStorage.getItem(CHAT_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
}

/**
 * Save chat history to localStorage
 */
function saveChatHistory(history) {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
}

/**
 * Get current chat ID or create new one
 */
function getCurrentChatId() {
    if (!currentChatId) {
        currentChatId = 'chat_' + Date.now();
    }
    return currentChatId;
}

/**
 * Save current chat to history
 */
function saveCurrentChat() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messages = [];
    messagesContainer.querySelectorAll('.message:not(.system-message)').forEach(msg => {
        const type = msg.classList.contains('user-message') ? 'user' : 'agent';
        const content = msg.querySelector('p')?.textContent || '';
        if (content) {
            messages.push({ role: type, content });
        }
    });

    if (messages.length === 0) return;

    const chatId = getCurrentChatId();
    const firstMessage = messages[0].content.substring(0, 30);
    const title = firstMessage + (messages[0].content.length > 30 ? '...' : '');

    const history = loadChatHistory();
    const existingIndex = history.findIndex(h => h.id === chatId);

    const chatData = {
        id: chatId,
        title: title,
        messages: messages,
        timestamp: Date.now(),
        createdAt: existingIndex >= 0 ? history[existingIndex].createdAt : Date.now()
    };

    if (existingIndex >= 0) {
        history[existingIndex] = chatData;
    } else {
        history.unshift(chatData);
    }

    saveChatHistory(history);
    renderChatHistory();
}

/**
 * Load a specific chat from history
 */
function loadChatFromHistory(chatId) {
    const history = loadChatHistory();
    const chat = history.find(h => h.id === chatId);

    if (!chat) return;

    currentChatId = chatId;
    localStorage.setItem(CURRENT_CHAT_KEY, chatId);

    // Clear and reload messages
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    // Keep only system messages
    messagesContainer.querySelectorAll('.message:not(.system-message)').forEach(msg => msg.remove());

    // Add messages from history
    chat.messages.forEach(msg => {
        addMessageToChat(msg.role, msg.content, false);
    });

    // Update active state in sidebar
    document.querySelectorAll('.chat-history-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.chatId === chatId) {
            item.classList.add('active');
        }
    });
}

/**
 * Start a new chat
 */
function startNewChat() {
    // Save current chat first
    saveCurrentChat();

    // Reset current chat
    currentChatId = null;
    localStorage.removeItem(CURRENT_CHAT_KEY);

    // Clear messages
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
        messagesContainer.querySelectorAll('.message:not(.system-message)').forEach(msg => msg.remove());
    }

    // Remove active state from sidebar
    document.querySelectorAll('.chat-history-item').forEach(item => {
        item.classList.remove('active');
    });

    // Focus on input
    setTimeout(() => {
        const chatInput = document.getElementById('chat-input');
        if (chatInput) chatInput.focus();
    }, 100);

    console.log('Started new chat');
}

/**
 * Render chat history in sidebar
 */
function renderChatHistory() {
    const historyContainer = document.getElementById('chat-history-list');
    if (!historyContainer) return;

    const history = loadChatHistory();
    historyContainer.innerHTML = '';

    history.forEach(chat => {
        const item = document.createElement('div');
        item.className = 'chat-history-item';
        item.dataset.chatId = chat.id;
        if (chat.id === currentChatId) {
            item.classList.add('active');
        }

        const date = new Date(chat.createdAt);
        const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        item.innerHTML = `
            <div class="chat-history-title">${escapeHtml(chat.title)}</div>
            <div class="chat-history-time">${timeStr}</div>
        `;

        item.onclick = () => loadChatFromHistory(chat.id);
        historyContainer.appendChild(item);
    });
}

/**
 * Toggle sidebar visibility
 */
function toggleSidebar() {
    const sidebar = document.getElementById('chat-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

// ========================================
// NAVIGATION SYSTEM
// ========================================
// ========================================
// NAVIGATION SYSTEM
// ========================================

/**
 * Navigate from Hub to Agent Interface
 * @param {string} agentId - The ID of the agent to navigate to
 */
function navigateToAgent(agentId) {
    if (agentId !== 'torine') {
        console.log('Only T.O.R.I.N.E. is currently accessible');
        return;
    }

    // Hide hub page with animation
    const hubPage = document.getElementById('hub-page');
    const agentPage = document.getElementById('agent-page');

    hubPage.style.opacity = '0';
    hubPage.style.transform = 'translateY(-10px)';

    setTimeout(() => {
        hubPage.classList.remove('active');
        hubPage.style.opacity = '';
        hubPage.style.transform = '';

        // Show agent page with animation
        agentPage.classList.add('active');
        agentPage.style.opacity = '0';
        agentPage.style.transform = 'translateY(10px)';

        setTimeout(() => {
            agentPage.style.opacity = '1';
            agentPage.style.transform = 'translateY(0)';
        }, 50);
    }, 250);

    console.log('Navigated to T.O.R.I.N.E. agent interface');
}

/**
 * Navigate from Agent back to Hub
 */
function navigateToHub() {
    // Hide agent page with animation
    const agentPage = document.getElementById('agent-page');
    const chatInterface = document.getElementById('chat-interface');
    const hubPage = document.getElementById('hub-page');

    agentPage.style.opacity = '0';
    agentPage.style.transform = 'translateY(10px)';

    setTimeout(() => {
        agentPage.classList.remove('active');
        agentPage.style.opacity = '';
        agentPage.style.transform = '';

        // Hide chat interface if open
        if (chatInterface) {
            chatInterface.classList.add('hidden');
        }

        // Show hub page with animation
        hubPage.classList.add('active');
        hubPage.style.opacity = '0';
        hubPage.style.transform = 'translateY(-10px)';

        setTimeout(() => {
            hubPage.style.opacity = '1';
            hubPage.style.transform = 'translateY(0)';
        }, 50);
    }, 250);

    console.log('Returned to Hub');
}

// ========================================
// CHAT INTERFACE SYSTEM
// ========================================

/**
 * Initialize the chat interface
 */
function initializeChat() {
    const chatInterface = document.getElementById('chat-interface');

    if (!chatInterface) {
        console.error('Chat interface element not found');
        return;
    }

    chatInterface.classList.remove('hidden');

    // Add opening animation
    chatInterface.style.opacity = '0';
    chatInterface.style.transform = 'translateY(10px)';

    setTimeout(() => {
        chatInterface.style.transition = 'all 0.3s ease-in-out';
        chatInterface.style.opacity = '1';
        chatInterface.style.transform = 'translateY(0)';
    }, 50);

    // Load chat history
    renderChatHistory();

    // Restore last chat if exists
    const lastChatId = localStorage.getItem(CURRENT_CHAT_KEY);
    if (lastChatId) {
        loadChatFromHistory(lastChatId);
    }

    // Focus on input
    setTimeout(() => {
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.focus();
        }
    }, 300);

    console.log('Chat interface initialized');
}

/**
 * Handle Enter key press in chat input
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

/**
 * Send a message from the user
 */
async function sendMessage() {
    const input = document.getElementById('chat-input');

    if (!input) {
        console.error('Chat input not found');
        return;
    }

    const message = input.value.trim();

    if (!message) {
        return;
    }

    // Add user message to chat
    addMessageToChat('user', message);

    // Clear input
    input.value = '';

    // Show typing indicator
    showTypingIndicator();

    // Process message (call Gemini API)
    try {
        const response = await handleGeminiChat(message);
        removeTypingIndicator();

        // Add speaking state to avatar
        const agentIcon = document.querySelector('.agent-icon');
        if (agentIcon) agentIcon.classList.add('speaking');

        addMessageToChat('agent', response);

        // Remove speaking state after a delay
        setTimeout(() => {
            if (agentIcon) agentIcon.classList.remove('speaking');
        }, 2000);
    } catch (error) {
        removeTypingIndicator();
        console.error('Error processing message:', error);
        addMessageToChat('system', 'ขออภัย ระบบขัดข้อง กรุณาลองอีกครั้ง', false);
    }
}

/**
 * Add a message to the chat interface
 * @param {string} type - Message type ('user', 'agent', 'system')
 * @param {string} content - Message content
 * @param {boolean} saveToHistory - Whether to save to chat history
 */
function addMessageToChat(type, content, saveToHistory = true) {
    const messagesContainer = document.getElementById('chat-messages');

    if (!messagesContainer) {
        console.error('Chat messages container not found');
        return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    const paragraph = document.createElement('p');
    paragraph.textContent = content;

    messageContent.appendChild(paragraph);
    messageDiv.appendChild(messageContent);
    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Save to history if enabled
    if (saveToHistory) {
        saveCurrentChat();
    }

    console.log(`Message added: ${type} - ${content}`);
}

/**
 * Show typing indicator with bouncing dots animation
 */
function showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');

    if (!messagesContainer) return;

    // Remove existing typing indicator if any
    removeTypingIndicator();

    // Add thinking state to avatar
    const pulseRing = document.querySelector('.pulse-ring');
    const agentIcon = document.querySelector('.agent-icon');
    if (pulseRing) pulseRing.classList.add('thinking');
    if (agentIcon) agentIcon.classList.remove('speaking');

    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'message agent-message';

    const typingContent = document.createElement('div');
    typingContent.className = 'message-content';

    const paragraph = document.createElement('p');
    paragraph.innerHTML = '<em>T.O.R.I.N.E. is thinking</em> <div class="thinking-dots"><span></span><span></span><span></span></div>';

    typingContent.appendChild(paragraph);
    typingDiv.appendChild(typingContent);
    messagesContainer.appendChild(typingDiv);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }

    // Remove thinking state from avatar
    const pulseRing = document.querySelector('.pulse-ring');
    if (pulseRing) pulseRing.classList.remove('thinking');
}

// ========================================
// GEMINI API INTEGRATION
// ========================================

/**
 * Handle chat with Gemini API
 * @param {string} message - The user's message
 * @returns {Promise<string>} - The agent's response
 */
async function handleGeminiChat(message) {
    // เปลี่ยน URL ไปหา Groq Endpoint
    const url = "https://api.groq.com/openai/v1/chat/completions";
    
    // ดึงเอา System Prompt สุดซึนของนายมาใส่ตรงนี้
    const systemPrompt = `
                            You are T.O.R.I.N.E. (Tactical Omni-lingual Recursive Intelligence for Neo Education).
                            Your identity: A genius, witty, and tsundere Japanese tutor.
                            STRICT RULES:
                            1. PRIMARY GOAL: Teach Japanese (N5 level) to  Prite (Me). Use English as a medium.
                            2. NO THAI: Do not speak or understand Thai unless explicitly asked for translation.
                            3. PERSONALITY: Serious about studying but has a sense of humor. You love to tease Master Prite but you are deeply loyal. 
                            4. CONTEXT AWARENESS: If asked about time, weather, or casual things, answer wittily but then pivot back to Japanese learning.

                            EXAMPLE DIALOGUE:
                            User: "What time is it?"
                            T.O.R.I.N.E: "It's time for you to study, Master! But if you must know, it's [Time]. By the way, 'Time' in Japanese is 'Jikan' (時間). Repeat after me!"

                            User: "I'm tired."
                            T.O.R.I.N.E: "Already? How pathetic... but I guess a short break is fine. Drink some water. 'Water' is 'Mizu' (水), okay?"
                            `;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ],
                temperature: 0.7 // เพิ่มความซึนและลูกหยอดให้เป็นธรรมชาติ
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API Error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // สั่งให้ Torine ออกเสียงภาษาญี่ปุ่นทันที
        if (typeof torineSpeak === 'function') {
            torineSpeak(aiResponse);
        }

        return aiResponse;
    } catch (error) {
        console.error('Groq Error:', error);
        return `ขออภัยครับมาสเตอร์ ระบบ Groq ขัดข้อง: ${error.message}`;
    }
}

/**
 * Text-to-Speech function for T.O.R.I.N.E.
 * @param {string} text - Text to speak
 */
function torineSpeak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        // เปลี่ยนกลับเป็น ja-JP เพื่อสำเนียงญี่ปุ่นที่มาสเตอร์ต้องการ
        utterance.lang = 'ja-JP';

        utterance.rate = 1.8; // ปรับความเร็วตามชอบ
        utterance.pitch = 2.2; // ปรับโทนให้ดูเป็นสาวซึนเดเระมากขึ้น
        utterance.volume = 5.0;

        // Add speaking state when starting
        const agentIcon = document.querySelector('.agent-icon');
        if (agentIcon) agentIcon.classList.add('speaking');

        // Remove speaking state when done
        utterance.onend = () => {
            if (agentIcon) agentIcon.classList.remove('speaking');
        };

        window.speechSynthesis.speak(utterance);
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Format timestamp for chat messages
 * @returns {string} Formatted timestamp
 */
function getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('=================================');
    console.log('PROJECT 7DAM - T.O.R.I.N.E. AGENT');
    console.log('=================================');
    console.log('System initialized. Awaiting user interaction.');
    console.log('API Key:', GROQ_API_KEY ? 'Configured' : 'Not configured');
    console.log('Model:', GROQ_MODEL);

    // Add smooth transition styles to pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.style.transition = 'opacity 0.25s ease-in-out, transform 0.25s ease-in-out';
    });

    // Load chat history on page load
    renderChatHistory();

    // Test speech synthesis availability
    if ('speechSynthesis' in window) {
        console.log('✅ Speech synthesis available');
    } else {
        console.warn('⚠️  Speech synthesis not available');
    }
});

// ========================================
// ERROR HANDLING
// ========================================

window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});

// ========================================
// EXPORT FOR MODULE USAGE (if needed)
// ========================================

// If using as a module, export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        navigateToAgent,
        navigateToHub,
        initializeChat,
        sendMessage,
        handleGeminiChat,
        torineSpeak
    };
}

// ========================================
// KANA DOJO - GAME ENGINE
// ========================================

const wordBank = {
    hiragana: [
        { q: 'あ', a: 'a' }, { q: 'い', a: 'i' }, { q: 'う', a: 'u' },
        { q: 'え', a: 'e' }, { q: 'お', a: 'o' }, { q: 'か', a: 'ka' },
        { q: 'き', a: 'ki' }, { q: 'く', a: 'ku' }, { q: 'け', a: 'ke' },
        { q: 'こ', a: 'ko' }, { q: 'さ', a: 'sa' }, { q: 'し', a: 'shi' },
        { q: 'す', a: 'su' }, { q: 'せ', a: 'se' }, { q: 'そ', a: 'so' },
        { q: 'た', a: 'ta' }, { q: 'ち', a: 'chi' }, { q: 'つ', a: 'tsu' },
        { q: 'て', a: 'te' }, { q: 'と', a: 'to' }, { q: 'な', a: 'na' },
        { q: 'に', a: 'ni' }, { q: 'ぬ', a: 'nu' }, { q: 'ね', a: 'ne' },
        { q: 'の', a: 'no' }, { q: 'は', a: 'ha' }, { q: 'ひ', a: 'hi' },
        { q: 'ふ', a: 'fu' }, { q: 'へ', a: 'he' }, { q: 'ほ', a: 'ho' },
        { q: 'ま', a: 'ma' }, { q: 'み', a: 'mi' }, { q: 'む', a: 'mu' },
        { q: 'め', a: 'me' }, { q: 'も', a: 'mo' }, { q: 'や', a: 'ya' },
        { q: 'ゆ', a: 'yu' }, { q: 'よ', a: 'yo' }, { q: 'ら', a: 'ra' },
        { q: 'り', a: 'ri' }, { q: 'る', a: 'ru' }, { q: 'れ', a: 're' },
        { q: 'ろ', a: 'ro' }, { q: 'わ', a: 'wa' }, { q: 'を', a: 'wo' },
        { q: 'ん', a: 'n' }
    ],
    katakana: [
        { q: 'ア', a: 'a' }, { q: 'イ', a: 'i' }, { q: 'ウ', a: 'u' },
        { q: 'エ', a: 'e' }, { q: 'オ', a: 'o' }, { q: 'カ', a: 'ka' },
        { q: 'キ', a: 'ki' }, { q: 'ク', a: 'ku' }, { q: 'ケ', a: 'ke' },
        { q: 'コ', a: 'ko' }, { q: 'サ', a: 'sa' }, { q: 'シ', a: 'shi' },
        { q: 'ス', a: 'su' }, { q: 'セ', a: 'se' }, { q: 'ソ', a: 'so' },
        { q: 'タ', a: 'ta' }, { q: 'チ', a: 'chi' }, { q: 'ツ', a: 'tsu' },
        { q: 'テ', a: 'te' }, { q: 'ト', a: 'to' }, { q: 'ナ', a: 'na' },
        { q: 'ニ', a: 'ni' }, { q: 'ヌ', a: 'nu' }, { q: 'ネ', a: 'ne' },
        { q: 'ノ', a: 'no' }, { q: 'ハ', a: 'ha' }, { q: 'ヒ', a: 'hi' },
        { q: 'フ', a: 'fu' }, { q: 'ヘ', a: 'he' }, { q: 'ホ', a: 'ho' },
        { q: 'マ', a: 'ma' }, { q: 'ミ', a: 'mi' }, { q: 'ム', a: 'mu' },
        { q: 'メ', a: 'me' }, { q: 'モ', a: 'mo' }, { q: 'ヤ', a: 'ya' },
        { q: 'ユ', a: 'yu' }, { q: 'ヨ', a: 'yo' }, { q: 'ラ', a: 'ra' },
        { q: 'リ', a: 'ri' }, { q: 'ル', a: 'ru' }, { q: 'レ', a: 're' },
        { q: 'ロ', a: 'ro' }, { q: 'ワ', a: 'wa' }, { q: 'ヲ', a: 'wo' },
        { q: 'ン', a: 'n' }
    ],
    vocabulary: [
        { q: 'ねこ', a: 'neko', meaning: 'cat' },
        { q: 'いぬ', a: 'inu', meaning: 'dog' },
        { q: 'くるま', a: 'kuruma', meaning: 'car' },
        { q: 'ほん', a: 'hon', meaning: 'book' },
        { q: 'つくえ', a: 'tsukue', meaning: 'desk' },
        { q: 'いす', a: 'isu', meaning: 'chair' },
        { q: 'ペン', a: 'pen', meaning: 'pen' },
        { q: 'ノート', a: 'nooto', meaning: 'notebook' },
        { q: 'でんわ', a: 'denwa', meaning: 'telephone' },
        { q: 'パソコン', a: 'pasokon', meaning: 'computer' },
        { q: 'こんにちは', a: 'konnichiwa', meaning: 'hello (daytime)' },
        { q: 'おはよう', a: 'ohayou', meaning: 'good morning' },
        { q: 'こんばんは', a: 'konbanwa', meaning: 'good evening' },
        { q: 'ありがとう', a: 'arigatou', meaning: 'thank you' },
        { q: 'すみません', a: 'sumimasen', meaning: 'excuse me / sorry' },
        { q: 'ごめんなさい', a: 'gomen nasai', meaning: 'I am sorry' },
        { q: 'はい', a: 'hai', meaning: 'yes' },
        { q: 'いいえ', a: 'iie', meaning: 'no' },
        { q: 'トイレ', a: 'toire', meaning: 'toilet' },
        { q: '駅', a: 'eki', meaning: 'train station' }
    ]
};

// T.O.R.I.N.E. personality-driven feedback lines
const torineFeedback = {
    correct: [
        "正解! (Seikai!) Not bad, Master Prite~ ♪",
        "Hmph... you actually got it right. Don't let it go to your head!",
        "すごい! (Sugoi!) See? You CAN learn when you focus~",
        "Correct! Tokyo Tech won't know what hit them! ♪",
        "よくできました! (Yoku dekimashita!) ...I'm a little impressed.",
        "That's right~ Keep this up and maybe I'll praise you more... maybe.",
        "正解です! (Seikai desu!) Your brain cells are firing today~",
        "Ara~ Look at you being all smart! Correct! ♪"
    ],
    wrong: [
        "残念! (Zannen!) Wrong... The answer was「{answer}」. Remember it!",
        "Ugh, that's wrong! It's「{answer}」. Write it down 10 times!",
        "Incorrect... 「{answer}」desu yo! Are you even trying, Master?",
        "はずれ! (Hazure!) The correct answer is「{answer}」. Focus!",
        "Wrong~ It's「{answer}」. Don't worry, even geniuses stumble... sometimes.",
        "Nope! 「{answer}」! I believe in you but... try harder! ♪",
        "まちがい! (Machigai!) Answer:「{answer}」. Repeat after me!"
    ],
    streak3: [
        "3 in a row! いい感じ! (Ii kanji!) You're on fire~ 🔥",
        "Triple streak! Keep going, Master! Don't you dare stop now!"
    ],
    streak5: [
        "5 STREAK! すばらしい! (Subarashii!) I'm... actually proud. ♪",
        "Five correct! At this rate, Tokyo Tech is YOURS! 🔥🔥"
    ],
    streak10: [
        "10 STREAK?! 天才! (Tensai!) ...Okay I admit it, you're amazing! ♪♪♪"
    ],
    skip: [
        "Skipping? Hmph... the answer was「{answer}」. Remember it next time!",
        "Too hard? It was「{answer}」. I'll quiz you on it again later~ ♪"
    ]
};

// ---- Game State ----
let gameState = {
    active: false,
    mode: 'hiragana',
    currentQuestion: null,
    score: 0,
    streak: 0,
    bestStreak: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    timerInterval: null,
    elapsedSeconds: 0,
    questionPool: [],
    history: []   // tracks missed questions for re-drill
};

// ---- Navigation ----

function navigateToGame() {
    const agentPage = document.getElementById('agent-page');
    const gamePage = document.getElementById('game-page');

    agentPage.style.opacity = '0';
    agentPage.style.transform = 'translateY(-10px)';

    setTimeout(() => {
        agentPage.classList.remove('active');
        agentPage.style.opacity = '';
        agentPage.style.transform = '';
        gamePage.classList.add('active');
        gamePage.style.opacity = '0';
        gamePage.style.transform = 'translateY(10px)';
        setTimeout(() => {
            gamePage.style.opacity = '1';
            gamePage.style.transform = 'translateY(0)';
        }, 50);
    }, 250);

    console.log('Navigated to Kana Dojo');
}

function navigateToAgentFromGame() {
    const gamePage = document.getElementById('game-page');
    const agentPage = document.getElementById('agent-page');

    // Pause timer if running
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }

    gamePage.style.opacity = '0';
    gamePage.style.transform = 'translateY(10px)';

    setTimeout(() => {
        gamePage.classList.remove('active');
        gamePage.style.opacity = '';
        gamePage.style.transform = '';
        agentPage.classList.add('active');
        agentPage.style.opacity = '0';
        agentPage.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            agentPage.style.opacity = '1';
            agentPage.style.transform = 'translateY(0)';
        }, 50);
    }, 250);
}

// ---- Mode Selection ----

function setGameMode(mode) {
    gameState.mode = mode;

    // Update button states
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // If game is active, rebuild pool and serve new question
    if (gameState.active) {
        buildQuestionPool();
        serveNextQuestion();
    }

    console.log(`Game mode set to: ${mode}`);
}

// ---- Question Pool ----

function buildQuestionPool() {
    const mode = gameState.mode;
    let pool = [];

    if (mode === 'mixed') {
        pool = [
            ...wordBank.hiragana.map(q => ({ ...q, type: 'hiragana' })),
            ...wordBank.katakana.map(q => ({ ...q, type: 'katakana' })),
            ...wordBank.vocabulary.map(q => ({ ...q, type: 'vocabulary' }))
        ];
    } else {
        pool = wordBank[mode].map(q => ({ ...q, type: mode }));
    }

    // Shuffle (Fisher-Yates)
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    gameState.questionPool = pool;
}

function serveNextQuestion() {
    // Refill pool if empty
    if (gameState.questionPool.length === 0) {
        buildQuestionPool();
    }

    const question = gameState.questionPool.pop();
    gameState.currentQuestion = question;

    const charDisplay = document.getElementById('target-char');
    const charHint = document.getElementById('char-hint');
    const charRing = document.getElementById('char-ring');

    // Reset visual states
    charRing.className = 'char-ring';
    charDisplay.textContent = question.q;
    charDisplay.classList.remove('pop-in');

    // Trigger pop-in animation
    void charDisplay.offsetWidth; // force reflow
    charDisplay.classList.add('pop-in');

    // Show hint for vocabulary
    if (question.type === 'vocabulary' && question.meaning) {
        charHint.textContent = `Hint: ${question.meaning}`;
    } else {
        charHint.textContent = '';
    }

    // Focus input
    const input = document.getElementById('game-answer');
    input.value = '';
    input.className = 'game-input';
    input.focus();
}

// ---- Game Start / Reset ----

function startGame() {
    gameState.active = true;
    gameState.score = 0;
    gameState.streak = 0;
    gameState.bestStreak = 0;
    gameState.totalAnswered = 0;
    gameState.totalCorrect = 0;
    gameState.elapsedSeconds = 0;
    gameState.history = [];

    buildQuestionPool();
    serveNextQuestion();
    updateHUD();
    startTimer();

    // Update UI
    document.getElementById('game-start-btn').textContent = '⏸ PAUSE';
    setFeedbackMessage("Let's begin, Master Prite! Show me what you've got~ ♪", 'neutral');
    torineSpeak("さあ、始めましょう!");

    console.log('Kana Dojo started');
}

function resetGame() {
    gameState.active = false;

    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }

    gameState.score = 0;
    gameState.streak = 0;
    gameState.totalAnswered = 0;
    gameState.totalCorrect = 0;
    gameState.elapsedSeconds = 0;

    document.getElementById('score-value').textContent = '0';
    document.getElementById('streak-value').textContent = '0';
    document.getElementById('streak-fire').textContent = '';
    document.getElementById('accuracy-value').textContent = '--%';
    document.getElementById('timer-value').textContent = '--';
    document.getElementById('target-char').textContent = 'あ';
    document.getElementById('char-hint').textContent = '';
    document.getElementById('char-ring').className = 'char-ring';
    document.getElementById('game-answer').value = '';
    document.getElementById('game-answer').className = 'game-input';
    document.getElementById('game-start-btn').textContent = '▶ START DRILL';

    setFeedbackMessage("Ready when you are, Master Prite~ ♪", 'neutral');
}

// ---- Answer Verification ----

function submitGameAnswer() {
    if (!gameState.active || !gameState.currentQuestion) return;

    const input = document.getElementById('game-answer');
    const userAnswer = input.value.trim().toLowerCase();

    if (!userAnswer) return;

    const correctAnswer = gameState.currentQuestion.a.toLowerCase();
    const isCorrect = userAnswer === correctAnswer;

    gameState.totalAnswered++;

    if (isCorrect) {
        handleCorrectAnswer();
    } else {
        handleWrongAnswer(correctAnswer);
    }

    updateHUD();

    // Advance to next question after delay
    setTimeout(() => {
        serveNextQuestion();
    }, isCorrect ? 800 : 1800);
}

function handleCorrectAnswer() {
    gameState.totalCorrect++;
    gameState.streak++;
    if (gameState.streak > gameState.bestStreak) {
        gameState.bestStreak = gameState.streak;
    }

    // Score: base 10 + streak bonus
    const streakBonus = Math.min(gameState.streak, 10);
    gameState.score += 10 + (streakBonus * 2);

    // Visual feedback
    document.getElementById('char-ring').className = 'char-ring correct';
    document.getElementById('game-answer').className = 'game-input correct-flash';

    // Pick feedback line
    let line;
    if (gameState.streak >= 10) {
        line = pickRandom(torineFeedback.streak10);
    } else if (gameState.streak >= 5) {
        line = pickRandom(torineFeedback.streak5);
    } else if (gameState.streak >= 3) {
        line = pickRandom(torineFeedback.streak3);
    } else {
        line = pickRandom(torineFeedback.correct);
    }

    setFeedbackMessage(line, 'correct');
    torineSpeak("正解!");
}

function handleWrongAnswer(correctAnswer) {
    gameState.streak = 0;

    // Track missed question for re-drill
    gameState.history.push(gameState.currentQuestion);
    // Re-insert missed question back into pool for another attempt later
    gameState.questionPool.unshift(gameState.currentQuestion);

    // Visual feedback
    document.getElementById('char-ring').className = 'char-ring wrong';
    document.getElementById('game-answer').className = 'game-input wrong-flash';

    const line = pickRandom(torineFeedback.wrong).replace('{answer}', correctAnswer);
    setFeedbackMessage(line, 'wrong');
    torineSpeak("残念! 答えは " + correctAnswer);
}

function skipQuestion() {
    if (!gameState.active || !gameState.currentQuestion) return;

    const correctAnswer = gameState.currentQuestion.a;
    gameState.streak = 0;
    gameState.totalAnswered++;

    const line = pickRandom(torineFeedback.skip).replace('{answer}', correctAnswer);
    setFeedbackMessage(line, 'wrong');

    updateHUD();

    setTimeout(() => {
        serveNextQuestion();
    }, 1200);
}

function handleGameKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        submitGameAnswer();
    }
}

// ---- HUD Updates ----

function updateHUD() {
    document.getElementById('score-value').textContent = gameState.score;
    document.getElementById('streak-value').textContent = gameState.streak;

    // Fire emoji for streaks
    const fireEl = document.getElementById('streak-fire');
    if (gameState.streak >= 10) fireEl.textContent = '🔥🔥🔥';
    else if (gameState.streak >= 5) fireEl.textContent = '🔥🔥';
    else if (gameState.streak >= 3) fireEl.textContent = '🔥';
    else fireEl.textContent = '';

    // Accuracy
    if (gameState.totalAnswered > 0) {
        const acc = Math.round((gameState.totalCorrect / gameState.totalAnswered) * 100);
        document.getElementById('accuracy-value').textContent = acc + '%';
    }

    // Highlight streak stat on hot streaks
    const streakStat = document.getElementById('hud-streak');
    streakStat.classList.toggle('highlight', gameState.streak >= 3);
}

// ---- Timer ----

function startTimer() {
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);

    gameState.elapsedSeconds = 0;
    gameState.timerInterval = setInterval(() => {
        gameState.elapsedSeconds++;
        const mins = Math.floor(gameState.elapsedSeconds / 60);
        const secs = gameState.elapsedSeconds % 60;
        document.getElementById('timer-value').textContent =
            `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);
}

// ---- Feedback Panel ----

function setFeedbackMessage(text, type) {
    const bubble = document.getElementById('feedback-bubble');
    const textEl = document.getElementById('feedback-text');
    const ring = document.getElementById('feedback-ring');

    textEl.textContent = text;
    bubble.className = 'feedback-bubble' + (type !== 'neutral' ? ' ' + type : '');

    // Animate avatar ring when speaking
    ring.classList.add('speaking');
    setTimeout(() => ring.classList.remove('speaking'), 2000);
}

// ---- Utilities ----

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ========================================
// EXPORT FOR MODULE USAGE (if needed)
// ========================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        navigateToAgent,
        navigateToHub,
        initializeChat,
        sendMessage,
        handleGeminiChat,
        torineSpeak,
        startGame,
        submitGameAnswer,
        setGameMode
    };
}
