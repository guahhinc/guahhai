/**
 * Guahh AI - Interface Controller with Chat History
 * Session management, sidebar, and chat interface
 */

// ========== SESSION MANAGEMENT ==========

// Global State
let activeChat, activeInput, activeBtn, logView, statusText;
let lastUserQuery = '';
const feedbackData = [];

// Session Management
let currentSession = null;
const STORAGE_KEY = 'guahh_chat_sessions';
const MAX_SESSIONS = 50; // Limit to prevent localStorage overflow

// Session Class
class ChatSession {
    constructor(id = null) {
        this.id = id || `session_${Date.now()}`;
        this.title = 'New Chat';
        this.created = Date.now();
        this.lastUpdated = Date.now();
        this.messages = [];
    }

    addMessage(role, content) {
        this.messages.push({
            role, // 'user' or 'assistant'
            content,
            timestamp: Date.now()
        });
        this.lastUpdated = Date.now();

        // Auto-generate title from first user message
        if (role === 'user' && this.title === 'New Chat') {
            this.title = this.generateTitle(content);
        }
    }

    generateTitle(message) {
        const maxLength = 50;
        let title = message.trim();
        if (title.length > maxLength) {
            title = title.substring(0, maxLength) + '...';
        }
        return title;
    }
}

// Session Storage Functions
function getAllSessions() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error loading sessions:', e);
        return [];
    }
}

function saveSession(session) {
    try {
        let sessions = getAllSessions();

        // Update or add session
        const index = sessions.findIndex(s => s.id === session.id);
        if (index !== -1) {
            sessions[index] = session;
        } else {
            sessions.unshift(session); // Add to beginning
        }

        // Limit number of sessions
        if (sessions.length > MAX_SESSIONS) {
            sessions = sessions.slice(0, MAX_SESSIONS);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        renderSessionList();
    } catch (e) {
        console.error('Error saving session:', e);
    }
}

function deleteSession(sessionId) {
    try {
        let sessions = getAllSessions();
        sessions = sessions.filter(s => s.id !== sessionId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));

        // If deleted current session, create new one
        if (currentSession && currentSession.id === sessionId) {
            createNewChat();
        } else {
            renderSessionList();
        }
    } catch (e) {
        console.error('Error deleting session:', e);
    }
}

function loadSession(sessionId) {
    const sessions = getAllSessions();
    const sessionData = sessions.find(s => s.id === sessionId);

    if (!sessionData) return;

    // Reconstruct session object
    currentSession = new ChatSession(sessionData.id);
    Object.assign(currentSession, sessionData);

    // Clear and reload messages
    if (activeChat) {
        activeChat.innerHTML = '';

        sessionData.messages.forEach(msg => {
            if (msg.role === 'user') {
                addMessage(msg.content, true);
            } else {
                // Skip typing animation for loaded messages
                const aiMsg = addMessage(msg.content, false, true);
                // Don't add feedback buttons to loaded messages
            }
        });
    }

    renderSessionList();
}

function createNewChat() {
    // Save current session if it has messages
    if (currentSession && currentSession.messages.length > 0) {
        saveSession(currentSession);
    }

    // Create new session
    currentSession = new ChatSession();

    // Clear chat area
    if (activeChat) {
        activeChat.innerHTML = '';
    }

    // Clear input
    if (activeInput) {
        activeInput.value = '';
        activeInput.style.height = 'auto';
    }

    renderSessionList();
}

function renderSessionList() {
    const sessionList = document.getElementById('sessionList');
    if (!sessionList) return;

    const sessions = getAllSessions();

    if (sessions.length === 0) {
        sessionList.innerHTML = '<div class="session-list-empty">No chat history yet.<br>Start a conversation!</div>';
        return;
    }

    sessionList.innerHTML = sessions.map(session => {
        const isActive = currentSession && currentSession.id === session.id;
        const date = new Date(session.lastUpdated);
        const dateStr = formatDate(date);

        return `
            <div class="session-item ${isActive ? 'active' : ''}" data-session-id="${session.id}">
                <div class="session-text">
                    <div class="session-title">${escapeHtml(session.title)}</div>
                    <div class="session-date">${dateStr}</div>
                </div>
                <button class="session-delete" data-session-id="${session.id}" title="Delete chat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
    }).join('');

    // Add click handlers
    sessionList.querySelectorAll('.session-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.session-delete')) {
                loadSession(item.dataset.sessionId);
                // Close sidebar on mobile
                if (window.innerWidth <= 768) {
                    toggleSidebar();
                }
            }
        });
    });

    sessionList.querySelectorAll('.session-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSession(btn.dataset.sessionId);
        });
    });
}

function formatDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Sidebar Toggle (Mobile)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

// Fallback dictionary
const localFallbackMemory = [
    { q: "hi", a: "Hello! I am Guahh AI 1 (a). I'm running in Local Mode. My deep memory is offline, but I can still answer math questions and search Wikipedia! Try asking 'What is an apple?'", tokens: ["hi"] },
    { q: "hello", a: "Hello! I am Guahh AI 1 (a). I'm running in Local Mode. My deep memory is offline, but I can still answer math questions and search Wikipedia! Try asking 'What is an apple?'", tokens: ["hello"] },
    { q: "who are you", a: "I am Guahh AI 1 (a).", tokens: ["who", "are", "you"] }
];

// Make globally available for HTML onclick
window.sendMessage = async function () {
    console.log("sendMessage called");
    if (!activeInput) {
        console.error("Interface not initialized");
        return;
    }

    const text = activeInput.value.trim();
    if (!text) return;

    // CHECK PROMPT LIMIT
    if (!checkPromptLimit()) {
        const msg = addMessage("You have reached your daily limit of 30 prompts. Please log in with a Guahh Account for unlimited access.", false);
        // Add login button to the message
        const loginBtn = document.createElement('button');
        loginBtn.className = 'feedback-btn'; // Reuse style
        loginBtn.innerHTML = 'Sign In with Guahh Account';
        loginBtn.style.marginTop = '10px';
        loginBtn.onclick = () => GuahhAuthAPI.showLogin();
        msg.querySelector('.message-content').appendChild(loginBtn);
        return; // Stop execution
    }

    // Create session if none exists
    if (!currentSession) {
        currentSession = new ChatSession();
    }

    lastUserQuery = text;
    activeInput.value = '';
    activeInput.style.height = 'auto';
    activeBtn.disabled = true;

    // Add to session
    currentSession.addMessage('user', text);

    // User msg
    addMessage(text, true);

    // Show typing indicator
    const typingIndicator = addTypingIndicator();

    // Thought simulation delay
    await new Promise(r => setTimeout(r, 600));

    // Generate
    if (typeof GuahhEngine === 'undefined') {
        removeTypingIndicator(typingIndicator);
        addMessage("System Error: Neural Engine not loaded.", false);
        activeBtn.disabled = false;
        return;
    }

    // Lazy Init fallback if not ready
    if (!GuahhEngine.isReady) {
        console.warn("Engine not ready, forcing fallback init...");
        GuahhEngine.init(localFallbackMemory, logToTerminal);
        if (statusText) statusText.innerText = 'Guahh AI 1 (a) (Local)';
    }

    if (!GuahhEngine.isReady) {
        // If STILL not ready
        removeTypingIndicator(typingIndicator);
        addMessage("System Error: Neural Core failed to initialize.", false);
        activeBtn.disabled = false;
        return;
    }

    const result = await GuahhEngine.generateResponse(text);

    // Remove typing indicator
    removeTypingIndicator(typingIndicator);

    // Add to session
    currentSession.addMessage('assistant', result.text);
    saveSession(currentSession);

    // Render AI Msg with feedback buttons
    const aiMessageElement = addMessage(result.text, false);
    addFeedbackButtons(aiMessageElement, lastUserQuery, result.text);

    activeBtn.disabled = false;
};

// Helper Functions
function addMessage(text, isUser, skipTyping = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isUser ? 'user' : 'ai'}`;

    if (!isUser) {
        msgDiv.innerHTML = `
            <div class="message-label">Guahh AI 1 (a)</div>
            <div class="message-content"></div>
        `;
        const contentDiv = msgDiv.querySelector('.message-content');
        if (skipTyping) {
            // Show instantly for chat history
            contentDiv.innerHTML = formatMarkdown(text);
        } else {
            // Animated typing for new messages
            typeWriter(contentDiv, text);
        }
    } else {
        msgDiv.innerHTML = `
            <div class="message-label">You</div>
            <div class="message-content">${text}</div>
        `;
    }

    if (activeChat) {
        activeChat.appendChild(msgDiv);
        activeChat.scrollTop = activeChat.scrollHeight;
    }
    return msgDiv;
}

function typeWriter(element, text) {
    let i = 0;
    const speed = 10;
    function type() {
        if (i < text.length) {
            const char = text.charAt(i);
            element.innerHTML += (char === '\n') ? '<br>' : char;
            i++;
            if (activeChat) activeChat.scrollTop = activeChat.scrollHeight;
            setTimeout(type, speed);
        } else {
            // When done typing, apply markdown formatting while preserving line breaks
            element.innerHTML = formatMarkdown(text);
            if (activeChat) activeChat.scrollTop = activeChat.scrollHeight;
        }
    }
    type();
}

function formatMarkdown(text) {
    // First replace all newlines with <br> tags
    let formatted = text.replace(/\n/g, '<br>');
    // Then apply bold formatting
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    return formatted;
}

function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-label">Guahh AI 1 (a)</div>
        <div class="message-content">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
        </div>
    `;
    if (activeChat) {
        activeChat.appendChild(typingDiv);
        activeChat.scrollTop = activeChat.scrollHeight;
    }
    return typingDiv;
}

function removeTypingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
    }
}

function addFeedbackButtons(messageElement, query, response) {
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'feedback-buttons';

    // ... (Feedback button logic remains the same but concise for now)
    const goodBtn = createBtn('👍', 'Good');
    const badBtn = createBtn('👎', 'Bad');

    goodBtn.onclick = () => handleFeedback(goodBtn, badBtn, query, response, 'good');
    badBtn.onclick = () => handleFeedback(badBtn, goodBtn, query, response, 'bad');

    feedbackDiv.appendChild(goodBtn);
    feedbackDiv.appendChild(badBtn);
    messageElement.appendChild(feedbackDiv);
}

function createBtn(icon, text) {
    const btn = document.createElement('button');
    btn.className = 'feedback-btn';
    btn.innerHTML = `<span>${icon}</span> ${text}`;
    return btn;
}

function handleFeedback(clickedBtn, otherBtn, query, response, rating) {
    logFeedback(query, response, rating);
    clickedBtn.classList.add('selected');
    clickedBtn.classList.add(rating);
    otherBtn.disabled = true;
    clickedBtn.disabled = true;
    otherBtn.style.opacity = '0.3';

    // If negative feedback, show refinement options
    if (rating === 'bad') {
        console.log("Feedback logged: User disliked response");
        showFeedbackOptions(clickedBtn.parentNode, query, response);
    }
}

function showFeedbackOptions(parentDiv, query, response) {
    // Check if options already exist
    if (parentDiv.querySelector('.feedback-options')) return;

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'feedback-options';

    const options = [
        { label: "Too Long", value: "too_long" },
        { label: "Too Short", value: "too_short" },
        { label: "Too Simple", value: "too_simple" },
        { label: "Too Complex", value: "too_complex" },
        { label: "Inaccurate", value: "inaccurate" },
        { label: "Wrong Tone", value: "wrong_tone" }
    ];

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'feedback-option-btn';
        btn.textContent = opt.label;
        btn.onclick = () => {
            // Disable all option buttons
            const allBtns = optionsDiv.querySelectorAll('.feedback-option-btn');
            allBtns.forEach(b => b.disabled = true);
            btn.classList.add('selected');

            // Trigger regeneration
            triggerRegeneration(query, opt.value, response);
        };
        optionsDiv.appendChild(btn);
    });

    parentDiv.appendChild(optionsDiv);
}

async function triggerRegeneration(query, issueType, originalResponse) {
    // Show AI is working
    const typingIndicator = addTypingIndicator();
    activeChat.scrollTop = activeChat.scrollHeight;

    try {
        const result = await GuahhEngine.generateRefinedResponse(query, issueType, originalResponse);

        removeTypingIndicator(typingIndicator);

        // Add specific intro based on issue
        let intro = "Let me try to improve that.";
        if (issueType === 'too_simple') intro = "I'll elaborate with more detail.";
        if (issueType === 'too_complex') intro = "I'll simplify that explanation.";
        if (issueType === 'inaccurate') intro = "Let me correct that information.";

        const fullText = `**${intro}**\n\n${result.text}`;

        const newMsg = addMessage(fullText, false);
        currentSession.addMessage('assistant', fullText);
        saveSession(currentSession);

        // Add feedback buttons to the new message too (recursive improvement!)
        addFeedbackButtons(newMsg, query, fullText);

    } catch (e) {
        console.error(e);
        removeTypingIndicator(typingIndicator);
        addMessage("Sorry, I couldn't regenerate the response.", false);
    }
}

function logToTerminal(msg, type = "info") {
    if (!logView) return;
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    div.innerHTML = `<span style="opacity:0.5">[${time}]</span> ${msg}`;
    logView.appendChild(div);
    logView.scrollTop = logView.scrollHeight;
}

document.addEventListener('DOMContentLoaded', () => {
    // Refs
    activeChat = document.getElementById('chatArea') || document.getElementById('chat-viewport');
    logView = document.getElementById('neural-log');
    activeInput = document.getElementById('userInput') || document.getElementById('user-input');
    activeBtn = document.getElementById('sendBtn') || document.getElementById('send-btn');
    statusText = document.getElementById('status-text');

    // Initialize session management
    currentSession = new ChatSession();
    renderSessionList();

    // Initialize Guahh Auth
    if (typeof GuahhAuthAPI !== 'undefined') {
        GuahhAuthAPI.onReady(() => {
            initAuthUI();
        });
    }

    // Sidebar event listeners
    const newChatBtn = document.getElementById('newChatBtn');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (newChatBtn) {
        newChatBtn.addEventListener('click', createNewChat);
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', toggleSidebar);
    }

    if (activeInput) {
        activeInput.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
        // Keydown listener
        activeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                window.sendMessage();
            }
        });
    }

    // Button listener (Backup if HTML onclick missing)
    if (activeBtn) {
        activeBtn.addEventListener('click', window.sendMessage);
    }

    // Boot Sequence
    if (statusText) statusText.innerText = 'Initializing Neural Core...';

    // Fallback dictionary for local mode
    // (Moved to global scope)

    const isLocal = window.location.protocol === 'file:';

    if (isLocal) {
        // LOCAL MODE: Skip fetch and use fallback immediately
        logToTerminal("⚠ LOCAL FILE MODE DETECTED", "warning");
        logToTerminal("Browsers block 'memory.json' when opening files directly.", "warning");
        logToTerminal("Initializing with reduced fallback memory...", "process");

        setTimeout(() => {
            if (window.GuahhEngine) {
                GuahhEngine.init(localFallbackMemory, logToTerminal);
                if (statusText) statusText.innerText = 'Guahh AI (Local Mode)';
            }
        }, 500);

    } else {
        // NORMAL MODE: Fetch full memory
        fetch('memory.json')
            .then(response => {
                if (!response.ok) throw new Error("Failed to load memory bank");
                return response.json();
            })
            .then(data => {
                logToTerminal("Memory bank loaded successfully.", "success");
                setTimeout(() => {
                    if (window.GuahhEngine) {
                        GuahhEngine.init(data, logToTerminal);
                        if (statusText) statusText.innerText = 'Guahh AI 1 (a)';
                    }
                }, 300);
            })
            .catch(err => {
                console.error(err);
                logToTerminal("CRITICAL: Failed to load memory.json.", "error");
                if (statusText) statusText.innerText = 'Error: Memory Missing';
                if (activeBtn) activeBtn.disabled = false;
            });
    }
});

// Feedback Logging (Simplified)
function logFeedback(query, response, rating) {
    const feedback = { timestamp: new Date().toISOString(), query, response, rating };
    feedbackData.push(feedback);
    console.log(`FEEDBACK: ${rating}`, feedback);
    window.exportFeedback = () => console.log(JSON.stringify(feedbackData, null, 2));
}

// ========== GUAHH AUTH INTEGRATION ==========

function initAuthUI() {
    const profilePic = document.getElementById('profilePic');
    const userProfile = document.getElementById('userProfile');

    if (!profilePic || !userProfile) return;

    const updateUI = () => {
        const user = GuahhAuthAPI.getCurrentUser();
        if (user) {
            // Logged In
            const pfp = user.profilePictureUrl || `https://api.dicebear.com/8.x/thumbs/svg?seed=${user.username}`;
            profilePic.style.backgroundImage = `url('${pfp}')`;
            profilePic.title = `Logged in as ${user.displayName}`;

            // Unlimited Prompts
            if (activeInput) activeInput.placeholder = "Message Guahh AI...";
        } else {
            // Logged Out
            profilePic.style.backgroundImage = `url('https://api.iconify.design/carbon:user-avatar-filled.svg?color=%23a0a0a0')`; // Reset to default
            profilePic.title = "Sign In";

            // Show remaining prompts
            updatePromptCounterUI();
        }
    };

    // Initial check
    updateUI();

    // Listeners
    GuahhAuthAPI.onLogin(updateUI);
    GuahhAuthAPI.onLogout(updateUI);


    // Click handler (with mobile touch support)
    const handleProfileClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (GuahhAuthAPI.isLoggedIn()) {
            openAccountModal();
        } else {
            GuahhAuthAPI.showLogin();
        }
    };

    userProfile.addEventListener('click', handleProfileClick);
    userProfile.addEventListener('touchend', handleProfileClick);

    // Modal Listeners
    setupModalListeners();
}

function openAccountModal() {
    const user = GuahhAuthAPI.getCurrentUser();
    if (!user) return;

    const overlay = document.getElementById('accountModalOverlay');
    const modalPfp = document.getElementById('modalProfilePic');
    const modalName = document.getElementById('modalDisplayName');
    const modalUser = document.getElementById('modalUsername');

    if (overlay && modalPfp && modalName && modalUser) {
        // Populate Data
        const pfp = user.profilePictureUrl || `https://api.dicebear.com/8.x/thumbs/svg?seed=${user.username}`;
        modalPfp.style.backgroundImage = `url('${pfp}')`;
        modalName.textContent = user.displayName;

        // Verified Badge
        if (user.isVerified) {
            const badge = document.createElement('span');
            badge.className = 'verified-badge material-icons';
            badge.textContent = 'verified';
            badge.setAttribute('aria-label', 'Verified');
            modalName.appendChild(badge);
        }

        modalUser.textContent = `@${user.username}`;

        // Show
        overlay.style.display = 'flex';
        // Add active class after a small delay for animation
        setTimeout(() => overlay.classList.add('active'), 10);
    }
}

function closeAccountModal() {
    const overlay = document.getElementById('accountModalOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 200); // Wait for transition
    }
}

function setupModalListeners() {
    const overlay = document.getElementById('accountModalOverlay');
    const closeBtn = document.getElementById('modalClose');
    const logoutBtn = document.getElementById('modalLogoutBtn');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeAccountModal);
    }

    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeAccountModal();
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to log out?")) {
                GuahhAuthAPI.logout(() => {
                    closeAccountModal();
                    // Optional: Show feedback
                    alert("Logged out successfully.");
                });
            }
        });
    }
}

function checkPromptLimit() {
    // 1. Check if logged in (Client-side check)
    if (typeof GuahhAuthAPI !== 'undefined' && GuahhAuthAPI.isLoggedIn()) {
        return true; // Unlimited
    }

    // 2. Check LocalStorage usage
    const today = new Date().toISOString().split('T')[0];
    let usage = JSON.parse(localStorage.getItem('guahh_daily_prompts') || '{}');

    if (usage.date !== today) {
        // Reset for new day
        usage = { date: today, count: 0 };
    }

    if (usage.count >= 30) {
        return false; // Limit reached
    }

    // Increment
    usage.count++;
    localStorage.setItem('guahh_daily_prompts', JSON.stringify(usage));
    updatePromptCounterUI(); // Update UI after increment
    return true;
}

function updatePromptCounterUI() {
    if (typeof GuahhAuthAPI !== 'undefined' && GuahhAuthAPI.isLoggedIn()) return;
    if (!activeInput) return;

    const today = new Date().toISOString().split('T')[0];
    let usage = JSON.parse(localStorage.getItem('guahh_daily_prompts') || '{}');
    if (usage.date !== today) usage = { count: 0 };

    const remaining = Math.max(0, 30 - usage.count);
    activeInput.placeholder = `Message Guahh AI... (${remaining} chats left)`;

    if (remaining === 0) {
        activeInput.placeholder = `No chats left. Sign in for infinite.`;
    }
}
