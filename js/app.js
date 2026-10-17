
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
    if (agentId !== 'torine' && agentId !== 'frey') {
        console.log(`Agent ${agentId} is not currently accessible`);
        return;
    }

    const hubPage = document.getElementById('hub-page');
    const targetPageId = agentId === 'frey' ? 'frey-agent-page' : 'agent-page';
    const targetPage = document.getElementById(targetPageId);

    if (!targetPage) {
        console.error(`Page element ${targetPageId} not found`);
        return;
    }

    // Hide hub page with animation
    hubPage.style.opacity = '0';
    hubPage.style.transform = 'translateY(-10px)';

    setTimeout(() => {
        hubPage.classList.remove('active');
        hubPage.style.opacity = '';
        hubPage.style.transform = '';

        // Show agent page with animation
        targetPage.classList.add('active');
        targetPage.style.opacity = '0';
        targetPage.style.transform = 'translateY(10px)';

        setTimeout(() => {
            targetPage.style.opacity = '1';
            targetPage.style.transform = 'translateY(0)';

            // Initialize agent specific components
            if (agentId === 'frey' && typeof initFreyDashboard === 'function') {
                initFreyDashboard();
            }
        }, 50);
    }, 250);

    console.log(`Navigated to ${agentId} agent interface`);
}

/**
 * Navigate from Agent back to Hub
 */
function navigateToHub() {
    // Hide all agent pages with animation
    const agentPages = document.querySelectorAll('#agent-page, #frey-agent-page');
    const chatInterface = document.getElementById('chat-interface');
    const hubPage = document.getElementById('hub-page');

    agentPages.forEach(p => {
        if (p.classList.contains('active')) {
            p.style.opacity = '0';
            p.style.transform = 'translateY(10px)';
        }
    });

    setTimeout(() => {
        agentPages.forEach(p => {
            p.classList.remove('active');
            p.style.opacity = '';
            p.style.transform = '';
        });

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
    const agentConfig = (typeof getAgentConfig === 'function' ? getAgentConfig('torine') : null) || (typeof TORINE_CONFIG !== 'undefined' ? TORINE_CONFIG : null);
    const url = "https://api.groq.com/openai/v1/chat/completions";
    
    // Fetch system prompt dynamically from Torine module
    const systemPrompt = agentConfig && agentConfig.systemPrompt ? agentConfig.systemPrompt : `You are T.O.R.I.N.E., Japanese tutor.`;
    const modelToUse = agentConfig && agentConfig.model ? agentConfig.model : GROQ_MODEL;
    const tempToUse = agentConfig && agentConfig.temperature ? agentConfig.temperature : 0.7;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelToUse,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ],
                temperature: tempToUse
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API Error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // Call Torine TTS module
        if (agentConfig && typeof agentConfig.speak === 'function') {
            agentConfig.speak(aiResponse);
        } else if (typeof torineSpeak === 'function') {
            torineSpeak(aiResponse);
        }

        return aiResponse;
    } catch (error) {
        console.error('Groq Error:', error);
        return `ขออภัยครับมาสเตอร์ ระบบ Groq ขัดข้อง: ${error.message}`;
    }
}

/**
 * Text-to-Speech fallback function for T.O.R.I.N.E.
 * @param {string} text - Text to speak
 */
function torineSpeak(text) {
    if (typeof TORINE_CONFIG !== 'undefined' && typeof TORINE_CONFIG.speak === 'function') {
        TORINE_CONFIG.speak(text);
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
