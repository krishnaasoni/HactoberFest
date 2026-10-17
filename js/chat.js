/**
 * ============================================================================
 * CarePulse — AI Health Chat Module (js/chat.js)
 * Features hard-coded emergency keyword detection (English, Hindi, Hinglish),
 * rich message streaming UI, suggested question chips, and Gemini API integration.
 * ============================================================================
 */

const STORAGE_KEY_CHAT = 'carepulse_chat_history';

// Emergency keyword patterns in English, Hindi, and Hinglish
const EMERGENCY_PATTERNS = [
  // English
  /\bchest\s*pain\b/i,
  /\bheart\s*attack\b/i,
  /\bbreathing\s*(problem|issue|trouble|difficulty)\b/i,
  /\bcan'?t\s*breathe\b/i,
  /\bshortness\s*of\s*breath\b/i,
  /\bunconscious\b/i,
  /\bheavy\s*bleeding\b/i,
  /\bsevere\s*bleeding\b/i,
  /\bseizure\b/i,
  /\bstroke\b/i,
  /\boverdose\b/i,
  /\bsuicide\b/i,
  /\bpoisoning\b/i,

  // Hindi & Hinglish
  /\bseene\s*(me|mein)\s*dard\b/i,
  /\bchhati\s*(me|mein)\s*dard\b/i,
  /\bsaans\s*(nahi|nahin)\b/i,
  /\bsaans\s*lene\s*me\b/i,
  /\bdam\s*ghut\b/i,
  /\bbehosh\b/i,
  /\bkhoon\s*(nikal|bah)\b/i,
  /\bdil\s*ka\s*daura\b/i,
  /\bchhati\s*me\b/i
];

/**
 * Checks if user message contains any urgent life-threatening keywords.
 * Returns true if an emergency keyword is detected.
 */
function checkForEmergency(messageText) {
  if (!messageText) return false;
  return EMERGENCY_PATTERNS.some(regex => regex.test(messageText));
}

let isChatSending = false;

/**
 * Initializes chat event listeners, suggested chips, and restores past messages.
 */
function initChat() {
  const chatForm = document.getElementById('chatForm');
  const sendBtn = document.getElementById('chatSendBtn');
  const chatInput = document.getElementById('chatInput');
  const clearBtn = document.getElementById('clearChatBtn');
  const chips = document.querySelectorAll('.chat-chip');

  // Listen to form submit (works cleanly for Enter key, mobile Go button, and send button click)
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSendMessage();
    });
  }

  // Suggested prompt chips click handlers
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const question = chip.getAttribute('data-question');
      if (question && chatInput) {
        chatInput.value = question;
        handleSendMessage();
      }
    });
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear chat conversation history?')) {
        localStorage.removeItem(STORAGE_KEY_CHAT);
        const container = document.getElementById('chatMessages');
        if (container) {
          container.innerHTML = `
            <div class="chat-bubble-row bot">
              <div class="chat-bubble">
                <p><strong>Namaste & Hello! I am CarePulse AI</strong>, your friendly health assistant.</p>
                <p>How can I assist you with your medicine routines, meal timings, or vitals today?</p>
                <div class="chat-bubble-time">Just now</div>
              </div>
            </div>
          `;
        }
        hideEmergencyCard();
        showToast('Chat history cleared.', 'info');
      }
    });
  }

  // Restore stored chat messages
  restoreChatHistory();
}

/**
 * Handles sending a message entered by the user.
 * 1. Checks hardcoded emergency rules BEFORE making any network call.
 * 2. If emergency: renders red emergency card and skips AI API.
 * 3. If safe: sends request to /api/chat (Vercel serverless function with Gemini API).
 */
async function handleSendMessage() {
  const chatInput = document.getElementById('chatInput');
  if (!chatInput) return;

  const rawText = chatInput.value ? chatInput.value.trim() : '';
  if (!rawText) return;

  if (isChatSending) return;
  isChatSending = true;

  // Clear input field immediately
  chatInput.value = '';

  // Render user bubble
  appendMessage('user', rawText);

  // 1. HARDCODED EMERGENCY SAFETY RULE
  if (checkForEmergency(rawText)) {
    showEmergencyCard();
    appendMessage('bot', `🚨 **EMERGENCY DETECTED**: This sounds like a critical medical emergency. Please call **108** (Ambulance) or visit the nearest emergency room immediately. Do not delay for AI advice.`);
    isChatSending = false;
    return;
  }

  // Hide any previous emergency card for normal health questions
  hideEmergencyCard();

  // Show animated typing indicator
  const typingId = showTypingIndicator();

  try {
    const history = getChatHistoryForAPI();
    let response = null;

    // Check if running from file:/// or Live Server (e.g. port 5500), where vercel dev is on port 3000
    const isFileOrOtherPort = window.location.protocol === 'file:' || (window.location.port && window.location.port !== '3000');

    if (isFileOrOtherPort) {
      try {
        const testRes = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: rawText, history })
        });
        if (testRes.ok) {
          response = testRes;
        }
      } catch (e) {
        // Continue to relative endpoint
      }
    }

    if (!response) {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: rawText,
          history
        })
      });
    }

    removeTypingIndicator(typingId);

    if (response && response.ok) {
      const data = await response.json();
      const botReply = data.reply || data.text || 'I am here to help. Always consult your doctor for medical advice.';
      appendMessage('bot', botReply);
    } else {
      console.warn('Backend API returned status:', response ? response.status : 'no-response');
      const simulatedReply = getSimulatedMedicalReply(rawText);
      appendMessage('bot', simulatedReply);
    }

  } catch (networkError) {
    console.warn('API network error, using local healthcare knowledge fallback:', networkError);
    removeTypingIndicator(typingId);
    const simulatedReply = getSimulatedMedicalReply(rawText);
    appendMessage('bot', simulatedReply);
  } finally {
    isChatSending = false;
  }
}

/**
 * Shows the urgent red emergency card above messages.
 */
function showEmergencyCard() {
  const card = document.getElementById('emergencyCard');
  if (card) {
    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Hides the emergency card.
 */
function hideEmergencyCard() {
  const card = document.getElementById('emergencyCard');
  if (card) {
    card.style.display = 'none';
  }
}

/**
 * Appends a message bubble to the chat feed and scrolls to bottom.
 */
function appendMessage(role, text) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const bubbleRow = document.createElement('div');
  bubbleRow.className = `chat-bubble-row ${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.innerHTML = `
    <div>${formatMarkdownToHTML(text)}</div>
    <div class="chat-bubble-time">${timeStr}</div>
  `;

  bubbleRow.appendChild(bubble);
  container.appendChild(bubbleRow);

  // Auto scroll to latest
  container.scrollTop = container.scrollHeight;

  // Persist to localStorage
  saveChatMessageToStorage(role, text, timeStr);
}

/**
 * Shows the animated 3-dot typing indicator bubble while waiting for AI response.
 */
function showTypingIndicator() {
  const container = document.getElementById('chatMessages');
  if (!container) return null;

  const typingId = 'typing_' + Date.now();
  const typingRow = document.createElement('div');
  typingRow.id = typingId;
  typingRow.className = 'chat-bubble-row bot';
  typingRow.innerHTML = `
    <div class="chat-bubble">
      <div class="typing-dots">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>
  `;

  container.appendChild(typingRow);
  container.scrollTop = container.scrollHeight;
  return typingId;
}

/**
 * Removes the typing indicator bubble once AI response is received.
 */
function removeTypingIndicator(typingId) {
  if (!typingId) return;
  const el = document.getElementById(typingId);
  if (el) el.remove();
}

/**
 * Formats basic Markdown syntax (bold, lists, code, linebreaks) into clean HTML.
 */
function formatMarkdownToHTML(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italics *text*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Bullet items starting with - or *
  html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Line breaks to <p>
  const paragraphs = html.split(/\n\n+/);
  return paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}

/**
 * Saves a single message to localStorage chat history.
 */
function saveChatMessageToStorage(role, text, timeStr) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHAT);
    const history = raw ? JSON.parse(raw) : [];
    history.push({ role, text, time: timeStr });
    // Keep last 30 messages
    if (history.length > 30) history.shift();
    localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save chat message:', e);
  }
}

/**
 * Restores past conversation messages when opening the app.
 */
function restoreChatHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHAT);
    if (!raw) return;
    const history = JSON.parse(raw);
    const container = document.getElementById('chatMessages');
    if (!container || history.length === 0) return;

    container.innerHTML = '';
    history.forEach(item => {
      const bubbleRow = document.createElement('div');
      bubbleRow.className = `chat-bubble-row ${item.role}`;
      bubbleRow.innerHTML = `
        <div class="chat-bubble">
          <div>${formatMarkdownToHTML(item.text)}</div>
          <div class="chat-bubble-time">${item.time || ''}</div>
        </div>
      `;
      container.appendChild(bubbleRow);
    });
    container.scrollTop = container.scrollHeight;
  } catch (e) {
    console.error('Failed to restore chat history:', e);
  }
}

/**
 * Prepares recent chat history format suitable for Gemini API payload.
 */
function getChatHistoryForAPI() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHAT);
    if (!raw) return [];
    const history = JSON.parse(raw);
    return history.slice(-6).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      text: h.text
    }));
  } catch (e) {
    return [];
  }
}

/**
 * Intelligent local healthcare fallback assistant.
 * Activates seamlessly when running locally without a running Vercel serverless backend,
 * ensuring users can test questions in English, Hindi, and Hinglish.
 */
function getSimulatedMedicalReply(query) {
  const q = query.toLowerCase();

  if (q.includes('before or after food') || q.includes('khana') || q.includes('food') || q.includes('meal')) {
    return `Most pain relievers and anti-inflammatory medicines (like Paracetamol or Ibuprofen) are best taken **after meals** to protect your stomach lining. Diabetes medicines like Metformin are also usually taken with or after food.\n\n*Always verify the specific label on your prescription box or ask your pharmacist.*`;
  }

  if (q.includes('miss') || q.includes('bhool') || q.includes('chhoot')) {
    return `If you miss a dose:\n1. Take it as soon as you remember.\n2. If it is already close to your next scheduled dose, skip the missed dose completely.\n3. **Never take a double dose** to compensate.\n\n*Always check with your doctor or pharmacist if unsure about specific timing.*`;
  }

  if (q.includes('sleep') || q.includes('neend') || q.includes('insomnia')) {
    return `Here are evidence-based tips for better sleep:\n- Keep a regular bedtime and wake-up schedule.\n- Avoid heavy meals, caffeine, and blue screen light 1 hour before bed.\n- Keep your room cool and quiet.\n- Light stretching or warm herbal tea can help relax your body.\n\n*If sleep difficulties persist for more than 2 weeks, consult a physician.*`;
  }

  if (q.includes('blood pressure') || q.includes('bp')) {
    return `For healthy adults:\n- **Normal BP:** Under 120/80 mmHg\n- **Elevated:** 120-129 / <80 mmHg\n- **High (Hypertension):** 130/80 mmHg or higher\n\nDaily low-sodium diet, regular walking, and timely medication help keep BP balanced.\n\n*Please share your logged BP readings in CarePulse with your doctor.*`;
  }

  if (q.includes('water') || q.includes('paani') || q.includes('antibiotic')) {
    return `Drinking plenty of water (around 2 to 2.5 liters daily) is recommended while taking antibiotics. It assists your kidneys in processing the medicine and prevents dehydration.\n\n*Always complete the full course of antibiotics as prescribed by your doctor.*`;
  }

  // General helpful response
  return `Thank you for asking. For optimal health results, ensure you take your scheduled medications on time with water, maintain a balanced diet, and log your vitals regularly in CarePulse.\n\n*(Note: For personalized medical advice, specific diagnosis, or dosage modifications, please consult your doctor or certified pharmacist.)*`;
}

var CarePulseChat = window.CarePulseChat = {
  initChat,
  handleSendMessage,
  checkForEmergency
};
