/**
 * ============================================================================
 * CarePulse — Medicines Module (js/medicines.js)
 * Manages adding, editing, deleting, filtering, and storing medications.
 * ============================================================================
 */

// Storage key used in browser localStorage
const STORAGE_KEY_MEDICINES = 'carepulse_medicines';

/**
 * Loads the list of saved medicines from browser localStorage.
 * If no medicines are saved yet, it returns an empty array.
 */
function getMedicines() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY_MEDICINES);
    return rawData ? JSON.parse(rawData) : [];
  } catch (error) {
    console.error('Failed to load medicines from localStorage:', error);
    return [];
  }
}

/**
 * Saves an array of medicine objects into browser localStorage.
 * This ensures all user prescription changes are remembered across page reloads.
 */
function saveMedicines(medicines) {
  try {
    localStorage.setItem(STORAGE_KEY_MEDICINES, JSON.stringify(medicines));
    // Update badge counter in sidebar
    updateMedsCountBadge();
  } catch (error) {
    console.error('Failed to save medicines to localStorage:', error);
  }
}

/**
 * Finds and returns a single medicine object by its unique ID.
 */
function getMedicineById(id) {
  const allMeds = getMedicines();
  return allMeds.find(m => m.id === id) || null;
}

/**
 * Creates and adds a new medicine record to localStorage with validation.
 * Generates a unique timestamp-based ID and timestamps.
 */
function addMedicine(medData) {
  const allMeds = getMedicines();

  // Basic validation check
  if (!medData.name || !medData.name.trim()) {
    throw new Error('Please provide a valid medicine name.');
  }
  if (!medData.dose || !medData.dose.trim()) {
    throw new Error('Please specify the dosage (e.g., 500mg, 10ml).');
  }
  if (!medData.times || medData.times.length === 0) {
    throw new Error('Please set at least one reminder time.');
  }

  const newMedicine = {
    id: 'med_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    name: medData.name.trim(),
    dose: medData.dose.trim(),
    type: medData.type || 'tablet',
    times: Array.isArray(medData.times) ? [...new Set(medData.times)].sort() : ['08:00'],
    days: medData.days && medData.days.length > 0 ? medData.days : [0, 1, 2, 3, 4, 5, 6],
    foodTiming: medData.foodTiming || 'after',
    startDate: medData.startDate || new Date().toISOString().split('T')[0],
    endDate: medData.endDate || '',
    notes: medData.notes ? medData.notes.trim() : '',
    createdAt: new Date().toISOString()
  };

  allMeds.push(newMedicine);
  saveMedicines(allMeds);
  return newMedicine;
}

/**
 * Updates an existing medicine with new values supplied from the edit form.
 */
function updateMedicine(id, updatedFields) {
  const allMeds = getMedicines();
  const index = allMeds.findIndex(m => m.id === id);

  if (index === -1) {
    throw new Error('Medicine not found.');
  }

  allMeds[index] = {
    ...allMeds[index],
    name: updatedFields.name ? updatedFields.name.trim() : allMeds[index].name,
    dose: updatedFields.dose ? updatedFields.dose.trim() : allMeds[index].dose,
    type: updatedFields.type || allMeds[index].type,
    times: updatedFields.times && updatedFields.times.length > 0 ? [...new Set(updatedFields.times)].sort() : allMeds[index].times,
    days: updatedFields.days || allMeds[index].days,
    foodTiming: updatedFields.foodTiming || allMeds[index].foodTiming,
    startDate: updatedFields.startDate || allMeds[index].startDate,
    endDate: updatedFields.endDate !== undefined ? updatedFields.endDate : allMeds[index].endDate,
    notes: updatedFields.notes !== undefined ? updatedFields.notes.trim() : allMeds[index].notes,
    updatedAt: new Date().toISOString()
  };

  saveMedicines(allMeds);
  return allMeds[index];
}

/**
 * Removes a medicine from localStorage permanently by its ID.
 */
function deleteMedicine(id) {
  const allMeds = getMedicines();
  const filtered = allMeds.filter(m => m.id !== id);
  saveMedicines(filtered);
}

/**
 * Helper to get a human-friendly emoji and label for a medicine form type.
 */
function getMedicineTypeMeta(type) {
  const map = {
    tablet: { emoji: '💊', label: 'Tablet' },
    capsule: { emoji: '💊', label: 'Capsule' },
    syrup: { emoji: '🧴', label: 'Syrup' },
    injection: { emoji: '💉', label: 'Injection' },
    drops: { emoji: '💧', label: 'Drops' },
    inhaler: { emoji: '💨', label: 'Inhaler' },
    ointment: { emoji: '🧴', label: 'Ointment' }
  };
  return map[type] || { emoji: '💊', label: 'Medicine' };
}

/**
 * Formats 24h time ("14:30") to readable 12h format ("2:30 PM").
 */
function formatTime12h(time24) {
  if (!time24) return '';
  const [hourStr, minStr] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const min = minStr || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour}:${min} ${ampm}`;
}

/**
 * Returns human-readable label for meal instructions.
 */
function getFoodTimingLabel(foodTiming) {
  const map = {
    before: '🍽️ Before Food',
    after: '🍲 After Food',
    with: '🥪 With Food',
    any: '⏰ Any Time'
  };
  return map[foodTiming] || '🍲 After Food';
}

/**
 * Updates the badge in the navigation sidebar displaying the total active medicines.
 */
function updateMedsCountBadge() {
  const badge = document.getElementById('medsCountBadge');
  const statTotal = document.getElementById('statTotalMeds');
  const count = getMedicines().length;
  if (badge) badge.textContent = count;
  if (statTotal) statTotal.textContent = count;
}

/**
 * Renders all medicine cards in the Medicines tab based on optional search and filter.
 */
function renderMedicinesList(filterType = 'all', searchQuery = '') {
  const container = document.getElementById('medsCardsGrid');
  const emptyState = document.getElementById('medsEmptyState');
  if (!container) return;

  let meds = getMedicines();

  // Apply form type filter
  if (filterType && filterType !== 'all') {
    meds = meds.filter(m => m.type.toLowerCase() === filterType.toLowerCase());
  }

  // Apply search query filter
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    meds = meds.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.dose.toLowerCase().includes(q) ||
      (m.notes && m.notes.toLowerCase().includes(q))
    );
  }

  // Handle empty state display
  if (meds.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  // Render cards HTML
  container.innerHTML = meds.map(med => {
    const typeMeta = getMedicineTypeMeta(med.type);
    const timesHtml = med.times.map(t => `
      <span class="med-time-tag">
        <i data-lucide="clock" style="width: 12px; height: 12px;"></i>
        ${formatTime12h(t)}
      </span>
    `).join('');

    const daysLabel = med.days.length === 7 ? 'Daily' : `${med.days.length} days/week`;

    return `
      <div class="med-card" data-id="${med.id}">
        <div>
          <div class="med-card-top">
            <div class="med-type-avatar" title="${typeMeta.label}">
              <span>${typeMeta.emoji}</span>
            </div>
            <div class="med-menu-actions">
              <button class="btn btn-icon btn-sm edit-med-btn" data-id="${med.id}" title="Edit Medicine" aria-label="Edit ${med.name}">
                <i data-lucide="edit-3"></i>
              </button>
              <button class="btn btn-icon btn-sm delete-med-btn" data-id="${med.id}" title="Delete Medicine" style="color: var(--coral-pulse);" aria-label="Delete ${med.name}">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>

          <h3 class="med-name">${escapeHtml(med.name)}</h3>
          <div class="med-dose-pill">${escapeHtml(med.dose)} • ${typeMeta.label}</div>

          <div class="med-times-list">
            ${timesHtml}
          </div>

          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
            <span class="badge badge-teal">${getFoodTimingLabel(med.foodTiming)}</span>
            <span class="badge badge-blue"><i data-lucide="calendar"></i> ${daysLabel}</span>
          </div>

          ${med.notes ? `<p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 8px; font-style: italic;">“${escapeHtml(med.notes)}”</p>` : ''}
        </div>

        <div class="med-card-footer">
          <span>Started: ${med.startDate || 'Today'}</span>
          ${med.endDate ? `<span>Ends: ${med.endDate}</span>` : `<span style="color: var(--emerald-success);">● Continuous</span>`}
        </div>
      </div>
    `;
  }).join('');

  // Re-initialize Lucide icons on newly inserted elements
  if (window.lucide && typeof lucide.createIcons === 'function') {
    lucide.createIcons();
  }

  // Attach event listeners for edit and delete buttons
  attachMedCardActions();

  // Re-bind dynamic 3D tilt & mouse spotlight
  if (window.CarePulseCinematic && typeof CarePulseCinematic.initMouseSpotlightAndTilt === 'function') {
    CarePulseCinematic.initMouseSpotlightAndTilt();
  }
}

/**
 * Attaches click event listeners for the edit and delete buttons on medicine cards.
 */
function attachMedCardActions() {
  document.querySelectorAll('.edit-med-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const med = getMedicineById(id);
      if (med) {
        openMedicineModal(med);
      }
    });
  });

  document.querySelectorAll('.delete-med-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const med = getMedicineById(id);
      if (!med) return;
      if (confirm(`Are you sure you want to delete ${med.name}?`)) {
        deleteMedicine(id);
        renderMedicinesList();
        if (typeof renderDashboardTimeline === 'function') renderDashboardTimeline();
        if (typeof updateDashboardStats === 'function') updateDashboardStats();
        if (typeof showToast === 'function') showToast(`Deleted ${med.name}`, 'info');
      }
    });
  });
}

/**
 * Escapes HTML strings to prevent cross-site scripting (XSS).
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
 * Populates realistic demo medicines so the user can test the app instantly.
 */
function loadDemoMedicines() {
  const demoData = [
    {
      id: 'demo_1',
      name: 'Metformin',
      dose: '500mg',
      type: 'tablet',
      times: ['08:30', '20:30'],
      days: [0, 1, 2, 3, 4, 5, 6],
      foodTiming: 'after',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      notes: 'Take with or immediately after meals to reduce stomach discomfort.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo_2',
      name: 'Amlodipine (Blood Pressure)',
      dose: '5mg',
      type: 'tablet',
      times: ['09:00'],
      days: [0, 1, 2, 3, 4, 5, 6],
      foodTiming: 'any',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      notes: 'Drink with a full glass of water. Try taking at the same time each morning.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo_3',
      name: 'Vitamin D3 & Calcium',
      dose: '1000 IU',
      type: 'capsule',
      times: ['13:00'],
      days: [1, 3, 5], // Mon, Wed, Fri
      foodTiming: 'with',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      notes: 'Take with a healthy meal containing good fats for optimal absorption.',
      createdAt: new Date().toISOString()
    }
  ];

  saveMedicines(demoData);
  renderMedicinesList();
  if (typeof renderDashboardTimeline === 'function') renderDashboardTimeline();
  if (typeof updateDashboardStats === 'function') updateDashboardStats();
  if (typeof showToast === 'function') showToast('Demo prescriptions loaded successfully! ✨', 'success');
}

// Expose medicines module globally for other scripts
var CarePulseMeds = window.CarePulseMeds = {
  getMedicines,
  saveMedicines,
  getMedicineById,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  renderMedicinesList,
  loadDemoMedicines,
  formatTime12h,
  getFoodTimingLabel,
  getMedicineTypeMeta,
  updateMedsCountBadge
};
