/**
 * ============================================================================
 * CarePulse — Voice & Speech Module (js/voice.js)
 * Manages Web Speech API Text-to-Speech (speechSynthesis) for spoken medicine
 * reminders and Speech-to-Text (SpeechRecognition) for AI Chat voice input.
 * Supports Indian English (en-IN) and Hindi (hi-IN).
 * ============================================================================
 */

// Storage keys for voice settings
const STORAGE_KEY_VOICE_REMINDERS = 'carepulse_voice_reminders';
const STORAGE_KEY_VOICE_LANG = 'carepulse_voice_lang';

// Active SpeechRecognition instance
let chatSpeechRecognition = null;
let isChatListening = false;

/**
 * Checks if the Web Speech Synthesis API is supported in the current browser.
 */
function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Checks if Web Speech Recognition (STT) is supported in the current browser.
 */
function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

/**
 * Retrieves the persisted setting for spoken medicine reminders (default: false).
 */
function getVoiceRemindersEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY_VOICE_REMINDERS) === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * Saves the spoken reminders preference to localStorage.
 */
function setVoiceRemindersEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY_VOICE_REMINDERS, enabled ? 'true' : 'false');
  } catch (e) {
    console.error('Failed to save voice reminders preference:', e);
  }
}

/**
 * Retrieves the preferred voice language (default: 'en-IN').
 */
function getVoiceLang() {
  try {
    const lang = localStorage.getItem(STORAGE_KEY_VOICE_LANG);
    return lang === 'hi-IN' ? 'hi-IN' : 'en-IN';
  } catch (e) {
    return 'en-IN';
  }
}

/**
 * Saves the preferred voice language to localStorage ('en-IN' or 'hi-IN').
 */
function setVoiceLang(lang) {
  try {
    const valid = lang === 'hi-IN' ? 'hi-IN' : 'en-IN';
    localStorage.setItem(STORAGE_KEY_VOICE_LANG, valid);
  } catch (e) {
    console.error('Failed to save voice language preference:', e);
  }
}

/**
 * Translates medicine meal timing into a natural spoken description.
 */
function getSpokenTimingPhrase(foodTiming, lang) {
  if (lang === 'hi-IN') {
    switch (foodTiming) {
      case 'after': return 'khane ke baad';
      case 'before': return 'khane se pehle';
      case 'with': return 'khane ke saath';
      case 'any': return 'kisi bhi samay';
      default: return 'samay par';
    }
  } else {
    switch (foodTiming) {
      case 'after': return 'after food';
      case 'before': return 'before food';
      case 'with': return 'with food';
      case 'any': return 'any time';
      default: return 'as prescribed';
    }
  }
}

/**
 * Speaks a natural medicine reminder phrase when an alarm triggers.
 * Automatically respects the Spoken Reminders toggle and chosen language.
 */
function speakMedicineReminder(medicine) {
  if (!getVoiceRemindersEnabled() || !isSpeechSynthesisSupported()) return;
  if (!medicine || !medicine.name) return;

  const lang = getVoiceLang();
  const medName = medicine.name;
  const dose = medicine.dose || '';
  const timingPhrase = getSpokenTimingPhrase(medicine.foodTiming, lang);

  let phrase = '';
  if (lang === 'hi-IN') {
    // Hindi phrase: "Aapki [Medicine] lene ka samay ho gaya hai, [Dose], [Meal timing]."
    phrase = `Aapki ${medName} lene ka samay ho gaya hai. ${dose ? dose + ', ' : ''}${timingPhrase}.`;
  } else {
    // English phrase: "Time to take your [Medicine], [Dose], [Meal timing]."
    phrase = `Time to take your ${medName}. ${dose ? dose + ', ' : ''}${timingPhrase}.`;
  }

  speakText(phrase, lang);
}

/**
 * Cancels any active speech synthesis and immediately speaks the given text.
 */
function speakText(text, lang = 'en-IN') {
  if (!isSpeechSynthesisSupported()) {
    console.warn('SpeechSynthesis is not supported in this environment.');
    return;
  }

  try {
    // Cancel any previous speech
    window.speechSynthesis.cancel();

    const UtteranceClass = window.SpeechSynthesisUtterance || SpeechSynthesisUtterance;
    const utterance = new UtteranceClass(text);
    utterance.lang = lang;
    utterance.rate = 0.95; // Slightly slower for elderly clarity
    utterance.pitch = 1.0;

    // Pick best available voice matching requested language if present
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const match = voices.find(v => v.lang === lang || v.lang.startsWith(lang.split('-')[0]));
      if (match) utterance.voice = match;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('SpeechSynthesis error:', err);
  }
}

/**
 * Immediately cancels any ongoing speech playback.
 */
function stopSpeech() {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}

/**
 * Triggers a sample spoken reminder for user testing from the Settings panel.
 */
function testSpokenReminder() {
  const lang = getVoiceLang();
  let testPhrase = '';

  if (lang === 'hi-IN') {
    testPhrase = 'Aapki Metformin lene ka samay ho gaya hai, 500 milligram, khane ke baad.';
  } else {
    testPhrase = 'Time to take your Metformin, 500 milligrams, after food.';
  }

  speakText(testPhrase, lang);
  if (window.showToast) {
    showToast(`Speaking sample reminder in ${lang === 'hi-IN' ? 'Hindi' : 'English'} 🔊`, 'info');
  }
}

/**
 * Initializes the Spoken Reminders controls in the Settings section.
 */
function initVoiceSettings() {
  const toggle = document.getElementById('spokenRemindersToggle');
  const langSelect = document.getElementById('voiceLangSelect');
  const testBtn = document.getElementById('testVoiceBtn');
  const unsupportedNotice = document.getElementById('voiceUnsupportedNotice');

  if (!isSpeechSynthesisSupported()) {
    if (unsupportedNotice) unsupportedNotice.style.display = 'block';
    if (toggle) toggle.disabled = true;
    if (testBtn) testBtn.disabled = true;
    if (langSelect) langSelect.disabled = true;
    return;
  }

  // Populate initial values
  if (toggle) {
    toggle.checked = getVoiceRemindersEnabled();
    toggle.addEventListener('change', (e) => {
      setVoiceRemindersEnabled(e.target.checked);
      if (window.showToast) {
        showToast(
          e.target.checked
            ? 'Spoken reminders enabled! CarePulse will read out due medicines.'
            : 'Spoken reminders turned off.',
          'info'
        );
      }
    });
  }

  if (langSelect) {
    langSelect.value = getVoiceLang();
    langSelect.addEventListener('change', (e) => {
      setVoiceLang(e.target.value);
      if (window.showToast) {
        const label = e.target.value === 'hi-IN' ? 'Hindi (hi-IN)' : 'Indian English (en-IN)';
        showToast(`Voice reminder language set to ${label}.`, 'info');
      }
    });
  }

  if (testBtn) {
    testBtn.addEventListener('click', testSpokenReminder);
  }

  // Pre-load voices
  if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}

/**
 * Initializes Speech-to-Text (STT) voice input in the AI Chat input bar.
 */
function initChatVoiceInput() {
  const micBtn = document.getElementById('chatMicBtn');
  const chatInput = document.getElementById('chatInput');
  if (!micBtn || !chatInput) return;

  if (!isSpeechRecognitionSupported()) {
    // Hide mic button gracefully if browser doesn't support STT
    micBtn.style.display = 'none';
    return;
  }

  micBtn.style.display = 'inline-flex';

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  micBtn.addEventListener('click', () => {
    if (isChatListening) {
      stopChatListening();
    } else {
      startChatListening();
    }
  });

  /**
   * Starts speech recognition and updates UI to listening state.
   */
  function startChatListening() {
    try {
      if (chatSpeechRecognition) {
        try { chatSpeechRecognition.abort(); } catch (e) {}
      }

      chatSpeechRecognition = new SpeechRecognition();
      chatSpeechRecognition.continuous = false;
      chatSpeechRecognition.interimResults = true;
      chatSpeechRecognition.lang = getVoiceLang();

      chatSpeechRecognition.onstart = () => {
        isChatListening = true;
        micBtn.classList.add('listening');
        micBtn.setAttribute('aria-pressed', 'true');
        micBtn.setAttribute('title', 'Listening... Speak now (click to stop)');
        if (window.showToast) {
          showToast('Listening... Speak your question now 🎙️', 'info');
        }
      };

      chatSpeechRecognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          chatInput.value = transcript;
        }
      };

      chatSpeechRecognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          if (window.showToast) showToast('Microphone access denied by browser.', 'warning');
        } else if (event.error !== 'no-speech') {
          if (window.showToast) showToast(`Voice input: ${event.error}`, 'warning');
        }
        stopChatListening();
      };

      chatSpeechRecognition.onend = () => {
        stopChatListening();
      };

      chatSpeechRecognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      stopChatListening();
    }
  }

  /**
   * Stops speech recognition and restores UI to default state.
   */
  function stopChatListening() {
    isChatListening = false;
    if (chatSpeechRecognition) {
      try { chatSpeechRecognition.stop(); } catch (e) {}
    }
    micBtn.classList.remove('listening');
    micBtn.setAttribute('aria-pressed', 'false');
    micBtn.setAttribute('title', 'Speak your question');
  }
}

/**
 * Master initializer for Phase 2 voice features.
 */
function initVoice() {
  initVoiceSettings();
  initChatVoiceInput();
  if (window.lucide && typeof lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

// Expose Voice module globally
var CarePulseVoice = window.CarePulseVoice = {
  initVoice,
  isSpeechSynthesisSupported,
  isSpeechRecognitionSupported,
  getVoiceRemindersEnabled,
  setVoiceRemindersEnabled,
  getVoiceLang,
  setVoiceLang,
  speakMedicineReminder,
  speakText,
  stopSpeech,
  testSpokenReminder
};
