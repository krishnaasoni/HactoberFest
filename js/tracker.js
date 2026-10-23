/**
 * ============================================================================
 * CarePulse — Tracker & History Module (js/tracker.js)
 * Tracks daily medicine intake logs (taken/skipped/missed), calculates streaks,
 * updates animated progress rings, timeline schedules, and renders Chart.js charts.
 * ============================================================================
 */

const STORAGE_KEY_LOGS = 'carepulse_intake_logs';

// Chart references to prevent canvas re-use errors in Chart.js
let weeklyBarChartInstance = null;
let doseDoughnutChartInstance = null;
let selectedHistoryDate = new Date().toISOString().split('T')[0];

/**
 * Loads all historic medicine intake logs from localStorage.
 */
function getIntakeLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load intake logs:', e);
    return [];
  }
}

/**
 * Saves medicine intake logs to localStorage.
 */
function saveIntakeLogs(logs) {
  try {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save intake logs:', e);
  }
}

/**
 * Returns logs recorded for a specific calendar date (YYYY-MM-DD).
 */
function getLogsForDate(dateStr) {
  const all = getIntakeLogs();
  return all.filter(l => l.date === dateStr);
}

/**
 * Convenience helper to get today's intake logs.
 */
function getTodayLogs() {
  const todayStr = new Date().toISOString().split('T')[0];
  return getLogsForDate(todayStr);
}

/**
 * Records or updates the status ('taken', 'skipped') for a medicine at a scheduled time.
 * If marked taken, it triggers confetti celebration and updates all dashboard widgets.
 */
function markMedicineStatus(medicineId, scheduledTime, status) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const allLogs = getIntakeLogs();

  // Check if an existing log exists for this med + time + date
  const index = allLogs.findIndex(l => l.medicineId === medicineId && l.time === scheduledTime && l.date === dateStr);

  const logEntry = {
    id: index !== -1 ? allLogs[index].id : 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    medicineId,
    time: scheduledTime,
    date: dateStr,
    status, // 'taken' or 'skipped'
    timestamp: now.toISOString()
  };

  if (index !== -1) {
    allLogs[index] = logEntry;
  } else {
    allLogs.push(logEntry);
  }

  saveIntakeLogs(allLogs);

  // Remove any active snooze for this dose
  if (window.CarePulseReminders) {
    CarePulseReminders.closeAlarmModal();
  }

  // If taken, trigger joyful confetti animation
  if (status === 'taken') {
    triggerConfetti();
    const med = CarePulseMeds.getMedicineById(medicineId);
    const medName = med ? med.name : 'Medicine';
    showToast(`Great job! ${medName} marked as taken. 🎉`, 'success');
  } else if (status === 'skipped') {
    showToast('Dose recorded as skipped.', 'info');
  } else if (status === 'missed') {
    showToast('Dose recorded as missed.', 'warning');
  }

  // Refresh UI
  updateDashboardProgress();
  renderDashboardTimeline();
  updateDashboardStats();
  if (window.CarePulseReminders) {
    CarePulseReminders.updateNextMedicineCard();
  }
  renderHistoryView();
}

/**
 * Calculates current consecutive streak of days where all scheduled medicines were taken.
 */
function calculateStreak() {
  const meds = CarePulseMeds.getMedicines();
  if (!meds || meds.length === 0) return 0;

  const logs = getIntakeLogs();
  let streak = 0;
  const today = new Date();

  // Check backwards up to 365 days
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayOfWeek = checkDate.getDay();

    // Find all scheduled doses for this historical day
    let scheduledCount = 0;
    meds.forEach(m => {
      // Check start/end date
      if (m.startDate && dateStr < m.startDate) return;
      if (m.endDate && dateStr > m.endDate) return;
      if (m.days && m.days.includes(dayOfWeek)) {
        scheduledCount += m.times.length;
      }
    });

    // If no meds were scheduled on that day, continue streak unbroken
    if (scheduledCount === 0) {
      continue;
    }

    const daysLogs = logs.filter(l => l.date === dateStr);
    const takenCount = daysLogs.filter(l => l.status === 'taken').length;

    // For today, if some are still pending, don't break the streak yet if at least one taken
    if (i === 0) {
      if (takenCount === scheduledCount) {
        streak++;
      } else if (takenCount > 0) {
        // partial today, keep prior streak
        streak = 1;
      }
    } else {
      if (takenCount >= scheduledCount && scheduledCount > 0) {
        streak++;
      } else {
        // Streak broken
        break;
      }
    }
  }

  return streak;
}

/**
 * Updates the SVG circular progress ring and percentage badges on the Dashboard.
 */
function updateDashboardProgress() {
  const meds = CarePulseMeds.getMedicines();
  const circle = document.getElementById('progressCircle');
  const percentText = document.getElementById('progressPercentText');
  const fractionText = document.getElementById('progressFractionText');
  const heroSubtitle = document.getElementById('progressHeroSubtitle');
  const heroTitle = document.getElementById('progressHeroTitle');

  const now = new Date();
  const currentDayOfWeek = now.getDay();
  const todayDateStr = now.toISOString().split('T')[0];

  // Count today's total scheduled doses
  let totalScheduled = 0;
  meds.forEach(m => {
    if (m.startDate && todayDateStr < m.startDate) return;
    if (m.endDate && todayDateStr > m.endDate) return;
    if (m.days && m.days.includes(currentDayOfWeek)) {
      totalScheduled += m.times.length;
    }
  });

  const todayLogs = getTodayLogs();
  const takenCount = todayLogs.filter(l => l.status === 'taken').length;

  const percentage = totalScheduled > 0 ? Math.round((takenCount / totalScheduled) * 100) : 0;

  // SVG radius 60 circumference: 2 * PI * 60 = 376.99 (~377)
  const circumference = 377;
  if (circle) {
    const offset = circumference - (circumference * percentage) / 100;
    circle.style.strokeDashoffset = offset;
  }

  if (percentText) percentText.textContent = `${percentage}%`;
  if (fractionText) fractionText.textContent = `${takenCount}/${totalScheduled} Meds`;

  if (heroSubtitle) {
    heroSubtitle.textContent = totalScheduled === 0
      ? 'No scheduled medicines for today. Add one to start tracking!'
      : `You have taken ${takenCount} of ${totalScheduled} scheduled doses today.`;
  }

  if (heroTitle) {
    if (percentage === 100 && totalScheduled > 0) {
      heroTitle.textContent = 'All done for today! Outstanding! 🌟';
    } else if (percentage >= 50) {
      heroTitle.textContent = 'Great momentum, keep going! 💪';
    } else {
      heroTitle.textContent = 'Take charge of your health today';
    }
  }
}

/**
 * Renders today's schedule timeline on the Dashboard home view.
 */
function renderDashboardTimeline() {
  const container = document.getElementById('todayTimelineList');
  const badge = document.getElementById('timelineDoseCountBadge');
  if (!container) return;

  const meds = CarePulseMeds.getMedicines();
  const now = new Date();
  const currentDayOfWeek = now.getDay();
  const todayDateStr = now.toISOString().split('T')[0];
  const todayLogs = getTodayLogs();

  // Build a list of all doses scheduled for today
  let doses = [];
  meds.forEach(med => {
    if (med.startDate && todayDateStr < med.startDate) return;
    if (med.endDate && todayDateStr > med.endDate) return;
    if (med.days && med.days.includes(currentDayOfWeek)) {
      med.times.forEach(t => {
        const log = todayLogs.find(l => l.medicineId === med.id && l.time === t);
        doses.push({
          med,
          time: t,
          status: log ? log.status : 'pending',
          loggedAt: log ? log.timestamp : null
        });
      });
    }
  });

  // Sort doses chronologically
  doses.sort((a, b) => a.time.localeCompare(b.time));

  if (badge) badge.textContent = `${doses.length} Doses Today`;

  if (doses.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 32px 16px; color: var(--text-muted);">
        <i data-lucide="check-circle" style="width: 36px; height: 36px; margin-bottom: 8px; color: var(--teal-primary);"></i>
        <p>No medicines scheduled for today. Enjoy your day!</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = doses.map(item => {
    const isTaken = item.status === 'taken';
    const isSkipped = item.status === 'skipped';
    const isMissed = item.status === 'missed';
    const typeMeta = CarePulseMeds.getMedicineTypeMeta(item.med.type);
    const [h, m] = item.time.split(':');
    const ampm = parseInt(h, 10) >= 12 ? 'PM' : 'AM';

    return `
      <div class="timeline-item ${isTaken ? 'taken' : ''} ${isSkipped ? 'skipped' : ''} ${isMissed ? 'missed' : ''}">
        <div class="timeline-time">
          <span class="timeline-hour">${CarePulseMeds.formatTime12h(item.time).replace(` ${ampm}`, '')}</span>
          <span class="timeline-period">${ampm}</span>
        </div>

        <div class="timeline-info">
          <div class="timeline-title-row">
            <span class="timeline-name">${escapeHtml(item.med.name)}</span>
            <span class="timeline-dose">${escapeHtml(item.med.dose)} (${typeMeta.label})</span>
          </div>
          <div class="timeline-tags">
            <span class="badge badge-teal">${CarePulseMeds.getFoodTimingLabel(item.med.foodTiming)}</span>
            ${isTaken ? `<span class="badge badge-emerald"><i data-lucide="check"></i> Taken</span>` : ''}
            ${isSkipped ? `<span class="badge badge-amber"><i data-lucide="x"></i> Skipped</span>` : ''}
            ${isMissed ? `<span class="badge badge-coral"><i data-lucide="alert-circle"></i> Missed</span>` : ''}
          </div>
        </div>

        <div class="timeline-actions">
          ${isTaken ? `
            <button class="btn btn-sm btn-secondary unmark-dose-btn" data-id="${item.med.id}" data-time="${item.time}" title="Undo action">
              <i data-lucide="rotate-ccw"></i> Undo
            </button>
          ` : `
            <button class="btn btn-sm btn-success take-dose-btn" data-id="${item.med.id}" data-time="${item.time}">
              <i data-lucide="check"></i> Taken
            </button>
            <button class="btn btn-sm btn-secondary skip-dose-btn" data-id="${item.med.id}" data-time="${item.time}">
              <i data-lucide="x"></i> Skip
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();

  // Attach button event listeners
  container.querySelectorAll('.take-dose-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const time = e.currentTarget.getAttribute('data-time');
      markMedicineStatus(id, time, 'taken');
    });
  });

  container.querySelectorAll('.skip-dose-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const time = e.currentTarget.getAttribute('data-time');
      markMedicineStatus(id, time, 'skipped');
    });
  });

  container.querySelectorAll('.unmark-dose-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const time = e.currentTarget.getAttribute('data-time');
      undoDoseStatus(id, time);
    });
  });
}

/**
 * Resets a dose back to pending.
 */
function undoDoseStatus(medicineId, time) {
  const dateStr = new Date().toISOString().split('T')[0];
  const allLogs = getIntakeLogs();
  const filtered = allLogs.filter(l => !(l.medicineId === medicineId && l.time === time && l.date === dateStr));
  saveIntakeLogs(filtered);
  showToast('Dose reset to pending.', 'info');
  updateDashboardProgress();
  renderDashboardTimeline();
  updateDashboardStats();
  renderHistoryView();
  if (window.CarePulseReminders) CarePulseReminders.updateNextMedicineCard();
}

/**
 * Computes weekly adherence percentage and updates header stats.
 */
function updateDashboardStats() {
  const streak = calculateStreak();
  const streakEl = document.getElementById('statStreakDays');
  const streakBadge = document.getElementById('streakBadgeText');
  const adherenceEl = document.getElementById('statAdherenceRate');
  const takenTodayEl = document.getElementById('statTakenToday');

  if (streakEl) streakEl.textContent = streak;
  if (streakBadge) streakBadge.textContent = `${streak} Day Streak 🔥`;

  // Calculate past 7 days adherence %
  const meds = CarePulseMeds.getMedicines();
  const logs = getIntakeLogs();
  let totalWeekScheduled = 0;
  let totalWeekTaken = 0;

  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dow = d.getDay();

    meds.forEach(m => {
      if (m.startDate && dateStr < m.startDate) return;
      if (m.endDate && dateStr > m.endDate) return;
      if (m.days && m.days.includes(dow)) {
        totalWeekScheduled += m.times.length;
      }
    });

    const dLogs = logs.filter(l => l.date === dateStr);
    totalWeekTaken += dLogs.filter(l => l.status === 'taken').length;
  }

  const weeklyRate = totalWeekScheduled > 0 ? Math.round((totalWeekTaken / totalWeekScheduled) * 100) : 100;
  if (adherenceEl) adherenceEl.textContent = `${weeklyRate}%`;

  const todayLogs = getTodayLogs();
  const takenToday = todayLogs.filter(l => l.status === 'taken').length;
  if (takenTodayEl) takenTodayEl.textContent = takenToday;
}

/**
 * Renders the Tracker & History view: past 14 days strip, selected day details,
 * and initializes or updates the two Chart.js visual charts.
 */
function renderHistoryView() {
  renderHistoryDaysStrip();
  renderSelectedDayLogs();
  renderWeeklyChart();
  renderBreakdownChart();
}

/**
 * Renders the interactive 14-day history pill selector.
 */
function renderHistoryDaysStrip() {
  const container = document.getElementById('historyDaysStrip');
  if (!container) return;

  const meds = CarePulseMeds.getMedicines();
  const logs = getIntakeLogs();
  const today = new Date();
  const pills = [];

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();

    // Determine status dot
    const dow = d.getDay();
    let scheduled = 0;
    meds.forEach(m => {
      if (m.startDate && dateStr < m.startDate) return;
      if (m.endDate && dateStr > m.endDate) return;
      if (m.days && m.days.includes(dow)) scheduled += m.times.length;
    });

    const dayLogs = logs.filter(l => l.date === dateStr);
    const taken = dayLogs.filter(l => l.status === 'taken').length;

    let dotClass = 'none';
    if (scheduled > 0) {
      if (taken >= scheduled) dotClass = 'all-taken';
      else if (taken > 0) dotClass = 'partial';
      else dotClass = 'missed';
    }

    const isSelected = dateStr === selectedHistoryDate;

    pills.push(`
      <div class="day-pill-card ${isSelected ? 'selected' : ''}" data-date="${dateStr}">
        <span class="day-pill-name">${dayName}</span>
        <span class="day-pill-num">${dayNum}</span>
        <span class="day-status-dot ${dotClass}" title="${dotClass.replace('-', ' ')}"></span>
      </div>
    `);
  }

  container.innerHTML = pills.join('');

  container.querySelectorAll('.day-pill-card').forEach(card => {
    card.addEventListener('click', (e) => {
      selectedHistoryDate = e.currentTarget.getAttribute('data-date');
      renderHistoryDaysStrip();
      renderSelectedDayLogs();
    });
  });
}

/**
 * Lists the medicine logs for the chosen day in the history strip.
 */
function renderSelectedDayLogs() {
  const container = document.getElementById('selectedDayLogsList');
  const titleEl = document.getElementById('selectedDayLogsTitle');
  if (!container) return;

  const selectedDateObj = new Date(selectedHistoryDate + 'T00:00:00');
  const formattedTitle = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  if (titleEl) titleEl.textContent = `Logs for ${formattedTitle}`;

  const meds = CarePulseMeds.getMedicines();
  const dayOfWeek = selectedDateObj.getDay();
  const dayLogs = getLogsForDate(selectedHistoryDate);

  let items = [];
  meds.forEach(med => {
    if (med.startDate && selectedHistoryDate < med.startDate) return;
    if (med.endDate && selectedHistoryDate > med.endDate) return;
    if (med.days && med.days.includes(dayOfWeek)) {
      med.times.forEach(t => {
        const log = dayLogs.find(l => l.medicineId === med.id && l.time === t);
        items.push({
          med,
          time: t,
          status: log ? log.status : 'missed',
          loggedAt: log ? log.timestamp : null
        });
      });
    }
  });

  items.sort((a, b) => a.time.localeCompare(b.time));

  if (items.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 24px; color: var(--text-muted);">
        No medicines were scheduled on this date.
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => {
    const isTaken = item.status === 'taken';
    const isSkipped = item.status === 'skipped';
    const isMissed = item.status === 'missed';

    return `
      <div class="timeline-item ${isTaken ? 'taken' : ''} ${isSkipped ? 'skipped' : ''}">
        <div class="timeline-time">
          <span class="timeline-hour">${CarePulseMeds.formatTime12h(item.time)}</span>
        </div>
        <div class="timeline-info">
          <div class="timeline-title-row">
            <span class="timeline-name">${escapeHtml(item.med.name)}</span>
            <span class="timeline-dose">${escapeHtml(item.med.dose)}</span>
          </div>
          <div class="timeline-tags">
            ${isTaken ? `<span class="badge badge-emerald">✓ Taken</span>` : ''}
            ${isSkipped ? `<span class="badge badge-amber">Skipped</span>` : ''}
            ${isMissed ? `<span class="badge badge-coral">Missed</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Builds or refreshes the Chart.js Weekly Adherence Bar Chart.
 */
function renderWeeklyChart() {
  const canvas = document.getElementById('weeklyAdherenceChart');
  if (!canvas || !window.Chart) return;

  const meds = CarePulseMeds.getMedicines();
  const logs = getIntakeLogs();
  const today = new Date();

  const labels = [];
  const adherenceData = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dow = d.getDay();
    labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));

    let scheduled = 0;
    meds.forEach(m => {
      if (m.startDate && dateStr < m.startDate) return;
      if (m.endDate && dateStr > m.endDate) return;
      if (m.days && m.days.includes(dow)) scheduled += m.times.length;
    });

    const dayLogs = logs.filter(l => l.date === dateStr);
    const taken = dayLogs.filter(l => l.status === 'taken').length;
    const rate = scheduled > 0 ? Math.round((taken / scheduled) * 100) : 100;
    adherenceData.push(rate);
  }

  if (weeklyBarChartInstance) {
    weeklyBarChartInstance.destroy();
  }

  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  weeklyBarChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Adherence %',
        data: adherenceData,
        backgroundColor: adherenceData.map(v => v >= 80 ? '#14B8A6' : (v >= 50 ? '#F59E0B' : '#FF6B6B')),
        borderRadius: 8,
        hoverBackgroundColor: adherenceData.map(v => v >= 80 ? '#2DD4BF' : (v >= 50 ? '#FBBF24' : '#F87171'))
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: { color: textColor, callback: v => `${v}%` },
          grid: { color: gridColor }
        },
        x: {
          ticks: { color: textColor },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => `Adherence: ${context.raw}%`
          }
        }
      }
    }
  });
}

/**
 * Builds or refreshes the Chart.js Adherence Breakdown Doughnut Chart.
 */
function renderBreakdownChart() {
  const canvas = document.getElementById('doseBreakdownChart');
  if (!canvas || !window.Chart) return;

  const logs = getIntakeLogs();
  const taken = logs.filter(l => l.status === 'taken').length;
  const skipped = logs.filter(l => l.status === 'skipped').length;
  const missed = logs.filter(l => l.status === 'missed').length;

  const dataValues = (taken === 0 && skipped === 0 && missed === 0) ? [1, 0, 0] : [taken, skipped, missed];

  if (doseDoughnutChartInstance) {
    doseDoughnutChartInstance.destroy();
  }

  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#F1F5F9' : '#0F172A';

  doseDoughnutChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Taken', 'Skipped', 'Missed'],
      datasets: [{
        data: dataValues,
        backgroundColor: ['#10B981', '#F59E0B', '#FF6B6B'],
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor, font: { family: 'Inter', size: 12 } }
        }
      },
      cutout: '72%'
    }
  });
}

/**
 * Pure canvas healthcare celebration explosion triggered when marking a dose as Taken.
 * Renders custom healthcare particles: glowing hearts, capsules, medical crosses, checkmarks, and sparkles.
 * Pure native JavaScript — zero external libraries required.
 */
function triggerConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#14B8A6', '#2DD4BF', '#2563EB', '#FF6B6B', '#F59E0B', '#10B981', '#38BDF8'];
  const particleTypes = ['heart', 'capsule', 'cross', 'checkmark', 'sparkle'];
  const particles = [];

  const count = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 20 : 90;

  for (let i = 0; i < count; i++) {
    const type = particleTypes[Math.floor(Math.random() * particleTypes.length)];
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 240,
      y: canvas.height * 0.42,
      type: type,
      size: Math.random() * 8 + 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      secondaryColor: '#FFFFFF',
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -14 - 5,
      rot: Math.random() * 360,
      vrot: (Math.random() - 0.5) * 12,
      opacity: 1,
      scale: Math.random() * 0.5 + 0.8
    });
  }

  let animationId;
  const gravity = 0.35;

  function drawHeart(c, size) {
    const s = size * 0.55;
    c.beginPath();
    c.moveTo(0, s * 0.3);
    c.bezierCurveTo(-s, -s * 0.6, -s * 1.5, s * 0.4, 0, s * 1.4);
    c.bezierCurveTo(s * 1.5, s * 0.4, s, -s * 0.6, 0, s * 0.3);
    c.fill();
  }

  function drawCapsule(c, size, col1, col2) {
    const w = size * 1.2;
    const h = size * 0.6;
    const r = h / 2;
    // Left half
    c.fillStyle = col1;
    c.beginPath();
    c.arc(-w * 0.25, 0, r, Math.PI * 0.5, Math.PI * 1.5);
    c.lineTo(0, -r);
    c.lineTo(0, r);
    c.closePath();
    c.fill();
    // Right half
    c.fillStyle = col2;
    c.beginPath();
    c.arc(w * 0.25, 0, r, -Math.PI * 0.5, Math.PI * 0.5);
    c.lineTo(0, r);
    c.lineTo(0, -r);
    c.closePath();
    c.fill();
  }

  function drawCross(c, size) {
    const t = size * 0.35;
    const l = size;
    c.beginPath();
    c.fillRect(-t / 2, -l / 2, t, l);
    c.fillRect(-l / 2, -t / 2, l, t);
  }

  function drawCheckmark(c, size) {
    c.beginPath();
    c.lineWidth = size * 0.28;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.moveTo(-size * 0.4, 0);
    c.lineTo(-size * 0.1, size * 0.35);
    c.lineTo(size * 0.45, -size * 0.35);
    c.stroke();
  }

  function drawSparkle(c, size) {
    const s = size * 0.9;
    c.beginPath();
    c.moveTo(0, -s);
    c.quadraticCurveTo(0, 0, s, 0);
    c.quadraticCurveTo(0, 0, 0, s);
    c.quadraticCurveTo(0, 0, -s, 0);
    c.quadraticCurveTo(0, 0, 0, -s);
    c.fill();
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += gravity;
      p.rot += p.vrot;
      p.opacity -= 0.012;

      if (p.opacity > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.scale(p.scale, p.scale);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;

        if (p.type === 'heart') {
          drawHeart(ctx, p.size);
        } else if (p.type === 'capsule') {
          drawCapsule(ctx, p.size, p.color, p.secondaryColor);
        } else if (p.type === 'cross') {
          drawCross(ctx, p.size);
        } else if (p.type === 'checkmark') {
          drawCheckmark(ctx, p.size);
        } else {
          drawSparkle(ctx, p.size);
        }

        ctx.restore();
      }
    });

    if (alive) {
      animationId = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationId);
    }
  }

  render();
}

/**
 * Loads sample historical logs for demonstration purposes.
 */
function loadDemoLogs() {
  const demoLogs = [];
  const today = new Date();

  // Populate 7 days of realistic logs
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    demoLogs.push({
      id: `log_demo_${i}_1`,
      medicineId: 'demo_1',
      time: '08:30',
      date: dateStr,
      status: 'taken',
      timestamp: `${dateStr}T08:35:00.000Z`
    });

    if (i < 4) {
      demoLogs.push({
        id: `log_demo_${i}_2`,
        medicineId: 'demo_1',
        time: '20:30',
        date: dateStr,
        status: 'taken',
        timestamp: `${dateStr}T20:32:00.000Z`
      });
    }

    demoLogs.push({
      id: `log_demo_${i}_3`,
      medicineId: 'demo_2',
      time: '09:00',
      date: dateStr,
      status: i === 2 ? 'skipped' : 'taken',
      timestamp: `${dateStr}T09:05:00.000Z`
    });
  }

  saveIntakeLogs(demoLogs);
  updateDashboardProgress();
  renderDashboardTimeline();
  updateDashboardStats();
  renderHistoryView();
}

var CarePulseTracker = window.CarePulseTracker = {
  getIntakeLogs,
  saveIntakeLogs,
  getLogsForDate,
  getTodayLogs,
  markMedicineStatus,
  calculateStreak,
  updateDashboardProgress,
  renderDashboardTimeline,
  updateDashboardStats,
  renderHistoryView,
  triggerConfetti,
  loadDemoLogs
};
