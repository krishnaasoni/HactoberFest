/**
 * ============================================================================
 * CarePulse — Emergency & Family Alerts Module (js/emergency.js)
 * Manages emergency contacts (up to 3), patient identity, SOS quick-call &
 * WhatsApp alerts, and missed-dose family notification prompts.
 * ============================================================================
 */

// Storage keys for local persistence
const STORAGE_KEY_CONTACTS = 'carepulse_emergency_contacts';
const STORAGE_KEY_PATIENT_NAME = 'carepulse_patient_name';
const STORAGE_KEY_MISSED_THRESHOLD = 'carepulse_missed_threshold';
const STORAGE_KEY_PROMPTED_MISSED = 'carepulse_prompted_missed_doses';

// Currently active missed dose pending user confirmation
let currentMissedMed = null;
let currentMissedTime = null;

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
 * Initializes emergency module listeners, loads settings, and sets up modal triggers.
 */
function initEmergency() {
  initPatientNameSetting();
  initMissedThresholdSetting();
  renderSettingsContacts();
  initContactModal();
  initSOSModal();
  initMissedDoseModal();
}

/**
 * Loads the patient's own name from localStorage or returns a friendly default.
 */
function getPatientName() {
  try {
    const name = localStorage.getItem(STORAGE_KEY_PATIENT_NAME);
    return name && name.trim() ? name.trim() : 'Patient';
  } catch (e) {
    return 'Patient';
  }
}

/**
 * Saves the patient's name to localStorage.
 */
function setPatientName(name) {
  try {
    const trimmed = (name || '').trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY_PATIENT_NAME, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY_PATIENT_NAME);
    }
  } catch (e) {
    console.error('Failed to save patient name:', e);
  }
}

/**
 * Initializes the Patient Name input in the Settings tab.
 */
function initPatientNameSetting() {
  const input = document.getElementById('patientNameInput');
  const saveBtn = document.getElementById('savePatientNameBtn');
  if (!input) return;

  const current = localStorage.getItem(STORAGE_KEY_PATIENT_NAME) || '';
  input.value = current;

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const val = input.value.trim();
      setPatientName(val);
      if (window.showToast) {
        showToast(val ? `Patient name saved as "${val}"` : 'Patient name cleared', 'success');
      }
    });
  }

  // Also auto-save on blur
  input.addEventListener('blur', () => {
    setPatientName(input.value.trim());
  });
}

/**
 * Returns the list of saved emergency contacts from localStorage (max 3).
 */
function getContacts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONTACTS);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load emergency contacts:', e);
    return [];
  }
}

/**
 * Saves an array of emergency contacts to localStorage and refreshes UI.
 */
function saveContacts(contacts) {
  try {
    const trimmed = (contacts || []).slice(0, 3);
    localStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(trimmed));
    renderSettingsContacts();
  } catch (e) {
    console.error('Failed to save emergency contacts:', e);
  }
}

/**
 * Validates phone numbers to ensure they contain between 7 and 15 digits.
 */
function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required.' };
  }
  const trimmed = phone.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return {
      valid: false,
      error: 'Please enter a valid phone number (7 to 15 digits).'
    };
  }

  return {
    valid: true,
    error: null,
    cleaned: digitsOnly,
    formatted: trimmed.startsWith('+') ? `+${digitsOnly}` : digitsOnly
  };
}

/**
 * Adds a new emergency contact (max 3 contacts permitted).
 */
function addContact(contactData) {
  const contacts = getContacts();
  if (contacts.length >= 3) {
    throw new Error('You can save a maximum of 3 emergency contacts.');
  }

  const name = (contactData.name || '').trim();
  const relation = (contactData.relation || 'Family').trim();
  const phoneValidation = validatePhone(contactData.phone);

  if (!name) {
    throw new Error('Please enter the contact\'s name.');
  }
  if (!phoneValidation.valid) {
    throw new Error(phoneValidation.error);
  }

  const newContact = {
    id: 'contact_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    name,
    relation,
    phone: phoneValidation.formatted,
    createdAt: new Date().toISOString()
  };

  contacts.push(newContact);
  saveContacts(contacts);
  return newContact;
}

/**
 * Updates an existing emergency contact by ID.
 */
function updateContact(id, updatedData) {
  const contacts = getContacts();
  const index = contacts.findIndex(c => c.id === id);
  if (index === -1) {
    throw new Error('Contact not found.');
  }

  const name = (updatedData.name || '').trim();
  const relation = (updatedData.relation || 'Family').trim();
  const phoneValidation = validatePhone(updatedData.phone);

  if (!name) {
    throw new Error('Please enter the contact\'s name.');
  }
  if (!phoneValidation.valid) {
    throw new Error(phoneValidation.error);
  }

  contacts[index] = {
    ...contacts[index],
    name,
    relation,
    phone: phoneValidation.formatted,
    updatedAt: new Date().toISOString()
  };

  saveContacts(contacts);
  return contacts[index];
}

/**
 * Deletes an emergency contact by ID.
 */
function deleteContact(id) {
  const contacts = getContacts();
  const filtered = contacts.filter(c => c.id !== id);
  saveContacts(filtered);
  if (window.showToast) {
    showToast('Contact removed.', 'info');
  }
}

/**
 * Renders the emergency contacts list inside the Settings section.
 */
function renderSettingsContacts() {
  const container = document.getElementById('emergencyContactsList');
  const addBtn = document.getElementById('openAddContactBtn');
  if (!container) return;

  const contacts = getContacts();

  // Control visibility / state of Add button (max 3)
  if (addBtn) {
    if (contacts.length >= 3) {
      addBtn.disabled = true;
      addBtn.title = 'Maximum 3 contacts reached';
      addBtn.style.opacity = '0.6';
    } else {
      addBtn.disabled = false;
      addBtn.title = 'Add new emergency contact';
      addBtn.style.opacity = '1';
    }
  }

  if (contacts.length === 0) {
    container.innerHTML = `
      <div class="emergency-empty-state">
        <i data-lucide="shield-alert" style="width: 32px; height: 32px; color: var(--coral-pulse); margin-bottom: 8px;"></i>
        <p><strong>No emergency contacts saved.</strong></p>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
          Add up to 3 trusted family members or caregivers to enable 1-tap SOS calls and missed-dose alerts.
        </p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = contacts.map(c => `
    <div class="emergency-contact-card" data-id="${c.id}">
      <div class="emergency-contact-avatar">
        <i data-lucide="user"></i>
      </div>
      <div class="emergency-contact-details">
        <div class="emergency-contact-name-row">
          <span class="emergency-contact-name">${escapeHtml(c.name)}</span>
          <span class="badge badge-teal">${escapeHtml(c.relation)}</span>
        </div>
        <div class="emergency-contact-phone">
          <i data-lucide="phone" style="width: 14px; height: 14px;"></i>
          <span>${escapeHtml(c.phone)}</span>
        </div>
      </div>
      <div class="emergency-contact-actions">
        <button class="btn btn-icon btn-sm edit-contact-btn" data-id="${c.id}" title="Edit contact" aria-label="Edit contact">
          <i data-lucide="edit-2"></i>
        </button>
        <button class="btn btn-icon btn-sm delete-contact-btn" data-id="${c.id}" title="Delete contact" aria-label="Delete contact">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();

  // Attach event handlers for Edit and Delete
  container.querySelectorAll('.edit-contact-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const contact = contacts.find(c => c.id === id);
      if (contact) openContactModal(contact);
    });
  });

  container.querySelectorAll('.delete-contact-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this emergency contact?')) {
        deleteContact(id);
      }
    });
  });
}

/**
 * Initializes modal dialog listeners for adding and editing emergency contacts.
 */
function initContactModal() {
  const modal = document.getElementById('contactModal');
  const openBtn = document.getElementById('openAddContactBtn');
  const closeBtn = document.getElementById('closeContactModalBtn');
  const cancelBtn = document.getElementById('cancelContactModalBtn');
  const form = document.getElementById('contactForm');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      const contacts = getContacts();
      if (contacts.length >= 3) {
        if (window.showToast) showToast('You can only save up to 3 emergency contacts.', 'warning');
        return;
      }
      openContactModal();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeContactModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeContactModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeContactModal();
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('contactId').value;
      const name = document.getElementById('contactName').value;
      const relation = document.getElementById('contactRelation').value;
      const phone = document.getElementById('contactPhone').value;

      try {
        if (id) {
          updateContact(id, { name, relation, phone });
          if (window.showToast) showToast(`Updated ${name} successfully!`, 'success');
        } else {
          addContact({ name, relation, phone });
          if (window.showToast) showToast(`Added ${name} to emergency contacts!`, 'success');
        }
        closeContactModal();
      } catch (err) {
        if (window.showToast) showToast(err.message, 'error');
      }
    });
  }
}

/**
 * Opens and populates the Add/Edit Emergency Contact modal dialog.
 */
function openContactModal(contactToEdit = null) {
  const modal = document.getElementById('contactModal');
  const title = document.getElementById('contactModalTitle');
  const form = document.getElementById('contactForm');
  if (!modal || !form) return;

  form.reset();

  if (contactToEdit) {
    if (title) title.textContent = 'Edit Emergency Contact';
    document.getElementById('contactId').value = contactToEdit.id;
    document.getElementById('contactName').value = contactToEdit.name;
    document.getElementById('contactRelation').value = contactToEdit.relation;
    document.getElementById('contactPhone').value = contactToEdit.phone;
  } else {
    if (title) title.textContent = 'Add Emergency Contact';
    document.getElementById('contactId').value = '';
    document.getElementById('contactRelation').value = 'Family';
  }

  modal.classList.add('open');
}

/**
 * Closes the Add/Edit Emergency Contact modal dialog.
 */
function closeContactModal() {
  const modal = document.getElementById('contactModal');
  if (modal) modal.classList.remove('open');
}

/**
 * Formats a clean wa.me WhatsApp URL for a given phone number and text message.
 */
function formatWhatsAppUrl(phone, message) {
  const digits = (phone || '').replace(/\D/g, '');
  // Default to 91 country code if 10 digits entered without country prefix
  const cleanNumber = digits.length === 10 ? '91' + digits : digits;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Initializes the floating SOS button and modal dialog.
 */
function initSOSModal() {
  const sosFloatingBtn = document.getElementById('sosFloatingBtn');
  const modal = document.getElementById('sosModal');
  const closeBtn = document.getElementById('closeSOSModalBtn');

  if (sosFloatingBtn) {
    sosFloatingBtn.addEventListener('click', openSOSModal);
  }

  if (closeBtn) closeBtn.addEventListener('click', closeSOSModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeSOSModal();
    });
  }
}

/**
 * Opens and populates the Emergency SOS modal with call links and WhatsApp alerts.
 */
function openSOSModal() {
  const modal = document.getElementById('sosModal');
  const contactsContainer = document.getElementById('sosContactsList');
  if (!modal) return;

  const contacts = getContacts();
  const patientName = getPatientName();

  if (contactsContainer) {
    if (contacts.length === 0) {
      contactsContainer.innerHTML = `
        <div class="sos-no-contacts">
          <p><strong>No personal emergency contacts saved yet.</strong></p>
          <p style="font-size: 0.88rem; color: var(--text-muted); margin: 6px 0 14px;">
            You can still call national emergency services above, or add your family in Settings.
          </p>
          <button class="btn btn-secondary btn-sm" id="sosGoToSettingsBtn">
            <i data-lucide="settings"></i> Open Settings to Add Contacts
          </button>
        </div>
      `;
      const goToSettings = document.getElementById('sosGoToSettingsBtn');
      if (goToSettings) {
        goToSettings.addEventListener('click', () => {
          closeSOSModal();
          const settingsNav = document.getElementById('navSettings');
          if (settingsNav) settingsNav.click();
        });
      }
    } else {
      contactsContainer.innerHTML = contacts.map(c => {
        const cleanPhone = c.phone.replace(/\s+/g, '');
        const alertMsg = `${patientName} needs help. Please call them as soon as possible.`;
        const waLink = formatWhatsAppUrl(c.phone, alertMsg);

        return `
          <div class="sos-contact-card">
            <div class="sos-contact-info">
              <span class="sos-contact-name">${escapeHtml(c.name)}</span>
              <span class="badge badge-teal">${escapeHtml(c.relation)}</span>
            </div>
            <div class="sos-contact-actions">
              <a href="tel:${cleanPhone}" class="btn btn-danger sos-action-btn" aria-label="Call ${escapeHtml(c.name)}">
                <i data-lucide="phone"></i> Call ${escapeHtml(c.name)}
              </a>
              <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp sos-action-btn" aria-label="WhatsApp alert to ${escapeHtml(c.name)}">
                <i data-lucide="message-circle"></i> Send WhatsApp Alert
              </a>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  if (window.lucide) lucide.createIcons();
  modal.classList.add('open');
}

/**
 * Closes the Emergency SOS modal dialog.
 */
function closeSOSModal() {
  const modal = document.getElementById('sosModal');
  if (modal) modal.classList.remove('open');
}

/**
 * Retrieves the configured missed-dose threshold in minutes (default 15).
 */
function getMissedDoseThreshold() {
  try {
    const val = localStorage.getItem(STORAGE_KEY_MISSED_THRESHOLD);
    const parsed = parseInt(val, 10);
    return [10, 15, 30, 45].includes(parsed) ? parsed : 15;
  } catch (e) {
    return 15;
  }
}

/**
 * Saves the configured missed-dose threshold in minutes.
 */
function setMissedDoseThreshold(minutes) {
  try {
    const parsed = parseInt(minutes, 10);
    const valid = [10, 15, 30, 45].includes(parsed) ? parsed : 15;
    localStorage.setItem(STORAGE_KEY_MISSED_THRESHOLD, String(valid));
  } catch (e) {
    console.error('Failed to save missed dose threshold:', e);
  }
}

/**
 * Initializes the Missed-Dose Threshold select input in the Settings tab.
 */
function initMissedThresholdSetting() {
  const select = document.getElementById('missedDoseThresholdSelect');
  if (!select) return;

  const current = getMissedDoseThreshold();
  select.value = String(current);

  select.addEventListener('change', (e) => {
    setMissedDoseThreshold(e.target.value);
    if (window.showToast) {
      showToast(`Missed-dose alert threshold updated to ${e.target.value} minutes.`, 'info');
    }
  });
}

/**
 * Checks all active medicines for overdue doses that have not been taken or skipped
 * within the configured threshold, and triggers the missed-dose family alert prompt.
 */
function checkMissedDoses() {
  if (!window.CarePulseMeds || !window.CarePulseTracker) return;

  // Never interrupt user if any modal dialog is currently open
  if (document.querySelector('.modal-overlay.open')) return;

  const meds = CarePulseMeds.getMedicines();
  if (!meds || meds.length === 0) return;

  const now = new Date();
  const currentDayOfWeek = now.getDay();
  const todayDateStr = now.toISOString().split('T')[0];
  const currentMinutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  const thresholdMinutes = getMissedDoseThreshold();

  const todayLogs = CarePulseTracker.getTodayLogs();
  const snoozedQueue = window.CarePulseReminders ? CarePulseReminders.getSnoozedReminders() : [];

  // Track prompted doses for today to avoid repeated alert loops
  let promptedToday = {};
  try {
    const rawPrompted = sessionStorage.getItem(STORAGE_KEY_PROMPTED_MISSED);
    promptedToday = rawPrompted ? JSON.parse(rawPrompted) : {};
  } catch (e) {
    promptedToday = {};
  }

  meds.forEach(med => {
    // Check dates and schedule days
    if (med.startDate && todayDateStr < med.startDate) return;
    if (med.endDate && todayDateStr > med.endDate) return;
    if (med.days && !med.days.includes(currentDayOfWeek)) return;

    med.times.forEach(schedTime => {
      const [h, m] = schedTime.split(':').map(Number);
      const schedMinutes = h * 60 + m;
      const diffMinutes = currentMinutesSinceMidnight - schedMinutes;

      // Check if dose is overdue past the configured threshold (e.g. >= 15 min)
      // and within the recent 45-minute notification window
      if (diffMinutes < thresholdMinutes || diffMinutes > (thresholdMinutes + 45)) return;

      // Check if already taken or skipped
      const existingLog = todayLogs.find(
        log => log.medicineId === med.id && log.time === schedTime
      );
      if (existingLog && (existingLog.status === 'taken' || existingLog.status === 'skipped')) {
        return;
      }

      // Check if currently actively snoozed
      const isSnoozed = snoozedQueue.some(
        s => s.medicineId === med.id && s.time === schedTime && s.snoozeUntil > Date.now()
      );
      if (isSnoozed) return;

      // If already recorded as 'missed' and already prompted today, skip
      const promptKey = `${todayDateStr}_${med.id}_${schedTime}`;
      if (promptedToday[promptKey]) return;

      // Prompt the user about the missed dose!
      promptedToday[promptKey] = true;
      try {
        sessionStorage.setItem(STORAGE_KEY_PROMPTED_MISSED, JSON.stringify(promptedToday));
      } catch (e) {}

      // Automatically record as 'missed' in history if not already recorded
      if (!existingLog) {
        CarePulseTracker.markMedicineStatus(med.id, schedTime, 'missed');
      }

      // Show the family notification prompt modal
      promptMissedDose(med, schedTime);
    });
  });
}

/**
 * Initializes event listeners for the Missed Dose Family Alert modal dialog.
 */
function initMissedDoseModal() {
  const modal = document.getElementById('missedDoseModal');
  const closeBtn = document.getElementById('closeMissedDoseModalBtn');
  const dismissBtn = document.getElementById('missedDismissBtn');
  const takenBtn = document.getElementById('missedTakeBtn');
  const skipBtn = document.getElementById('missedSkipBtn');

  if (closeBtn) closeBtn.addEventListener('click', closeMissedDoseModal);
  if (dismissBtn) dismissBtn.addEventListener('click', closeMissedDoseModal);

  if (takenBtn) {
    takenBtn.addEventListener('click', () => {
      if (currentMissedMed && currentMissedTime && window.CarePulseTracker) {
        CarePulseTracker.markMedicineStatus(currentMissedMed.id, currentMissedTime, 'taken');
      }
      closeMissedDoseModal();
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (currentMissedMed && currentMissedTime && window.CarePulseTracker) {
        CarePulseTracker.markMedicineStatus(currentMissedMed.id, currentMissedTime, 'skipped');
      }
      closeMissedDoseModal();
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeMissedDoseModal();
    });
  }
}

/**
 * Displays the Missed-Dose Prompt modal dialog with contact selection for WhatsApp alert.
 */
function promptMissedDose(medicine, scheduledTime) {
  currentMissedMed = medicine;
  currentMissedTime = scheduledTime;

  const modal = document.getElementById('missedDoseModal');
  const medNameEl = document.getElementById('missedMedName');
  const detailsEl = document.getElementById('missedMedDetails');
  const contactsContainer = document.getElementById('missedDoseContactsContainer');
  if (!modal) return;

  const formattedTime = window.CarePulseMeds ? CarePulseMeds.formatTime12h(scheduledTime) : scheduledTime;
  const patientName = getPatientName();

  if (medNameEl) medNameEl.textContent = `${medicine.name} was not taken`;
  if (detailsEl) {
    detailsEl.textContent = `Scheduled dose of ${medicine.dose} at ${formattedTime} has passed. Would you like to notify your family?`;
  }

  const contacts = getContacts();
  if (contactsContainer) {
    if (contacts.length === 0) {
      contactsContainer.innerHTML = `
        <div class="missed-no-contacts">
          <p style="font-size: 0.9rem; color: var(--text-muted);">
            No emergency contacts saved yet. Add contacts in Settings to enable 1-tap WhatsApp notifications for your family.
          </p>
        </div>
      `;
    } else {
      const msg = `${patientName} has not taken ${medicine.name} (${medicine.dose}) scheduled at ${formattedTime}.`;
      contactsContainer.innerHTML = `
        <div class="missed-contacts-prompt-label">Select a contact to notify via WhatsApp:</div>
        <div class="missed-contacts-btn-group">
          ${contacts.map(c => {
            const waLink = formatWhatsAppUrl(c.phone, msg);
            return `
              <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp missed-contact-wa-btn" data-contact="${escapeHtml(c.name)}">
                <i data-lucide="message-circle"></i>
                <span>Notify ${escapeHtml(c.name)} (${escapeHtml(c.relation)})</span>
              </a>
            `;
          }).join('')}
        </div>
      `;
    }
  }

  if (window.lucide) lucide.createIcons();
  modal.classList.add('open');
}

/**
 * Closes the Missed-Dose Prompt modal dialog.
 */
function closeMissedDoseModal() {
  const modal = document.getElementById('missedDoseModal');
  if (modal) modal.classList.remove('open');
  currentMissedMed = null;
  currentMissedTime = null;
}

// Expose Emergency module globally
var CarePulseEmergency = window.CarePulseEmergency = {
  initEmergency,
  getPatientName,
  setPatientName,
  getContacts,
  saveContacts,
  addContact,
  updateContact,
  deleteContact,
  validatePhone,
  getMissedDoseThreshold,
  setMissedDoseThreshold,
  openSOSModal,
  closeSOSModal,
  openContactModal,
  closeContactModal,
  renderSettingsContacts,
  checkMissedDoses,
  promptMissedDose,
  closeMissedDoseModal,
  formatWhatsAppUrl
};
