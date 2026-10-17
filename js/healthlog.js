/**
 * ============================================================================
 * CarePulse — Health Log Module (js/healthlog.js)
 * Manages logging and visualizing vital signs: Blood Pressure, Blood Sugar,
 * Weight, and Mood, with trend line charts using Chart.js.
 * ============================================================================
 */

const STORAGE_KEY_HEALTHLOG = 'carepulse_health_logs';

// Active chart instance & selected metric tab ('bp', 'sugar', 'weight')
let vitalsChartInstance = null;
let currentVitalMetric = 'bp';
let selectedMoodValue = 5;
let selectedMoodName = 'Great';

/**
 * Loads all saved health logs from browser localStorage.
 */
function getHealthLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HEALTHLOG);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load health logs:', e);
    return [];
  }
}

/**
 * Saves health logs to localStorage.
 */
function saveHealthLogs(logs) {
  try {
    localStorage.setItem(STORAGE_KEY_HEALTHLOG, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save health logs:', e);
  }
}

/**
 * Adds a new vitals reading to the log with date and timestamps.
 */
function addHealthLog(reading) {
  const allLogs = getHealthLogs();
  const now = new Date();

  const newLog = {
    id: 'vital_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    timestamp: now.toISOString(),
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    bpSystolic: reading.bpSystolic ? Number(reading.bpSystolic) : null,
    bpDiastolic: reading.bpDiastolic ? Number(reading.bpDiastolic) : null,
    bloodSugar: reading.bloodSugar ? Number(reading.bloodSugar) : null,
    sugarContext: reading.sugarContext || 'fasting',
    weight: reading.weight ? Number(reading.weight) : null,
    moodScore: reading.moodScore || 5,
    moodName: reading.moodName || 'Great',
    notes: reading.notes ? reading.notes.trim() : ''
  };

  allLogs.unshift(newLog); // latest first
  saveHealthLogs(allLogs);
  return newLog;
}

/**
 * Deletes a health log reading by its unique ID.
 */
function deleteHealthLog(id) {
  const allLogs = getHealthLogs();
  const filtered = allLogs.filter(l => l.id !== id);
  saveHealthLogs(filtered);
  renderHealthHistoryTable();
  renderVitalsTrendChart(currentVitalMetric);
}

/**
 * Initializes the health log form, mood selector, and metric tab listeners.
 */
function initHealthLog() {
  const form = document.getElementById('healthLogForm');
  const moodButtons = document.querySelectorAll('.mood-btn');
  const bpTab = document.getElementById('chartBpTab');
  const sugarTab = document.getElementById('chartSugarTab');
  const weightTab = document.getElementById('chartWeightTab');

  // Mood picker click handlers
  moodButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      moodButtons.forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      selectedMoodValue = Number(target.getAttribute('data-mood'));
      selectedMoodName = target.getAttribute('data-mood-name');
    });
  });

  // Chart Metric Tabs
  if (bpTab) {
    bpTab.addEventListener('click', () => {
      currentVitalMetric = 'bp';
      updateActiveMetricTab(bpTab);
      renderVitalsTrendChart('bp');
    });
  }

  if (sugarTab) {
    sugarTab.addEventListener('click', () => {
      currentVitalMetric = 'sugar';
      updateActiveMetricTab(sugarTab);
      renderVitalsTrendChart('sugar');
    });
  }

  if (weightTab) {
    weightTab.addEventListener('click', () => {
      currentVitalMetric = 'weight';
      updateActiveMetricTab(weightTab);
      renderVitalsTrendChart('weight');
    });
  }

  // Form submission handler
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const bpSystolic = document.getElementById('bpSystolic').value;
      const bpDiastolic = document.getElementById('bpDiastolic').value;
      const bloodSugar = document.getElementById('bloodSugar').value;
      const sugarContext = document.getElementById('sugarContext').value;
      const weight = document.getElementById('weightKg').value;
      const notes = document.getElementById('vitalNotes').value;

      if (!bpSystolic && !bpDiastolic && !bloodSugar && !weight) {
        showToast('Please enter at least one health reading (BP, Sugar, or Weight).', 'warning');
        return;
      }

      addHealthLog({
        bpSystolic,
        bpDiastolic,
        bloodSugar,
        sugarContext,
        weight,
        moodScore: selectedMoodValue,
        moodName: selectedMoodName,
        notes
      });

      // Clear input fields
      form.reset();
      // Reset mood selection to default
      moodButtons.forEach((b, i) => b.classList.toggle('active', i === 0));
      selectedMoodValue = 5;
      selectedMoodName = 'Great';

      showToast('Health reading recorded successfully! 🩺', 'success');
      renderHealthHistoryTable();
      renderVitalsTrendChart(currentVitalMetric);
    });
  }

  // Initial renders
  renderHealthHistoryTable();
  renderVitalsTrendChart(currentVitalMetric);
}

/**
 * Highlights the active metric tab button.
 */
function updateActiveMetricTab(activeBtn) {
  [document.getElementById('chartBpTab'), document.getElementById('chartSugarTab'), document.getElementById('chartWeightTab')].forEach(btn => {
    if (btn) btn.classList.remove('active', 'btn-primary');
  });
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

/**
 * Renders the table of past recorded vitals entries.
 */
function renderHealthHistoryTable() {
  const tbody = document.getElementById('vitalsHistoryTableBody');
  if (!tbody) return;

  const logs = getHealthLogs();

  if (logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 30px; color: var(--text-muted);">
          No health vitals logged yet. Use the form above to record your first reading.
        </td>
      </tr>
    `;
    return;
  }

  const moodEmojis = { 5: '😄', 4: '🙂', 3: '😐', 2: '🙁', 1: '😫' };

  tbody.innerHTML = logs.map(l => {
    const bpStr = (l.bpSystolic && l.bpDiastolic) ? `<strong>${l.bpSystolic} / ${l.bpDiastolic}</strong> mmHg` : '—';
    const sugarStr = l.bloodSugar ? `<strong>${l.bloodSugar}</strong> mg/dL <span class="badge badge-teal" style="font-size: 0.72rem;">${l.sugarContext}</span>` : '—';
    const weightStr = l.weight ? `<strong>${l.weight}</strong> kg` : '—';
    const moodStr = `${moodEmojis[l.moodScore] || '🙂'} ${l.moodName || ''}`;

    return `
      <tr>
        <td>
          <div style="font-weight: 600;">${l.date}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">${l.time}</div>
        </td>
        <td>${bpStr}</td>
        <td>${sugarStr}</td>
        <td>${weightStr}</td>
        <td>${moodStr}</td>
        <td style="font-size: 0.82rem; color: var(--text-muted); max-width: 200px;">${escapeHtml(l.notes) || '—'}</td>
        <td>
          <button class="btn btn-icon btn-sm delete-vital-btn" data-id="${l.id}" title="Delete Reading" style="color: var(--coral-pulse);" aria-label="Delete entry">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();

  tbody.querySelectorAll('.delete-vital-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (confirm('Delete this health log entry?')) {
        deleteHealthLog(id);
        showToast('Health reading removed.', 'info');
      }
    });
  });
}

/**
 * Builds or refreshes the Chart.js line trend chart for the selected metric.
 */
function renderVitalsTrendChart(metric = 'bp') {
  const canvas = document.getElementById('vitalsTrendChart');
  if (!canvas || !window.Chart) return;

  const logs = [...getHealthLogs()].reverse(); // oldest to newest for chronological line chart
  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  if (vitalsChartInstance) {
    vitalsChartInstance.destroy();
  }

  // If no readings exist
  if (logs.length === 0) {
    vitalsChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: ['No Data'],
        datasets: [{ label: 'Log vitals to see trends', data: [0] }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
    return;
  }

  const labels = logs.map(l => l.date ? l.date.slice(5) : ''); // 'MM-DD'

  let datasets = [];

  if (metric === 'bp') {
    datasets = [
      {
        label: 'Systolic (mmHg)',
        data: logs.map(l => l.bpSystolic),
        borderColor: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        tension: 0.35,
        fill: true,
        pointRadius: 4
      },
      {
        label: 'Diastolic (mmHg)',
        data: logs.map(l => l.bpDiastolic),
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        tension: 0.35,
        fill: true,
        pointRadius: 4
      }
    ];
  } else if (metric === 'sugar') {
    datasets = [
      {
        label: 'Blood Sugar (mg/dL)',
        data: logs.map(l => l.bloodSugar),
        borderColor: '#14B8A6',
        backgroundColor: 'rgba(20, 184, 166, 0.15)',
        tension: 0.35,
        fill: true,
        pointRadius: 4
      }
    ];
  } else if (metric === 'weight') {
    datasets = [
      {
        label: 'Weight (kg)',
        data: logs.map(l => l.weight),
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        tension: 0.35,
        fill: true,
        pointRadius: 4
      }
    ];
  }

  vitalsChartInstance = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          ticks: { color: textColor },
          grid: { color: gridColor }
        },
        x: {
          ticks: { color: textColor },
          grid: { display: false }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: textColor, font: { family: 'Inter', size: 12 } }
        }
      }
    }
  });
}

/**
 * Loads realistic demo vitals data for immediate review and testing.
 */
function loadDemoHealthLogs() {
  const demoLogs = [];
  const today = new Date();

  // 6 entries over the past 12 days
  const sampleVitals = [
    { daysAgo: 10, bpSys: 126, bpDia: 82, sugar: 108, weight: 70.2, mood: 4, moodName: 'Good', notes: 'Felt light and refreshed' },
    { daysAgo: 8, bpSys: 122, bpDia: 80, sugar: 102, weight: 69.8, mood: 5, moodName: 'Great', notes: 'Morning walk completed' },
    { daysAgo: 6, bpSys: 128, bpDia: 84, sugar: 114, weight: 70.0, mood: 3, moodName: 'Okay', notes: 'Slight headache after lunch' },
    { daysAgo: 4, bpSys: 120, bpDia: 78, sugar: 98, weight: 69.5, mood: 5, moodName: 'Great', notes: 'Blood sugar within optimal fasting range' },
    { daysAgo: 2, bpSys: 124, bpDia: 82, sugar: 105, weight: 69.4, mood: 4, moodName: 'Good', notes: 'Good restful sleep' },
    { daysAgo: 0, bpSys: 118, bpDia: 78, sugar: 99, weight: 69.1, mood: 5, moodName: 'Great', notes: 'Target vitals achieved' }
  ];

  sampleVitals.forEach((s, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - s.daysAgo);
    const dateStr = d.toISOString().split('T')[0];

    demoLogs.push({
      id: `demo_vital_${idx}`,
      timestamp: `${dateStr}T08:15:00.000Z`,
      date: dateStr,
      time: '08:15 AM',
      bpSystolic: s.bpSys,
      bpDiastolic: s.bpDia,
      bloodSugar: s.sugar,
      sugarContext: 'fasting',
      weight: s.weight,
      moodScore: s.mood,
      moodName: s.moodName,
      notes: s.notes
    });
  });

  saveHealthLogs(demoLogs);
  renderHealthHistoryTable();
  renderVitalsTrendChart(currentVitalMetric);
}

var CarePulseHealthLog = window.CarePulseHealthLog = {
  getHealthLogs,
  saveHealthLogs,
  addHealthLog,
  deleteHealthLog,
  initHealthLog,
  renderHealthHistoryTable,
  renderVitalsTrendChart,
  loadDemoHealthLogs
};
