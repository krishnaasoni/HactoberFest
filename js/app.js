/**
 * ============================================================================
 * CarePulse — Core Application Module (js/app.js)
 * Master controller managing navigation tabs, dark/light themes, elder mode,
 * toast alerts, modal dialogs, backup export/import, and demo data initialization.
 * ============================================================================
 */

// Application state for the active medicine modal
let currentModalTimes = ['08:00'];
let currentModalDays = [0, 1, 2, 3, 4, 5, 6]; // 0=Sun, 1=Mon, ..., 6=Sat
let currentModalFoodTiming = 'after';

/**
 * Main application bootstrapping on DOMContentLoaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initElderMode();
  updateGreetingHeader();
  initNavigation();
  initMedicineModal();
  initAlarmModalActions();
  initSettingsListeners();
  
  // Initialize sub-modules
  if (window.CarePulseMeds) {
    CarePulseMeds.renderMedicinesList();
    CarePulseMeds.updateMedsCountBadge();
  }
  if (window.CarePulseTracker) {
    CarePulseTracker.updateDashboardProgress();
    CarePulseTracker.renderDashboardTimeline();
    CarePulseTracker.updateDashboardStats();
    CarePulseTracker.renderHistoryView();
  }
  if (window.CarePulseReminders) {
    CarePulseReminders.initReminders();
  }
  if (window.CarePulseHealthLog) {
    CarePulseHealthLog.initHealthLog();
  }
  if (window.CarePulseChat) {
    CarePulseChat.initChat();
  }
  if (window.CarePulseEmergency) {
    CarePulseEmergency.initEmergency();
  }
  if (window.CarePulseVoice) {
    CarePulseVoice.initVoice();
  }

  // Check if first-time user with empty storage: offer easy demo data or prompt
  checkFirstTimeLaunch();

  // Initialize Lucide icons
  if (window.lucide && typeof lucide.createIcons === 'function') {
    lucide.createIcons();
  }
});

/**
 * Updates greeting ("Good Morning", "Good Afternoon", "Good Evening")
 * and displays today's formatted date in the top bar.
 */
function updateGreetingHeader() {
  const greetingEl = document.getElementById('greetingText');
  const dateEl = document.getElementById('currentDateText');

  const now = new Date();
  const hour = now.getHours();

  let greeting = 'Good Morning';
  if (hour >= 12 && hour < 17) {
    greeting = 'Good Afternoon';
  } else if (hour >= 17 && hour < 22) {
    greeting = 'Good Evening';
  } else if (hour >= 22 || hour < 5) {
    greeting = 'Rest Well Tonight';
  }

  if (greetingEl) greetingEl.textContent = greeting;

  if (dateEl) {
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', options);
  }
}

/**
 * Initializes desktop sidebar and mobile navigation tabs switching.
 */
function initNavigation() {
  const navButtons = document.querySelectorAll('.nav-item, .bottom-nav-item');
  const sections = document.querySelectorAll('.app-section');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      if (!targetTab) return;

      // Update active class on nav buttons
      navButtons.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-tab') === targetTab);
      });

      // Show matching section, hide others
      sections.forEach(sec => {
        const secId = `${targetTab}Section`;
        const isActive = sec.id === secId;
        sec.classList.toggle('active', isActive);
      });

      // Special re-render triggers for specific tabs
      if (targetTab === 'history' && window.CarePulseTracker) {
        CarePulseTracker.renderHistoryView();
      } else if (targetTab === 'healthlog' && window.CarePulseHealthLog) {
        CarePulseHealthLog.renderHealthHistoryTable();
        CarePulseHealthLog.renderVitalsTrendChart();
      } else if (targetTab === 'dashboard' && window.CarePulseTracker) {
        CarePulseTracker.updateDashboardProgress();
        CarePulseTracker.renderDashboardTimeline();
        CarePulseTracker.updateDashboardStats();
      } else if (targetTab === 'medicines' && window.CarePulseMeds) {
        CarePulseMeds.renderMedicinesList();
      }

      // Re-run icons render
      if (window.lucide) lucide.createIcons();

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Logo click returns to dashboard
  const brandLink = document.getElementById('brandLink');
  if (brandLink) {
    brandLink.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('navDashboard')?.click();
    });
  }
}

/**
 * Initializes theme toggle and loads saved theme preference (defaults to dark mode).
 */
function initTheme() {
  const savedTheme = localStorage.getItem('carepulse_theme') || 'dark';
  applyTheme(savedTheme);

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const darkModeToggle = document.getElementById('darkModeToggle');

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark-mode');
      applyTheme(isDark ? 'light' : 'dark');
    });
  }

  if (darkModeToggle) {
    darkModeToggle.checked = savedTheme === 'dark';
    darkModeToggle.addEventListener('change', (e) => {
      applyTheme(e.target.checked ? 'dark' : 'light');
    });
  }
}

/**
 * Applies dark or light mode classes and updates icons.
 */
function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark-mode', isDark);
  localStorage.setItem('carepulse_theme', theme);

  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) {
    themeIcon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
  }

  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.checked = isDark;
  }

  // Re-render chart colors if active
  if (window.CarePulseTracker && typeof window.CarePulseTracker.renderWeeklyChart === 'function') {
    window.CarePulseTracker.renderWeeklyChart();
    window.CarePulseTracker.renderBreakdownChart();
  }
  if (window.CarePulseHealthLog && typeof window.CarePulseHealthLog.renderVitalsTrendChart === 'function') {
    window.CarePulseHealthLog.renderVitalsTrendChart();
  }

  if (window.lucide) lucide.createIcons();
}

/**
 * Initializes Elder Mode for seniors with +25% font size and higher contrast.
 */
function initElderMode() {
  const savedElder = localStorage.getItem('carepulse_elder_mode') === 'true';
  applyElderMode(savedElder);

  const elderBtn = document.getElementById('elderModeBtn');
  const elderToggle = document.getElementById('elderModeToggle');

  if (elderBtn) {
    elderBtn.addEventListener('click', () => {
      const current = document.body.classList.contains('elder-mode');
      applyElderMode(!current);
    });
  }

  if (elderToggle) {
    elderToggle.checked = savedElder;
    elderToggle.addEventListener('change', (e) => {
      applyElderMode(e.target.checked);
    });
  }
}

/**
 * Toggles the Elder Mode CSS class and stores choice in localStorage.
 */
function applyElderMode(enabled) {
  document.body.classList.toggle('elder-mode', enabled);
  localStorage.setItem('carepulse_elder_mode', enabled ? 'true' : 'false');

  const elderBtn = document.getElementById('elderModeBtn');
  const elderToggle = document.getElementById('elderModeToggle');

  if (elderBtn) {
    elderBtn.classList.toggle('btn-primary', enabled);
    elderBtn.classList.toggle('btn-secondary', !enabled);
  }
  if (elderToggle) {
    elderToggle.checked = enabled;
  }
}

/**
 * Sets up listeners for the Add / Edit Medicine modal and dynamic form controls.
 */
function initMedicineModal() {
  const modal = document.getElementById('medModal');
  const openBtns = [
    document.getElementById('openAddMedModalBtn'),
    document.getElementById('addMedMainBtn'),
    document.getElementById('emptyAddMedBtn'),
    document.getElementById('mobileFabBtn')
  ];
  const closeBtn = document.getElementById('closeMedModalBtn');
  const cancelBtn = document.getElementById('cancelMedModalBtn');
  const form = document.getElementById('medForm');

  // Open modal buttons
  openBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        openMedicineModal();
      });
    }
  });

  // Close modal buttons
  if (closeBtn) closeBtn.addEventListener('click', closeMedicineModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeMedicineModal);

  // Close on outside backdrop click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeMedicineModal();
    });
  }

  // Add Time Chip Button
  const addTimeBtn = document.getElementById('addTimeChipBtn');
  const newTimeInput = document.getElementById('newTimeInput');

  if (addTimeBtn && newTimeInput) {
    addTimeBtn.addEventListener('click', () => {
      const val = newTimeInput.value;
      if (val && !currentModalTimes.includes(val)) {
        currentModalTimes.push(val);
        currentModalTimes.sort();
        renderModalTimeChips();
      } else {
        showToast('Please pick a unique time.', 'warning');
      }
    });
  }

  // Days of Week Buttons
  const dayBtns = document.querySelectorAll('#daysSelector .day-btn');
  dayBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const day = parseInt(e.currentTarget.getAttribute('data-day'), 10);
      const idx = currentModalDays.indexOf(day);
      if (idx !== -1) {
        if (currentModalDays.length === 1) {
          showToast('Select at least one day per week.', 'warning');
          return;
        }
        currentModalDays.splice(idx, 1);
        e.currentTarget.classList.remove('active');
      } else {
        currentModalDays.push(day);
        e.currentTarget.classList.add('active');
      }
    });
  });

  // Food Timing Buttons
  const foodBtns = document.querySelectorAll('#foodTimingGrid .food-pill-btn');
  foodBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      foodBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentModalFoodTiming = e.currentTarget.getAttribute('data-timing');
    });
  });

  // Form Submit Handler
  if (form) {
    form.addEventListener('submit', handleMedicineFormSubmit);
  }

  // Search & Filter in Medicines Tab
  const searchInput = document.getElementById('medSearchInput');
  const typeFilter = document.getElementById('medTypeFilter');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      CarePulseMeds.renderMedicinesList(typeFilter ? typeFilter.value : 'all', e.target.value);
    });
  }

  if (typeFilter) {
    typeFilter.addEventListener('change', (e) => {
      CarePulseMeds.renderMedicinesList(e.target.value, searchInput ? searchInput.value : '');
    });
  }

  // Load demo data empty state button
  const emptyDemoBtn = document.getElementById('emptyDemoDataBtn');
  if (emptyDemoBtn) {
    emptyDemoBtn.addEventListener('click', loadCompleteDemoData);
  }
}

/**
 * Opens and populates the Add/Edit Medicine modal.
 */
function openMedicineModal(medToEdit = null) {
  const modal = document.getElementById('medModal');
  const title = document.getElementById('medModalTitle');
  const form = document.getElementById('medForm');
  if (!modal || !form) return;

  form.reset();

  if (medToEdit) {
    if (title) title.textContent = 'Edit Medicine';
    document.getElementById('medId').value = medToEdit.id;
    document.getElementById('medName').value = medToEdit.name;
    document.getElementById('medDose').value = medToEdit.dose;
    document.getElementById('medType').value = medToEdit.type;
    document.getElementById('medStartDate').value = medToEdit.startDate || '';
    document.getElementById('medEndDate').value = medToEdit.endDate || '';
    document.getElementById('medNotes').value = medToEdit.notes || '';

    currentModalTimes = Array.isArray(medToEdit.times) ? [...medToEdit.times] : ['08:00'];
    currentModalDays = Array.isArray(medToEdit.days) ? [...medToEdit.days] : [0, 1, 2, 3, 4, 5, 6];
    currentModalFoodTiming = medToEdit.foodTiming || 'after';
  } else {
    if (title) title.textContent = 'Add New Medicine';
    document.getElementById('medId').value = '';
    document.getElementById('medStartDate').value = new Date().toISOString().split('T')[0];

    currentModalTimes = ['08:00'];
    currentModalDays = [0, 1, 2, 3, 4, 5, 6];
    currentModalFoodTiming = 'after';
  }

  // Sync days of week buttons
  document.querySelectorAll('#daysSelector .day-btn').forEach(btn => {
    const day = parseInt(btn.getAttribute('data-day'), 10);
    btn.classList.toggle('active', currentModalDays.includes(day));
  });

  // Sync food timing buttons
  document.querySelectorAll('#foodTimingGrid .food-pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-timing') === currentModalFoodTiming);
  });

  renderModalTimeChips();
  modal.classList.add('open');
}

/**
 * Closes the medicine modal.
 */
function closeMedicineModal() {
  const modal = document.getElementById('medModal');
  if (modal) modal.classList.remove('open');
}

/**
 * Renders the time chips inside the medicine creation modal.
 */
function renderModalTimeChips() {
  const container = document.getElementById('timesChipContainer');
  if (!container) return;

  if (currentModalTimes.length === 0) {
    container.innerHTML = '<span style="font-size: 0.85rem; color: var(--coral-pulse);">Add at least one reminder time.</span>';
    return;
  }

  container.innerHTML = currentModalTimes.map((t, idx) => `
    <span class="time-chip-item">
      <span>${CarePulseMeds.formatTime12h(t)}</span>
      <span class="remove-time-btn" data-index="${idx}" title="Remove time" aria-label="Remove time">✕</span>
    </span>
  `).join('');

  container.querySelectorAll('.remove-time-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.getAttribute('data-index'), 10);
      if (currentModalTimes.length <= 1) {
        showToast('Prescriptions must have at least one reminder time.', 'warning');
        return;
      }
      currentModalTimes.splice(index, 1);
      renderModalTimeChips();
    });
  });
}

/**
 * Handles medicine form save submission (both Add and Edit).
 */
function handleMedicineFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('medId').value;
  const name = document.getElementById('medName').value;
  const dose = document.getElementById('medDose').value;
  const type = document.getElementById('medType').value;
  const startDate = document.getElementById('medStartDate').value;
  const endDate = document.getElementById('medEndDate').value;
  const notes = document.getElementById('medNotes').value;

  try {
    const payload = {
      name,
      dose,
      type,
      times: currentModalTimes,
      days: currentModalDays,
      foodTiming: currentModalFoodTiming,
      startDate,
      endDate,
      notes
    };

    if (id) {
      CarePulseMeds.updateMedicine(id, payload);
      showToast(`Updated ${name} successfully!`, 'success');
    } else {
      CarePulseMeds.addMedicine(payload);
      showToast(`Added ${name} to your daily schedule! 🎉`, 'success');
    }

    closeMedicineModal();
    CarePulseMeds.renderMedicinesList();
    CarePulseTracker.updateDashboardProgress();
    CarePulseTracker.renderDashboardTimeline();
    CarePulseTracker.updateDashboardStats();
    CarePulseReminders.updateNextMedicineCard();

  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * Sets up button actions inside the high-priority alarm popup modal.
 */
function initAlarmModalActions() {
  const takeBtn = document.getElementById('alarmTakeBtn');
  const snoozeBtn = document.getElementById('alarmSnoozeBtn');
  const skipBtn = document.getElementById('alarmSkipBtn');

  if (takeBtn) {
    takeBtn.addEventListener('click', () => {
      if (CarePulseReminders.currentAlarmMed && CarePulseReminders.currentAlarmTime) {
        CarePulseTracker.markMedicineStatus(
          CarePulseReminders.currentAlarmMed.id,
          CarePulseReminders.currentAlarmTime,
          'taken'
        );
      }
      CarePulseReminders.closeAlarmModal();
    });
  }

  if (snoozeBtn) {
    snoozeBtn.addEventListener('click', () => {
      if (CarePulseReminders.currentAlarmMed && CarePulseReminders.currentAlarmTime) {
        CarePulseReminders.snoozeReminder(
          CarePulseReminders.currentAlarmMed.id,
          CarePulseReminders.currentAlarmTime,
          10
        );
      } else {
        CarePulseReminders.closeAlarmModal();
      }
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (CarePulseReminders.currentAlarmMed && CarePulseReminders.currentAlarmTime) {
        CarePulseTracker.markMedicineStatus(
          CarePulseReminders.currentAlarmMed.id,
          CarePulseReminders.currentAlarmTime,
          'skipped'
        );
      }
      CarePulseReminders.closeAlarmModal();
    });
  }
}

/**
 * Initializes listeners in the Settings tab (sound test, backup export/import, demo data, reset).
 */
function initSettingsListeners() {
  // Test Chime sound
  const testSoundBtn = document.getElementById('testSoundBtn');
  if (testSoundBtn) {
    testSoundBtn.addEventListener('click', () => {
      CarePulseReminders.playAlarmChime();
      showToast('Playing pleasant medical chime alert 🔔', 'info');
    });
  }

  // Test Notification
  const testNotifyBtn = document.getElementById('testNotifyBtn');
  if (testNotifyBtn) {
    testNotifyBtn.addEventListener('click', async () => {
      if (!('Notification' in window)) {
        showToast('Notifications are not supported in this browser.', 'warning');
        return;
      }
      if (Notification.permission !== 'granted') {
        const perm = await CarePulseReminders.requestNotificationPermission();
        if (perm !== 'granted') return;
      }
      try {
        new Notification('CarePulse Reminder Test', {
          body: 'This is how your medicine reminders will appear on your device.',
          icon: 'assets/logo.svg'
        });
        showToast('Test notification dispatched!', 'success');
      } catch (e) {
        showToast('Failed to trigger notification: ' + e.message, 'error');
      }
    });
  }

  // Export JSON Backup
  const exportBtn = document.getElementById('exportBackupBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportBackupJSON);
  }

  // Import JSON Backup
  const importInput = document.getElementById('importBackupInput');
  if (importInput) {
    importInput.addEventListener('change', handleImportBackup);
  }

  // Settings Load Demo Data
  const demoBtn = document.getElementById('settingsLoadDemoBtn');
  if (demoBtn) {
    demoBtn.addEventListener('click', loadCompleteDemoData);
  }

  // Reset All Data
  const resetBtn = document.getElementById('resetAllDataBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('WARNING: Are you sure you want to delete all medicines, logs, and vitals? This cannot be undone.')) {
        localStorage.clear();
        showToast('All local CarePulse data has been reset.', 'info');
        setTimeout(() => location.reload(), 800);
      }
    });
  }
}

/**
 * Exports all user data as an easy-to-download JSON file.
 */
function exportBackupJSON() {
  try {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      medicines: CarePulseMeds.getMedicines(),
      intakeLogs: CarePulseTracker.getIntakeLogs(),
      healthLogs: CarePulseHealthLog.getHealthLogs(),
      emergencyContacts: window.CarePulseEmergency ? CarePulseEmergency.getContacts() : [],
      patientName: window.CarePulseEmergency ? CarePulseEmergency.getPatientName() : '',
      missedDoseThreshold: window.CarePulseEmergency ? CarePulseEmergency.getMissedDoseThreshold() : 15,
      settings: {
        theme: localStorage.getItem('carepulse_theme') || 'dark',
        elderMode: localStorage.getItem('carepulse_elder_mode') === 'true',
        voiceReminders: window.CarePulseVoice ? CarePulseVoice.getVoiceRemindersEnabled() : false,
        voiceLang: window.CarePulseVoice ? CarePulseVoice.getVoiceLang() : 'en-IN'
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `carepulse-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Backup exported successfully! 📁', 'success');
  } catch (err) {
    console.error('Export error:', err);
    showToast('Failed to export backup.', 'error');
  }
}

/**
 * Handles reading and importing a user JSON backup file.
 */
function handleImportBackup(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (!data.medicines || !Array.isArray(data.medicines)) {
        throw new Error('Invalid backup file format: missing medicines data.');
      }

      CarePulseMeds.saveMedicines(data.medicines);
      if (data.intakeLogs && Array.isArray(data.intakeLogs)) {
        CarePulseTracker.saveIntakeLogs(data.intakeLogs);
      }
      if (data.healthLogs && Array.isArray(data.healthLogs)) {
        CarePulseHealthLog.saveHealthLogs(data.healthLogs);
      }
      if (data.emergencyContacts && Array.isArray(data.emergencyContacts) && window.CarePulseEmergency) {
        CarePulseEmergency.saveContacts(data.emergencyContacts);
      }
      if (data.patientName && window.CarePulseEmergency) {
        CarePulseEmergency.setPatientName(data.patientName);
      }
      if (data.missedDoseThreshold && window.CarePulseEmergency) {
        CarePulseEmergency.setMissedDoseThreshold(data.missedDoseThreshold);
      }
      if (data.settings && window.CarePulseVoice) {
        if (typeof data.settings.voiceReminders === 'boolean') {
          CarePulseVoice.setVoiceRemindersEnabled(data.settings.voiceReminders);
        }
        if (data.settings.voiceLang) {
          CarePulseVoice.setVoiceLang(data.settings.voiceLang);
        }
      }

      showToast('Backup restored successfully! Refreshing...', 'success');
      setTimeout(() => location.reload(), 1000);
    } catch (err) {
      console.error('Import error:', err);
      showToast('Failed to import backup: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}

/**
 * Loads a rich set of realistic demonstration data across all modules:
 * prescriptions, adherence streak, vitals history, and dashboard timelines.
 */
function loadCompleteDemoData() {
  CarePulseMeds.loadDemoMedicines();
  CarePulseTracker.loadDemoLogs();
  CarePulseHealthLog.loadDemoHealthLogs();
  if (window.CarePulseEmergency) {
    if (CarePulseEmergency.getContacts().length === 0) {
      CarePulseEmergency.setPatientName('Rajesh Sharma');
      CarePulseEmergency.saveContacts([
        {
          id: 'contact_demo_1',
          name: 'Priya Sharma',
          relation: 'Daughter',
          phone: '+91 98765 43210',
          createdAt: new Date().toISOString()
        },
        {
          id: 'contact_demo_2',
          name: 'Dr. Arvind Mehta',
          relation: 'Doctor',
          phone: '+91 91234 56789',
          createdAt: new Date().toISOString()
        }
      ]);
    }
  }
  showToast('Comprehensive demo health profile loaded! 🌟', 'success');
}

/**
 * Checks if the app is launched for the first time without any data,
 * and if so, gently seeds demo data or highlights setup.
 */
function checkFirstTimeLaunch() {
  const meds = CarePulseMeds.getMedicines();
  if (meds.length === 0) {
    const hasLaunched = localStorage.getItem('carepulse_has_visited');
    if (!hasLaunched) {
      // First visit: automatically seed realistic demo data so the app looks stunning immediately!
      loadCompleteDemoData();
      localStorage.setItem('carepulse_has_visited', 'true');
    }
  }
}

/**
 * Safely escapes HTML strings to prevent XSS.
 */
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Displays modern floating toast messages.
 * Types: 'success' | 'error' | 'warning' | 'info'
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: 'check-circle-2',
    error: 'alert-circle',
    warning: 'alert-triangle',
    info: 'info'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i data-lucide="${icons[type] || 'info'}" style="width: 20px; height: 20px; flex-shrink: 0;"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  // Auto remove after 3.8 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3800);
}
