/**
 * Guahh AI - Interface Controller (Dashboard Version)
 * Wires the Chat and Log panels to the Engine.
 */

// Feedback Collection
const feedbackData = [];

document.addEventListener('DOMContentLoaded', () => {
    // Refs
    const chatView = document.getElementById('chat-viewport');
    const chatArea = document.getElementById('chatArea'); // NEW: for new UI
    const logView = document.getElementById('neural-log');
    const input = document.getElementById('user-input');
    const userInput = document.getElementById('userInput'); // NEW: for new UI
    const btn = document.getElementById('send-btn');
    const sendBtn = document.getElementById('sendBtn'); // NEW: for new UI
    const statusText = document.getElementById('status-text');

    // Use new elements if they exist, otherwise fall back
    const activeChat = chatArea || chatView;
    const activeInput = userInput || input;
    const activeBtn = sendBtn || btn;

    // Logging Bridge
    function logToTerminal(msg, type = "info") {
        const div = document.createElement('div');
        div.className = `log-entry ${type}`;
        // Timestamp
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        div.innerHTML = `<span style="opacity:0.5">[${time}]</span> ${msg}`;
        logView.appendChild(div);
        logView.scrollTop = logView.scrollHeight;
    }

    // Auto-resize textarea
    if (activeInput) {
        activeInput.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    // Boot Sequence
    let bootInterval = setInterval(() => {
        if (window.GUAHH_MEMORY) {
            clearInterval(bootInterval);

            setTimeout(() => {
                GuahhEngine.init(window.GUAHH_MEMORY, console.log);
            }, 300);
        }
    }, 200);

    // Messaging
    let lastUserQuery = '';
    async function sendMessage() {
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

        // Generate (NOW ASYNC!)
        const result = await GuahhEngine.generateResponse(text);

        // Render AI Msg with feedback buttons
        const aiMessageElement = addMessage(result.text, false);
        addFeedbackButtons(aiMessageElement, lastUserQuery, result.text);

        activeBtn.disabled = false;
    }

    function addMessage(text, isUser) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isUser ? 'user' : 'ai'}`;

        if (!isUser) {
            // AI message with typing output
            msgDiv.innerHTML = `
                <div class="message-label">Guahh AI One (a)</div>
                <div class="message-content"></div>
            `;
            const contentDiv = msgDiv.querySelector('.message-content');

            // Start typing effect
            typeWriter(contentDiv, text);

        } else {
            // User message (instant)
            msgDiv.innerHTML = `
                <div class="message-label">You</div>
                <div class="message-content">${text}</div>
            `;
        }

        activeChat.appendChild(msgDiv);
        activeChat.scrollTop = activeChat.scrollHeight;

        return msgDiv;
    }

    /**
     * Typewriter Effect
     */
    function typeWriter(element, text) {
        let i = 0;
        const speed = 10; // ms per char

        function type() {
            if (i < text.length) {
                // Handle newlines safely
                const char = text.charAt(i);
                if (char === '\n') {
                    element.innerHTML += '<br>';
                } else {
                    element.innerHTML += char;
                }

                i++;
                // Auto-scroll
                activeChat.scrollTop = activeChat.scrollHeight;

                setTimeout(type, speed);
            } else {
                // Done typing: Apply Markdown formatting
                element.innerHTML = formatMarkdown(text);
                activeChat.scrollTop = activeChat.scrollHeight;
            }
        }
        type();
    }

    // Add feedback buttons to AI message
    function addFeedbackButtons(messageElement, query, response) {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'feedback-buttons';

        const goodBtn = document.createElement('button');
        goodBtn.className = 'feedback-btn good';
        goodBtn.innerHTML = '<span>👍</span> Good';
        goodBtn.title = 'Good response';

        const badBtn = document.createElement('button');
        badBtn.className = 'feedback-btn bad';
        badBtn.innerHTML = '<span>👎</span> Bad';
        badBtn.title = 'Bad response';

        goodBtn.onclick = () => {
            logFeedback(query, response, 'good');
            goodBtn.classList.add('selected');
            badBtn.disabled = true;
            goodBtn.disabled = true;
            badBtn.style.opacity = '0.3';
        };

        badBtn.onclick = () => {
            logFeedback(query, response, 'bad');
            badBtn.classList.add('selected');
            goodBtn.disabled = true;
            badBtn.disabled = true;
            goodBtn.style.opacity = '0.3';
        };

        feedbackDiv.appendChild(goodBtn);
        feedbackDiv.appendChild(badBtn);
        messageElement.appendChild(feedbackDiv);
    }

    function formatMarkdown(text) {
        return text
            .replace(/\n\n/g, '<br><br>')
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    }

    /**
     * Feedback Logging System
     */
    function logFeedback(query, response, rating) {
        const feedback = {
            timestamp: new Date().toISOString(),
            query: query,
            response: response,
            rating: rating,
            id: feedbackData.length + 1 // Keep original ID logic
        };

        feedbackData.push(feedback);

        // Styled console output
        const style = rating === 'good' ? 'color: #10b981; font-weight: bold' : 'color: #ef4444; font-weight: bold';
        console.group(`%c📊 FEEDBACK #${feedbackData.length} - ${rating.toUpperCase()}`, style);
        console.log(`%c⏰ Timestamp:`, 'font-weight: bold;', feedback.timestamp);
        console.log(`%c❓ User Query:`, 'font-weight: bold;', query);
        console.log(`%c🤖 AI Response:`, 'font-weight: bold;', response);
        console.log(`%c⭐ Rating:`, 'font-weight: bold;', rating);
        console.groupEnd();

        // Also log a copy/paste friendly version
        console.log(
            `\n━━━ FEEDBACK DATA ━━━\n` +
            `ID: ${feedback.id}\n` + // Use feedback.id for consistency
            `Time: ${feedback.timestamp}\n` +
            `Query: ${query}\n` +
            `Response: ${response}\n` +
            `Rating: ${rating}\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n`
        );

        // Make export function available globally
        window.exportFeedback = exportFeedback;

        // Notify user
        console.log('%c💡 TIP: Call exportFeedback() to get all feedback as JSON', 'color: #60a5fa; font-style: italic;');
    }

    function exportFeedback() {
        if (feedbackData.length === 0) {
            console.warn('No feedback data collected yet.');
            return null;
        }

        const jsonStr = JSON.stringify(feedbackData, null, 2);
        console.log('\n📦 EXPORTED FEEDBACK DATA:\n');
        console.log(jsonStr);
        console.log('\n✅ Copy the JSON above to share with your AI developer!\n');

        return feedbackData;
    }


    // Event listeners
    if (activeBtn) {
        activeBtn.addEventListener('click', sendMessage);
    }
    if (activeInput) {
        activeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Direct references for old code that might still use them
    if (btn) btn.addEventListener('click', sendMessage);
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});
