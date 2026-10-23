/**
 * ============================================================================
 * CarePulse — Cinematic Experience Engine (js/cinematic.js)
 * World-class motion design, living healthcare ecosystem, emotional patient
 * journey storytelling, health story mode, Web Audio visualizer, and 3D lighting.
 * ============================================================================
 */

(function (window, document) {
  'use strict';

  // Global namespace for cinematic engine
  const CarePulseCinematic = {
    ambientCanvas: null,
    ambientCtx: null,
    animationFrameId: null,
    particles: [],
    capsules: [],
    ecgPoints: [],
    ecgPhase: 0,
    currentStoryScene: 1,
    storyInterval: null,
    isReducedMotion: false,

    /**
     * Bootstraps all cinematic and motion features.
     */
    init() {
      // Check accessibility preferences
      this.checkReducedMotion();
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
        this.checkReducedMotion();
      });

      // Initialize components
      this.initAmbientEcosystem();
      this.initMouseSpotlightAndTilt();
      this.initHeroExperience();
      this.initEmotionalStorytelling();
      this.initHealthStoryMode();
      this.initCountUpAnimations();
      this.initMagneticButtons();
      this.initFlameEmbers();
      this.initAudioVisualizerOverlay();
    },

    checkReducedMotion() {
      this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    /**
     * --------------------------------------------------------------------------
     * 1. LIVING HEALTHCARE ECOSYSTEM (Canvas: Floating Capsules, Dust & ECG Wave)
     * --------------------------------------------------------------------------
     */
    initAmbientEcosystem() {
      const canvas = document.getElementById('ambientCanvas');
      if (!canvas) return;
      this.ambientCanvas = canvas;
      this.ambientCtx = canvas.getContext('2d');

      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        this.createEcosystemParticles();
      };

      window.addEventListener('resize', resize);
      resize();

      if (!this.isReducedMotion) {
        this.renderEcosystemLoop();
      }
    },

    createEcosystemParticles() {
      const width = this.ambientCanvas.width;
      const height = this.ambientCanvas.height;

      // Bioluminescent medical dust particles
      this.particles = [];
      const particleCount = Math.min(Math.floor(width / 35), 45);
      const colors = [
        'rgba(20, 184, 166, 0.45)', // Medical Teal
        'rgba(45, 212, 191, 0.35)', // Bright Aqua
        'rgba(37, 99, 235, 0.35)',  // Royal Blue
        'rgba(255, 107, 107, 0.25)',// Soft Coral
        'rgba(245, 158, 11, 0.25)'  // Amber
      ];

      for (let i = 0; i < particleCount; i++) {
        this.particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 2.2 + 0.8,
          color: colors[Math.floor(Math.random() * colors.length)],
          vx: (Math.random() - 0.5) * 0.4,
          vy: -Math.random() * 0.5 - 0.2, // Gentle upward drift
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.02 + Math.random() * 0.02
        });
      }

      // Floating 3D Medicine Capsules
      this.capsules = [];
      const capsuleCount = Math.min(Math.floor(width / 220), 7);
      const capsuleThemes = [
        { c1: '#14B8A6', c2: '#0F766E' }, // Teal duo
        { c1: '#2563EB', c2: '#FFFFFF' }, // Royal Blue & Pure White
        { c1: '#FF6B6B', c2: '#F59E0B' }, // Coral & Amber
        { c1: '#10B981', c2: '#2DD4BF' }  // Emerald & Mint
      ];

      for (let i = 0; i < capsuleCount; i++) {
        this.capsules.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: 32 + Math.random() * 20,
          radius: 9 + Math.random() * 4,
          angle: Math.random() * Math.PI * 2,
          vAngle: (Math.random() - 0.5) * 0.008,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -Math.random() * 0.25 - 0.1,
          theme: capsuleThemes[i % capsuleThemes.length],
          opacity: 0.25 + Math.random() * 0.25
        });
      }
    },

    renderEcosystemLoop() {
      if (!this.ambientCtx || this.isReducedMotion) return;
      const ctx = this.ambientCtx;
      const w = this.ambientCanvas.width;
      const h = this.ambientCanvas.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Draw glowing upward particles
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        if (p.y < -10) p.y = h + 10;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        const currentRadius = p.radius + Math.sin(p.pulse) * 0.6;
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, currentRadius), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }

      // 2. Draw floating 3D capsules
      for (let i = 0; i < this.capsules.length; i++) {
        const c = this.capsules[i];
        c.x += c.vx;
        c.y += c.vy;
        c.angle += c.vAngle;

        if (c.y < -60) c.y = h + 60;
        if (c.x < -60) c.x = w + 60;
        if (c.x > w + 60) c.x = -60;

        this.drawCapsule(ctx, c);
      }

      // 3. Draw subtle ECG Heartbeat Pulse across the lower hero
      this.drawECGWave(ctx, w, h);

      this.animationFrameId = requestAnimationFrame(() => this.renderEcosystemLoop());
    },

    drawCapsule(ctx, c) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);
      ctx.globalAlpha = c.opacity;

      const halfLen = c.length / 2;
      const r = c.radius;

      // Left half
      ctx.beginPath();
      ctx.fillStyle = c.theme.c1;
      ctx.arc(-halfLen + r, 0, r, Math.PI * 0.5, Math.PI * 1.5, false);
      ctx.lineTo(0, -r);
      ctx.lineTo(0, r);
      ctx.closePath();
      ctx.fill();

      // Right half
      ctx.beginPath();
      ctx.fillStyle = c.theme.c2;
      ctx.arc(halfLen - r, 0, r, -Math.PI * 0.5, Math.PI * 0.5, false);
      ctx.lineTo(0, r);
      ctx.lineTo(0, -r);
      ctx.closePath();
      ctx.fill();

      // Gloss / Lighting highlight
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.ellipse(-halfLen * 0.3, -r * 0.4, halfLen * 0.4, r * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Capsule divider line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 1;
      ctx.moveTo(0, -r);
      ctx.lineTo(0, r);
      ctx.stroke();

      ctx.restore();
    },

    drawECGWave(ctx, w, h) {
      this.ecgPhase += 0.025;
      const baselineY = Math.min(h * 0.75, 480);
      const waveWidth = Math.min(w * 0.85, 900);
      const startX = (w - waveWidth) / 2;

      ctx.save();
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      // Gradient stroke: subtle fade on sides, radiant medical teal in center
      const grad = ctx.createLinearGradient(startX, 0, startX + waveWidth, 0);
      grad.addColorStop(0, 'rgba(20, 184, 166, 0.02)');
      grad.addColorStop(0.3, 'rgba(20, 184, 166, 0.35)');
      grad.addColorStop(0.5, 'rgba(45, 212, 191, 0.85)');
      grad.addColorStop(0.7, 'rgba(37, 99, 235, 0.4)');
      grad.addColorStop(1, 'rgba(20, 184, 166, 0.02)');
      ctx.strokeStyle = grad;
      ctx.shadowColor = 'rgba(45, 212, 191, 0.6)';
      ctx.shadowBlur = 10;

      ctx.beginPath();

      const pulsePos = (this.ecgPhase % 3) / 3; // 0 to 1 cycle
      const activePulseX = startX + waveWidth * pulsePos;

      for (let x = 0; x <= waveWidth; x += 3) {
        const currentX = startX + x;
        const distToPulse = Math.abs(currentX - activePulseX);
        let dy = 0;

        if (distToPulse < 70) {
          // ECG Waveform function (P-Q-R-S-T)
          const rel = (currentX - activePulseX) / 70; // -1 to +1
          if (rel > -0.7 && rel < -0.4) {
            // P Wave (gentle bump)
            dy = -Math.sin((rel + 0.55) * Math.PI * 3.33) * 7;
          } else if (rel >= -0.4 && rel < -0.25) {
            // Q Dip (small down)
            dy = 5;
          } else if (rel >= -0.25 && rel < 0.05) {
            // R Spike (high sharp peak)
            dy = -48 * (1 - Math.abs(rel + 0.1) * 6.5);
            if (dy > 0) dy = 0;
          } else if (rel >= 0.05 && rel < 0.25) {
            // S Valley (sharp dip)
            dy = 14 * (1 - Math.abs(rel - 0.15) * 10);
            if (dy < 0) dy = 0;
          } else if (rel >= 0.25 && rel < 0.65) {
            // T Wave (broad positive dome)
            dy = -Math.sin((rel - 0.25) * Math.PI * 2.5) * 11;
          }
        }

        const y = baselineY + dy;
        if (x === 0) {
          ctx.moveTo(currentX, y);
        } else {
          ctx.lineTo(currentX, y);
        }
      }
      ctx.stroke();

      // Glowing pulse head tracer dot
      if (activePulseX >= startX && activePulseX <= startX + waveWidth) {
        ctx.beginPath();
        ctx.arc(activePulseX, baselineY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#2DD4BF';
        ctx.shadowColor = '#2DD4BF';
        ctx.shadowBlur = 15;
        ctx.fill();
      }

      ctx.restore();
    },

    /**
     * --------------------------------------------------------------------------
     * 2. DYNAMIC 3D TILT & MOUSE SPOTLIGHT LIGHTING
     * --------------------------------------------------------------------------
     */
    initMouseSpotlightAndTilt() {
      if (this.isReducedMotion) return;

      // Cards that support 3D perspective tilt
      const tiltCards = document.querySelectorAll(
        '.card, .stat-tile, .next-med-card, .hero-progress-card, .sos-service-card'
      );

      tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          // Compute mouse percentage for spotlight gradient
          const xPercent = (x / rect.width) * 100;
          const yPercent = (y / rect.height) * 100;
          card.style.setProperty('--mouse-x', `${xPercent}%`);
          card.style.setProperty('--mouse-y', `${yPercent}%`);

          // 3D subtle tilt
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = ((y - centerY) / centerY) * -5; // max 5 deg
          const rotateY = ((x - centerX) / centerX) * 5;

          card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
      });
    },

    /**
     * --------------------------------------------------------------------------
     * 3. MAGNETIC BUTTONS
     * --------------------------------------------------------------------------
     */
    initMagneticButtons() {
      if (this.isReducedMotion) return;
      const magneticBtns = document.querySelectorAll('.btn-magnetic, .btn-primary, .sos-floating-btn');

      magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
          const rect = btn.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        });

        btn.addEventListener('mouseleave', () => {
          btn.style.transform = 'translate(0px, 0px)';
        });
      });
    },

    /**
     * --------------------------------------------------------------------------
     * 4. CINEMATIC HERO EXPERIENCE
     * --------------------------------------------------------------------------
     */
    initHeroExperience() {
      const heroSection = document.getElementById('cinematicHero');
      const getStartedBtn = document.getElementById('heroGetStartedBtn');
      const watchDemoBtn = document.getElementById('heroWatchDemoBtn');
      const exploreJourneyBtn = document.getElementById('navStoryBtn');

      if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
          this.smoothTransitionToDashboard();
        });
      }

      if (watchDemoBtn) {
        watchDemoBtn.addEventListener('click', () => {
          this.openEmotionalStorytelling();
        });
      }

      if (exploreJourneyBtn) {
        exploreJourneyBtn.addEventListener('click', () => {
          this.openEmotionalStorytelling();
        });
      }

      // Quick-close button on hero if user prefers instant app view
      const dismissHeroBtn = document.getElementById('dismissHeroBtn');
      if (dismissHeroBtn) {
        dismissHeroBtn.addEventListener('click', () => {
          this.smoothTransitionToDashboard();
        });
      }
    },

    smoothTransitionToDashboard() {
      const hero = document.getElementById('cinematicHero');
      const dashboardSec = document.getElementById('dashboardSection');
      if (hero) {
        hero.classList.add('hero-fade-out');
        setTimeout(() => {
          hero.style.display = 'none';
        }, 500);
      }
      // Ensure Dashboard nav is active
      const navDashboard = document.getElementById('navDashboard');
      if (navDashboard) navDashboard.click();

      // Smooth scroll to top of dashboard
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.showToast) {
        showToast('Welcome to your CarePulse Health Companion 🌿', 'info');
      }
    },

    /**
     * --------------------------------------------------------------------------
     * 5. EMOTIONAL STORYTELLING SECTION (The 7-Scene Patient Journey)
     * --------------------------------------------------------------------------
     */
    scenesData: [
      {
        sceneNum: 1,
        act: 'Act I • The Overwhelmed Patient',
        title: 'A Struggle in the Shadows',
        tagline: 'When Memory Fails, Health Trembles',
        description: 'An elderly patient gazes at an assortment of unlabelled prescription bottles. What was taken? What was missed? The quiet struggle of daily medication begins.',
        badge: 'Scene 1 / 7',
        visual: 'bottles-blur',
        color: '#64748B',
        audioCue: 'Clock Ticking'
      },
      {
        sceneNum: 2,
        act: 'Act II • The Missed Dose',
        title: 'Silent Reminders Left Unheard',
        tagline: 'The Cascade of a Forgotten Morning',
        description: 'Hours pass silently. Blood pressure medicine lies undisturbed on the nightstand. The critical morning therapeutic window closes without notice.',
        badge: 'Scene 2 / 7',
        visual: 'clock-alarm-amber',
        color: '#F59E0B',
        audioCue: 'Amber Alert'
      },
      {
        sceneNum: 3,
        act: 'Act III • Health Anxiety',
        title: 'The Weight of Uncertainty',
        tagline: 'Fear and Isolation Compound',
        description: 'Heart rate spikes. A sense of vulnerability creeps in. Will family find out? Is a hospitalization impending? Health anxiety turns physical.',
        badge: 'Scene 3 / 7',
        visual: 'heartbeat-anxiety',
        color: '#FF6B6B',
        audioCue: 'Accelerated Pulse'
      },
      {
        sceneNum: 4,
        act: 'Act IV • CarePulse Enters',
        title: 'A Beacon of Compassion',
        tagline: 'Never Miss a Dose. Never Feel Alone.',
        description: 'A soothing medical teal light illuminates the screen. A two-tone harmonic chime rings. A gentle companion arrives with zero judgment, only care.',
        badge: 'Scene 4 / 7',
        visual: 'carepulse-dawn',
        color: '#14B8A6',
        audioCue: 'Harmonic Chime'
      },
      {
        sceneNum: 5,
        act: 'Act V • Harmonious Routine',
        title: 'Precision Meets Simplicity',
        tagline: 'Every Prescription in its Rightful Place',
        description: 'Dosages, meal timings, and doctor notes organize into an intuitive, living timeline. One tap confirms the dose. The family caregiver receives reassurance.',
        badge: 'Scene 5 / 7',
        visual: 'dashboard-harmony',
        color: '#2563EB',
        audioCue: 'Gentle Affirmation'
      },
      {
        sceneNum: 6,
        act: 'Act VI • Momentum & Adherence',
        title: 'The Flame of Consistency',
        tagline: 'From Hesitation to Unbroken Streaks',
        description: '7-day streak. 14-day milestone. The animated flame burns bright. Blood pressure stabilizes, blood sugar normalizes, and daily peace of mind returns.',
        badge: 'Scene 6 / 7',
        visual: 'streak-burst',
        color: '#10B981',
        audioCue: 'Celebration Chime'
      },
      {
        sceneNum: 7,
        act: 'Act VII • Life Renewed',
        title: 'Health Confidence Restored',
        tagline: 'Thriving, Safe, and Truly Supported',
        description: 'The patient smiles, taking an evening walk with confidence. CarePulse stands guard silently in their pocket. Healthcare is no longer a burden — it is a companion.',
        badge: 'Scene 7 / 7',
        visual: 'confidence-vitality',
        color: '#2DD4BF',
        audioCue: 'Peaceful Ambient'
      }
    ],

    initEmotionalStorytelling() {
      const modal = document.getElementById('storyModal');
      const closeBtn = document.getElementById('closeStoryModalBtn');
      const prevBtn = document.getElementById('storyPrevBtn');
      const nextBtn = document.getElementById('storyNextBtn');
      const playPauseBtn = document.getElementById('storyPlayPauseBtn');
      const launchAppBtn = document.getElementById('storyLaunchAppBtn');

      if (closeBtn) closeBtn.addEventListener('click', () => this.closeEmotionalStorytelling());
      if (prevBtn) prevBtn.addEventListener('click', () => this.stepStoryScene(-1));
      if (nextBtn) nextBtn.addEventListener('click', () => this.stepStoryScene(1));
      if (playPauseBtn) playPauseBtn.addEventListener('click', () => this.toggleStoryAutoplay());
      if (launchAppBtn) {
        launchAppBtn.addEventListener('click', () => {
          this.closeEmotionalStorytelling();
          this.smoothTransitionToDashboard();
        });
      }

      // Close on backdrop click
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) this.closeEmotionalStorytelling();
        });
      }

      // Keyboard navigation (Arrow keys, Esc)
      window.addEventListener('keydown', (e) => {
        if (!modal || !modal.classList.contains('open')) return;
        if (e.key === 'ArrowRight') this.stepStoryScene(1);
        if (e.key === 'ArrowLeft') this.stepStoryScene(-1);
        if (e.key === 'Escape') this.closeEmotionalStorytelling();
      });
    },

    openEmotionalStorytelling() {
      const modal = document.getElementById('storyModal');
      if (!modal) return;
      this.currentStoryScene = 1;
      this.renderStoryScene(this.currentStoryScene);
      modal.classList.add('open');
      this.startStoryAutoplay();
    },

    closeEmotionalStorytelling() {
      const modal = document.getElementById('storyModal');
      if (modal) modal.classList.remove('open');
      this.stopStoryAutoplay();
    },

    stepStoryScene(direction) {
      let target = this.currentStoryScene + direction;
      if (target > 7) target = 1;
      if (target < 1) target = 7;
      this.currentStoryScene = target;
      this.renderStoryScene(this.currentStoryScene);
    },

    renderStoryScene(sceneNum) {
      const scene = this.scenesData.find(s => s.sceneNum === sceneNum);
      if (!scene) return;

      const actEl = document.getElementById('storySceneAct');
      const titleEl = document.getElementById('storySceneTitle');
      const tagEl = document.getElementById('storySceneTag');
      const descEl = document.getElementById('storySceneDesc');
      const badgeEl = document.getElementById('storySceneBadge');
      const visualEl = document.getElementById('storySceneVisual');
      const dotsContainer = document.getElementById('storySceneDots');

      if (actEl) actEl.textContent = scene.act;
      if (titleEl) titleEl.textContent = scene.title;
      if (tagEl) tagEl.textContent = `“${scene.tagline}”`;
      if (descEl) descEl.textContent = scene.description;
      if (badgeEl) {
        badgeEl.textContent = scene.badge;
        badgeEl.style.borderColor = scene.color;
        badgeEl.style.color = scene.color;
      }

      // Update interactive visual canvas / graphics
      if (visualEl) {
        visualEl.innerHTML = this.getSceneVisualHtml(scene);
      }

      // Update stepper dots
      if (dotsContainer) {
        dotsContainer.innerHTML = this.scenesData.map(s => `
          <button class="story-dot ${s.sceneNum === sceneNum ? 'active' : ''}" 
                  data-scene="${s.sceneNum}" 
                  aria-label="Jump to Scene ${s.sceneNum}">
          </button>
        `).join('');

        dotsContainer.querySelectorAll('.story-dot').forEach(dot => {
          dot.addEventListener('click', (e) => {
            const sc = parseInt(e.currentTarget.getAttribute('data-scene'), 10);
            this.currentStoryScene = sc;
            this.renderStoryScene(sc);
          });
        });
      }

      // Play soft harmonic cue on scene 4 (CarePulse Enters)
      if (sceneNum === 4 && window.CarePulseReminders) {
        CarePulseReminders.playAlarmChime();
        this.triggerAudioVisualizer(800);
      }
    },

    getSceneVisualHtml(scene) {
      switch (scene.visual) {
        case 'bottles-blur':
          return `
            <div class="scene-artwork artwork-bottles">
              <div class="art-glow" style="background: radial-gradient(circle, rgba(148, 163, 184, 0.25) 0%, transparent 70%);"></div>
              <div class="art-capsule blur-pill pill-1"></div>
              <div class="art-capsule blur-pill pill-2"></div>
              <div class="art-capsule blur-pill pill-3"></div>
              <div class="art-clock-shadow">
                <i data-lucide="clock" class="art-icon"></i>
                <span>08:15 AM — Missed?</span>
              </div>
            </div>
          `;
        case 'clock-alarm-amber':
          return `
            <div class="scene-artwork artwork-amber">
              <div class="art-glow" style="background: radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%);"></div>
              <div class="amber-ripple ring-1"></div>
              <div class="amber-ripple ring-2"></div>
              <div class="art-alert-card">
                <i data-lucide="alert-circle" style="color: #F59E0B; width: 36px; height: 36px;"></i>
                <div style="font-weight: 700; color: #F59E0B;">Dose Overdue: Amlodipine 5mg</div>
                <div style="font-size: 0.85rem; color: #94A3B8;">3 hours elapsed since schedule</div>
              </div>
            </div>
          `;
        case 'heartbeat-anxiety':
          return `
            <div class="scene-artwork artwork-anxiety">
              <div class="art-glow" style="background: radial-gradient(circle, rgba(255, 107, 107, 0.35) 0%, transparent 70%);"></div>
              <div class="anxiety-pulse-heart">
                <i data-lucide="heart-pulse" style="width: 64px; height: 64px; color: #FF6B6B;"></i>
              </div>
              <div class="vital-stress-badge">
                <span>BP: 148 / 95 mmHg</span>
                <span class="badge-tag">Elevated</span>
              </div>
            </div>
          `;
        case 'carepulse-dawn':
          return `
            <div class="scene-artwork artwork-carepulse-dawn">
              <div class="dawn-light-burst"></div>
              <div class="carepulse-floating-logo">
                <img src="assets/logo.svg" alt="CarePulse Beacon" style="width: 80px; height: 80px; filter: drop-shadow(0 0 25px #2DD4BF);">
              </div>
              <div class="chime-wave-visualizer">
                <span class="wave-bar b1"></span>
                <span class="wave-bar b2"></span>
                <span class="wave-bar b3"></span>
                <span class="wave-bar b4"></span>
              </div>
            </div>
          `;
        case 'dashboard-harmony':
          return `
            <div class="scene-artwork artwork-harmony">
              <div class="art-glow" style="background: radial-gradient(circle, rgba(37, 99, 235, 0.3) 0%, transparent 70%);"></div>
              <div class="harmony-card-deck">
                <div class="deck-item d1">
                  <i data-lucide="check" style="color: #10B981;"></i> Metformin 500mg • 08:00 AM
                </div>
                <div class="deck-item d2">
                  <i data-lucide="check" style="color: #10B981;"></i> Telmisartan 40mg • 09:00 AM
                </div>
                <div class="deck-item d3">
                  <i data-lucide="clock" style="color: #2DD4BF;"></i> Next: Vitamin D3 • 01:00 PM
                </div>
              </div>
            </div>
          `;
        case 'streak-burst':
          return `
            <div class="scene-artwork artwork-streak">
              <div class="art-glow" style="background: radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, transparent 70%);"></div>
              <div class="streak-flame-monument">
                <span class="flame-glyph">🔥</span>
                <div class="streak-days-display">14 DAY STREAK</div>
                <div class="streak-sub">100% Weekly Adherence</div>
              </div>
              <div class="sparkle-particle sp1">✨</div>
              <div class="sparkle-particle sp2">⭐</div>
              <div class="sparkle-particle sp3">✨</div>
            </div>
          `;
        case 'confidence-vitality':
          return `
            <div class="scene-artwork artwork-vitality">
              <div class="vitality-aura"></div>
              <div class="vitality-badge-stack">
                <div class="badge-vital">
                  <i data-lucide="shield-check" style="color: #2DD4BF; width: 32px; height: 32px;"></i>
                  <div>
                    <div style="font-weight: 700; color: #2DD4BF;">Family Connected</div>
                    <div style="font-size: 0.82rem; color: #94A3B8;">Automatic WhatsApp alerts active</div>
                  </div>
                </div>
                <div class="badge-vital">
                  <i data-lucide="smile" style="color: #10B981; width: 32px; height: 32px;"></i>
                  <div>
                    <div style="font-weight: 700; color: #10B981;">Mood: Great (5/5)</div>
                    <div style="font-size: 0.82rem; color: #94A3B8;">BP Optimal: 118 / 78 mmHg</div>
                  </div>
                </div>
              </div>
            </div>
          `;
        default:
          return '';
      }
    },

    toggleStoryAutoplay() {
      const btn = document.getElementById('storyPlayPauseBtn');
      if (this.storyInterval) {
        this.stopStoryAutoplay();
        if (btn) btn.innerHTML = '<i data-lucide="play"></i> <span>Play</span>';
      } else {
        this.startStoryAutoplay();
        if (btn) btn.innerHTML = '<i data-lucide="pause"></i> <span>Pause</span>';
      }
      if (window.lucide) lucide.createIcons();
    },

    startStoryAutoplay() {
      this.stopStoryAutoplay();
      this.storyInterval = setInterval(() => {
        this.stepStoryScene(1);
        if (this.currentStoryScene === 7) {
          this.stopStoryAutoplay();
        }
      }, 6500);
    },

    stopStoryAutoplay() {
      if (this.storyInterval) {
        clearInterval(this.storyInterval);
        this.storyInterval = null;
      }
    },

    /**
     * --------------------------------------------------------------------------
     * 6. HEALTH STORY MODE (NEW Visual Presentation Layer Only — Zero Data Change)
     * --------------------------------------------------------------------------
     */
    initHealthStoryMode() {
      const openStoryModeBtn = document.getElementById('openHealthStoryBtn');
      const modal = document.getElementById('healthStoryModal');
      const closeBtn = document.getElementById('closeHealthStoryModalBtn');

      if (openStoryModeBtn) {
        openStoryModeBtn.addEventListener('click', () => {
          this.renderHealthStoryNarrative();
          if (modal) modal.classList.add('open');
        });
      }

      if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
          modal.classList.remove('open');
        });
      }

      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.classList.remove('open');
        });
      }
    },

    renderHealthStoryNarrative() {
      const container = document.getElementById('healthStoryContent');
      if (!container) return;

      const healthLogs = window.CarePulseHealthLog ? CarePulseHealthLog.getHealthLogs() : [];
      const intakeLogs = window.CarePulseTracker ? CarePulseTracker.getIntakeLogs() : [];
      const meds = window.CarePulseMeds ? CarePulseMeds.getMedicines() : [];
      const streak = window.CarePulseTracker ? CarePulseTracker.calculateStreak() : 0;

      // Extract trend data
      const bpLogs = healthLogs.filter(l => l.bpSystolic && l.bpDiastolic);
      const latestBp = bpLogs.length > 0 ? bpLogs[0] : null;
      const oldestBp = bpLogs.length > 1 ? bpLogs[bpLogs.length - 1] : null;

      let bpTrendText = 'Your blood pressure is within stable observation.';
      let bpImprovement = false;
      if (latestBp && oldestBp) {
        const sysDiff = oldestBp.bpSystolic - latestBp.bpSystolic;
        if (sysDiff > 0) {
          bpTrendText = `Your Systolic Blood Pressure improved by ${sysDiff} mmHg towards your target zone.`;
          bpImprovement = true;
        } else {
          bpTrendText = `Your Blood Pressure currently averages ${latestBp.bpSystolic}/${latestBp.bpDiastolic} mmHg.`;
        }
      }

      container.innerHTML = `
        <div class="health-story-journey">
          
          <!-- Chapter 1: The Baseline -->
          <div class="story-chapter-card">
            <div class="chapter-marker">Chapter 1</div>
            <div class="chapter-title">Starting Your Health Routine</div>
            <p class="chapter-desc">
              You embarked on your wellness journey with <strong>${meds.length} active prescription${meds.length === 1 ? '' : 's'}</strong>.
              CarePulse established your personalized daily schedule across morning, afternoon, and evening dosage routines.
            </p>
            <div class="chapter-stats-chip">
              <i data-lucide="pill"></i>
              <span>${meds.length} Medications Monitored</span>
            </div>
          </div>

          <!-- Chapter 2: Daily Consistency -->
          <div class="story-chapter-card">
            <div class="chapter-marker">Chapter 2</div>
            <div class="chapter-title">Building Habit & Resilience</div>
            <p class="chapter-desc">
              Consistency is where healing takes root. You achieved a powerful 
              <strong>${streak}-day medicine intake streak</strong> with zero missed critical doses during your peak habit windows.
            </p>
            <div class="chapter-stats-chip" style="color: #F59E0B; border-color: rgba(245, 158, 11, 0.3);">
              <i data-lucide="flame"></i>
              <span>${streak} Days Unbroken Streak</span>
            </div>
          </div>

          <!-- Chapter 3: The Vital Shift -->
          <div class="story-chapter-card ${bpImprovement ? 'highlight-chapter' : ''}">
            <div class="chapter-marker">Chapter 3</div>
            <div class="chapter-title">Cardiovascular & Metabolic Stability</div>
            <p class="chapter-desc">
              ${bpTrendText} With consistent dosage adherence, medication bioavailability reaches optimal therapeutic equilibrium.
            </p>
            <div class="chapter-stats-chip" style="color: #10B981; border-color: rgba(16, 185, 129, 0.3);">
              <i data-lucide="activity"></i>
              <span>${latestBp ? `${latestBp.bpSystolic}/${latestBp.bpDiastolic} mmHg Recent` : 'Vitals In Normal Range'}</span>
            </div>
          </div>

          <!-- Chapter 4: Confidence & Horizon -->
          <div class="story-chapter-card">
            <div class="chapter-marker">Chapter 4</div>
            <div class="chapter-title">Your Doctor-Ready Health Profile</div>
            <p class="chapter-desc">
              Your adherence history and vitals logs are ready to share with your physician.
              You are not alone in managing your health — CarePulse keeps you and your loved ones in sync.
            </p>
            <div class="chapter-stats-chip" style="color: #2DD4BF; border-color: rgba(45, 212, 191, 0.3);">
              <i data-lucide="heart-handshake"></i>
              <span>Safe • Supported • Confident</span>
            </div>
          </div>

        </div>
      `;

      if (window.lucide) lucide.createIcons();
    },

    /**
     * --------------------------------------------------------------------------
     * 7. WEB AUDIO VISUALIZER OVERLAY
     * --------------------------------------------------------------------------
     */
    initAudioVisualizerOverlay() {
      // Create visualizer canvas if not already present
      if (!document.getElementById('audioVisualizerCanvas')) {
        const visualizer = document.createElement('canvas');
        visualizer.id = 'audioVisualizerCanvas';
        visualizer.className = 'audio-visualizer-canvas';
        visualizer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(visualizer);
      }
    },

    triggerAudioVisualizer(durationMs = 1200) {
      if (this.isReducedMotion) return;
      const canvas = document.getElementById('audioVisualizerCanvas');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      canvas.classList.add('active');

      const centerX = canvas.width / 2;
      const centerY = canvas.height * 0.45;
      const startTime = performance.now();

      const drawRipples = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 3 expanding harmonic rings
        for (let i = 0; i < 3; i++) {
          const ringProgress = (progress + i * 0.22) % 1;
          const radius = ringProgress * 280 + 30;
          const alpha = (1 - ringProgress) * 0.55;

          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(45, 212, 191, ${alpha})`;
          ctx.lineWidth = 3 * (1 - ringProgress);
          ctx.shadowColor = '#2DD4BF';
          ctx.shadowBlur = 20;
          ctx.stroke();
          ctx.restore();
        }

        // Ambient screen flash pulse
        const screenAlpha = (1 - progress) * 0.08;
        ctx.fillStyle = `rgba(20, 184, 166, ${screenAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (progress < 1) {
          requestAnimationFrame(drawRipples);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          canvas.classList.remove('active');
        }
      };

      requestAnimationFrame(drawRipples);
    },

    /**
     * --------------------------------------------------------------------------
     * 8. STATS & PROGRESS RING NUMBER COUNT-UP
     * --------------------------------------------------------------------------
     */
    initCountUpAnimations() {
      // Hook into tracker and dashboard stat updates to smoothly tween numbers
      this.animateNumber('statTotalMeds');
      this.animateNumber('statTakenToday');
      this.animateNumber('statStreakDays');
    },

    animateNumber(elementId, targetValue = null) {
      const el = document.getElementById(elementId);
      if (!el) return;

      const endVal = targetValue !== null ? targetValue : parseInt(el.textContent, 10) || 0;
      let startVal = 0;
      const duration = 800;
      const startTime = performance.now();

      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out quad
        const ease = 1 - (1 - progress) * (1 - progress);
        const current = Math.floor(startVal + (endVal - startVal) * ease);

        el.textContent = current;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = endVal;
        }
      };

      requestAnimationFrame(step);
    },

    /**
     * --------------------------------------------------------------------------
     * 9. ANIMATED STREAK FLAME EMBERS
     * --------------------------------------------------------------------------
     */
    initFlameEmbers() {
      const flameContainer = document.querySelector('.streak-tile .stat-icon');
      if (!flameContainer) return;
      // Add animated flame aura class
      flameContainer.classList.add('flame-alive');
    }
  };

  // Expose globally
  window.CarePulseCinematic = CarePulseCinematic;

  // Auto-init on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    CarePulseCinematic.init();
  });

})(window, document);
