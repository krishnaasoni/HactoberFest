/**
 * ============================================================================
 * CarePulse — Reminders Module (js/reminders.js)
 * Manages 20-second interval checks, Web Notifications, Web Audio chimes,
 * snooze queues, and in-app alarm alert popups.
 * ============================================================================
 */

// Global AudioContext reference
let audioCtx = null;

// Timer identifier for periodic checks
let reminderIntervalId = null;

// Snooze storage key
const STORAGE_KEY_SNOOZE = 'carepulse_snoozed_reminders';

// Track the currently ringing medicine reminder
let currentAlarmMed = null;
let currentAlarmTime = null;

/**
 * Initializes the reminder engine.
 * Sets up the 20-second interval ticker and checks notification permissions.
 */
function initReminders() {
  // Check immediately on load
  checkScheduledReminders();
  updateNextMedicineCard();

  // Run checks every 20 seconds
  if (reminderIntervalId) clearInterval(reminderIntervalId);
  reminderIntervalId = setInterval(() => {
    checkScheduledReminders();
    updateNextMedicineCard();
    if (window.CarePulseEmergency && typeof window.CarePulseEmergency.checkMissedDoses === 'function') {
      CarePulseEmergency.checkMissedDoses();
    }
  }, 20000);

  // Update next medicine countdown display every 10 seconds for real-time smoothness
  setInterval(updateNextMedicineCard, 10000);

  // Setup prompt modal buttons
  setupNotificationPrompt();
}

/**
 * Polite first-use notification permission prompt.
 * If permission is default (unasked), display a gentle modal explaining benefits.
 */
function setupNotificationPrompt() {
  const modal = document.getElementById('notifyPromptModal');
  const allowBtn = document.getElementById('allowNotifyPromptBtn');
  const dismissBtn = document.getElementById('dismissNotifyPromptBtn');

  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications.');
    return;
  }

  // If already decided, don't prompt
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return;
  }

  // Show prompt modal after a short delay on first visit
  const hasPrompted = sessionStorage.getItem('carepulse_notify_prompted');
  if (!hasPrompted && modal) {
    setTimeout(() => {
      modal.classList.add('open');
      sessionStorage.setItem('carepulse_notify_prompted', 'true');
    }, 2500);
  }

  if (allowBtn) {
    allowBtn.addEventListener('click', async () => {
      modal.classList.remove('open');
      await requestNotificationPermission();
    });
  }

  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }
}

/**
 * Requests browser permission to show system notifications.
 */
async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      showToast('Notifications enabled! You will be alerted when medicines are due.', 'success');
    } else {
      showToast('Notifications disabled. In-app alarms will still alert you while CarePulse is open.', 'warning');
    }
    return permission;
  } catch (err) {
    console.error('Notification permission error:', err);
    return 'denied';
  }
}

/**
 * Plays a soothing, multi-harmonic hospital chime using the Web Audio API synthesizer.
 * This guarantees audio playback without relying on external file downloads or CORS issues.
 */
function playAlarmChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      playFallbackAudioFile();
      return;
    }

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Harmonic medical chime notes: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
    const notes = [
      { freq: 523.25, time: now },
      { freq: 659.25, time: now + 0.18 },
      { freq: 783.99, time: now + 0.36 },
      { freq: 1046.50, time: now + 0.54 }
    ];

    notes.forEach(n => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, n.time);

      // Smooth attack and soft exponential decay
      gain.gain.setValueAtTime(0, n.time);
      gain.gain.linearRampToValueAtTime(0.3, n.time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, n.time + 0.7);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(n.time);
      osc.stop(n.time + 0.75);
    });

  } catch (e) {
    console.warn('Web Audio chime error, playing fallback audio file:', e);
    playFallbackAudioFile();
  }
}

/**
 * Fallback audio player for browsers with strict audio autoplay policies.
 */
function playFallbackAudioFile() {
  const audioElem = document.getElementById('alarmAudioElement');
  if (audioElem) {
    audioElem.currentTime = 0;
    audioElem.play().catch(e => {
      console.log('Autoplay audio blocked until user interacts with the page:', e);
    });
  }
}

/**
 * Periodically called every 20 seconds to scan active medicines and check
 * if any dose is scheduled for right now and has not been logged or snoozed.
 */
function checkScheduledReminders() {
  if (!window.CarePulseMeds) return;
  const meds = CarePulseMeds.getMedicines();
  if (!meds || meds.length === 0) return;

  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;
  const todayDateStr = now.toISOString().split('T')[0];

  // Retrieve today's activity logs to avoid double-alerting
  const todayLogs = window.CarePulseTracker ? CarePulseTracker.getTodayLogs() : [];
  const snoozedQueue = getSnoozedReminders();

  // Clean expired snoozes
  cleanExpiredSnoozes();

  meds.forEach(med => {
    // Verify start and end dates
    if (med.startDate && todayDateStr < med.startDate) return;
    if (med.endDate && todayDateStr > med.endDate) return;

    // Verify scheduled days of the week
    if (med.days && !med.days.includes(currentDayOfWeek)) return;

    // Check each scheduled time
    med.times.forEach(schedTime => {
      // Check if already taken or skipped today
      const alreadyHandled = todayLogs.some(
        log => log.medicineId === med.id && log.time === schedTime && (log.status === 'taken' || log.status === 'skipped')
      );
      if (alreadyHandled) return;

      // Check if currently snoozed
      const isSnoozed = snoozedQueue.some(
        s => s.medicineId === med.id && s.time === schedTime && s.snoozeUntil > Date.now()
      );
      if (isSnoozed) return;

      // Check if time matches current minute
      if (schedTime === currentTimeStr) {
        // Trigger alert only if not already actively showing
        if (!currentAlarmMed || currentAlarmMed.id !== med.id || currentAlarmTime !== schedTime) {
          triggerDueAlarm(med, schedTime);
        }
      }
    });
  });

  // Also check if any snoozed reminders are due now
  snoozedQueue.forEach(snooze => {
    if (Date.now() >= snooze.snoozeUntil) {
      const med = CarePulseMeds.getMedicineById(snooze.medicineId);
      if (med) {
        removeSnoozedReminder(snooze.medicineId, snooze.time);
        triggerDueAlarm(med, snooze.time);
      }
    }
  });
}

/**
 * Triggers the alarm sequence when a medicine is due:
 * 1. Plays audible chime
 * 2. Fires Web Notification (if permitted)
 * 3. Opens the high-visibility in-app alarm modal
 */
function triggerDueAlarm(medicine, scheduledTime) {
  currentAlarmMed = medicine;
  currentAlarmTime = scheduledTime;

  // 1. Play sound
  playAlarmChime();

  // 2. Browser Desktop Notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(`Time for ${medicine.name}!`, {
        body: `Dose: ${medicine.dose} • ${CarePulseMeds.getFoodTimingLabel(medicine.foodTiming)}\nClick to mark as taken.`,
        icon: 'assets/logo.svg',
        tag: `med_${medicine.id}_${scheduledTime}`,
        renotify: true
      });

      notif.onclick = () => {
        window.focus();
        openAlarmModal(medicine, scheduledTime);
      };
    } catch (e) {
      console.warn('Failed to display browser notification:', e);
    }
  }

  // 3. Spoken Voice Reminder (Phase 2)
  if (window.CarePulseVoice && typeof CarePulseVoice.speakMedicineReminder === 'function') {
    CarePulseVoice.speakMedicineReminder(medicine);
  }

  // 4. Open In-App Modal
  openAlarmModal(medicine, scheduledTime);
}

/**
 * Displays the in-app modal with large accessible buttons: Taken / Snooze (10m) / Skip.
 */
function openAlarmModal(medicine, scheduledTime) {
  const modal = document.getElementById('alarmModal');
  if (!modal) return;

  const nameEl = document.getElementById('alarmMedName');
  const doseEl = document.getElementById('alarmMedDose');
  const foodEl = document.getElementById('alarmMedFood');
  const notesEl = document.getElementById('alarmMedNotes');

  if (nameEl) nameEl.textContent = medicine.name;
  if (doseEl) doseEl.textContent = medicine.dose;
  if (foodEl) foodEl.textContent = CarePulseMeds.getFoodTimingLabel(medicine.foodTiming);
  if (notesEl) {
    notesEl.textContent = medicine.notes ? `Doctor's Note: “${medicine.notes}”` : '';
  }

  modal.classList.add('open');
}

/**
 * Closes the in-app alarm modal.
 */
function closeAlarmModal() {
  const modal = document.getElementById('alarmModal');
  if (modal) modal.classList.remove('open');
  if (window.CarePulseVoice && typeof CarePulseVoice.stopSpeech === 'function') {
    CarePulseVoice.stopSpeech();
  }
  currentAlarmMed = null;
  currentAlarmTime = null;
}

/**
 * Snoozes a medicine dose for a designated number of minutes (defaults to 10 minutes).
 */
function snoozeReminder(medicineId, time, minutes = 10) {
  const snoozed = getSnoozedReminders();
  const snoozeUntil = Date.now() + minutes * 60 * 1000;

  // Remove any existing snooze for this med + time
  const filtered = snoozed.filter(s => !(s.medicineId === medicineId && s.time === time));
  filtered.push({ medicineId, time, snoozeUntil });

  try {
    localStorage.setItem(STORAGE_KEY_SNOOZE, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to store snooze:', e);
  }

  closeAlarmModal();
  showToast(`Snoozed for ${minutes} minutes. We'll remind you soon!`, 'info');
  updateNextMedicineCard();
}

/**
 * Returns list of currently active snoozed reminders from localStorage.
 */
function getSnoozedReminders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SNOOZE);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Removes a specific snoozed reminder.
 */
function removeSnoozedReminder(medicineId, time) {
  const snoozed = getSnoozedReminders();
  const filtered = snoozed.filter(s => !(s.medicineId === medicineId && s.time === time));
  try {
    localStorage.setItem(STORAGE_KEY_SNOOZE, JSON.stringify(filtered));
  } catch (e) {}
}

/**
 * Purges old snoozes that have already passed by more than 1 hour.
 */
function cleanExpiredSnoozes() {
  const snoozed = getSnoozedReminders();
  const valid = snoozed.filter(s => s.snoozeUntil > (Date.now() - 3600000));
  if (valid.length !== snoozed.length) {
    try {
      localStorage.setItem(STORAGE_KEY_SNOOZE, JSON.stringify(valid));
    } catch (e) {}
  }
}

/**
 * Calculates the next upcoming scheduled medicine for today or tomorrow.
 * Returns information needed to display the "Next Medicine" highlight card.
 */
function getNextScheduledMedicine() {
  if (!window.CarePulseMeds) return null;
  const meds = CarePulseMeds.getMedicines();
  if (!meds || meds.length === 0) return null;

  const now = new Date();
  const currentMinutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  const currentDayOfWeek = now.getDay();
  const todayLogs = window.CarePulseTracker ? CarePulseTracker.getTodayLogs() : [];

  let candidates = [];

  meds.forEach(med => {
    // Check if scheduled today
    if (med.days && med.days.includes(currentDayOfWeek)) {
      med.times.forEach(t => {
        const [h, m] = t.split(':').map(Number);
        const timeMinutes = h * 60 + m;

        // Check if already taken or skipped
        const isHandled = todayLogs.some(
          log => log.medicineId === med.id && log.time === t && (log.status === 'taken' || log.status === 'skipped')
        );

        if (!isHandled) {
          const diffMinutes = timeMinutes - currentMinutesSinceMidnight;
          candidates.push({
            med,
            time: t,
            diffMinutes,
            isToday: true
          });
        }
      });
    }
  });

  if (candidates.length === 0) {
    // If all taken today, search for tomorrow morning's earliest
    const tomorrowDay = (currentDayOfWeek + 1) % 7;
    meds.forEach(med => {
      if (med.days && med.days.includes(tomorrowDay)) {
        med.times.forEach(t => {
          const [h, m] = t.split(':').map(Number);
          const timeMinutes = h * 60 + m;
          const diffMinutes = (24 * 60 - currentMinutesSinceMidnight) + timeMinutes;
          candidates.push({
            med,
            time: t,
            diffMinutes,
            isToday: false
          });
        });
      }
    });
  }

  if (candidates.length === 0) return null;

  // Sort by smallest diff (closest upcoming, including slightly overdue)
  candidates.sort((a, b) => a.diffMinutes - b.diffMinutes);

  // If there's an overdue dose (diff < 0), prioritize it or the closest future dose
  const dueOrUpcoming = candidates.find(c => c.diffMinutes >= -15) || candidates[0];
  return dueOrUpcoming;
}

/**
 * Updates the "Next Medicine" highlight card on the Dashboard with countdown text.
 */
function updateNextMedicineCard() {
  const card = document.getElementById('nextMedCard');
  const nameEl = document.getElementById('nextMedName');
  const doseEl = document.getElementById('nextMedDose');
  const timeEl = document.getElementById('nextMedTime');
  const foodEl = document.getElementById('nextMedFood');
  const countdownEl = document.getElementById('countdownText');
  const takeBtn = document.getElementById('nextMedTakeBtn');
  const snoozeBtn = document.getElementById('nextMedSnoozeBtn');

  if (!card || !nameEl) return;

  const next = getNextScheduledMedicine();

  if (!next) {
    nameEl.textContent = 'All caught up for today! 🎉';
    if (doseEl) doseEl.textContent = 'No pending doses';
    if (timeEl) timeEl.textContent = 'Next: Tomorrow';
    if (foodEl) foodEl.textContent = 'Rest well';
    if (countdownEl) countdownEl.textContent = 'Done';
    if (takeBtn) takeBtn.style.display = 'none';
    if (snoozeBtn) snoozeBtn.style.display = 'none';
    return;
  }

  const { med, time, diffMinutes, isToday } = next;

  nameEl.textContent = med.name;
  if (doseEl) doseEl.textContent = `Dose: ${med.dose}`;
  if (timeEl) timeEl.textContent = `Time: ${CarePulseMeds.formatTime12h(time)}`;
  if (foodEl) foodEl.textContent = CarePulseMeds.getFoodTimingLabel(med.foodTiming);
  if (takeBtn) takeBtn.style.display = 'inline-flex';
  if (snoozeBtn) snoozeBtn.style.display = 'inline-flex';

  // Format countdown string
  let countdownStr = '';
  if (diffMinutes <= 0 && diffMinutes >= -30) {
    countdownStr = 'Due now!';
  } else if (diffMinutes < -30) {
    countdownStr = 'Overdue';
  } else if (diffMinutes < 60) {
    countdownStr = `in ${diffMinutes} min${diffMinutes === 1 ? '' : 's'}`;
  } else {
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    countdownStr = isToday ? `in ${hours}h ${mins}m` : `Tomorrow in ${hours}h`;
  }

  if (countdownEl) countdownEl.textContent = countdownStr;

  // Attach button actions for the next med card
  if (takeBtn) {
    takeBtn.onclick = () => {
      if (window.CarePulseTracker) {
        CarePulseTracker.markMedicineStatus(med.id, time, 'taken');
        updateNextMedicineCard();
      }
    };
  }

  if (snoozeBtn) {
    snoozeBtn.onclick = () => {
      snoozeReminder(med.id, time, 10);
    };
  }
}

// Expose Reminders module globally
var CarePulseReminders = window.CarePulseReminders = {
  initReminders,
  playAlarmChime,
  triggerDueAlarm,
  openAlarmModal,
  closeAlarmModal,
  snoozeReminder,
  requestNotificationPermission,
  getNextScheduledMedicine,
  updateNextMedicineCard
};
