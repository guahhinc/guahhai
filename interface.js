/**
 * Guahh AI - Interface Controller (Dashboard Version)
 * Wires the Chat and Log panels to the Engine.
 */

// Global State
let activeChat, activeInput, activeBtn, logView, statusText;
let lastUserQuery = '';
const feedbackData = [];

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

    lastUserQuery = text;
    activeInput.value = '';
    activeInput.style.height = 'auto';
    activeBtn.disabled = true;

    // User msg
    addMessage(text, true);

    // Thought simulation delay
    await new Promise(r => setTimeout(r, 600));

    // Generate
    if (typeof GuahhEngine === 'undefined') {
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
        addMessage("System Error: Neural Core failed to initialize.", false);
        activeBtn.disabled = false;
        return;
    }

    const result = await GuahhEngine.generateResponse(text);

    // Render AI Msg with feedback buttons
    const aiMessageElement = addMessage(result.text, false);
    addFeedbackButtons(aiMessageElement, lastUserQuery, result.text);

    activeBtn.disabled = false;
};

// Helper Functions
function addMessage(text, isUser) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isUser ? 'user' : 'ai'}`;

    if (!isUser) {
        msgDiv.innerHTML = `
            <div class="message-label">Guahh AI One (a)</div>
            <div class="message-content"></div>
        `;
        const contentDiv = msgDiv.querySelector('.message-content');
        typeWriter(contentDiv, text);
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
            element.innerHTML = formatMarkdown(text);
            if (activeChat) activeChat.scrollTop = activeChat.scrollHeight;
        }
    }
    type();
}

function formatMarkdown(text) {
    return text.replace(/\n\n/g, '<br><br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
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
    clickedBtn.classList.add(rating); // Add class for specific styling
    otherBtn.disabled = true;
    clickedBtn.disabled = true;
    otherBtn.style.opacity = '0.3';
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
                if (statusText) statusText.innerText = 'Guahh AI One (Local Mode)';
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
                        if (statusText) statusText.innerText = 'Guahh AI One (a)';
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
