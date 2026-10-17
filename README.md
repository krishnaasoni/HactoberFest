# CarePulse — AI Medicine Reminder & Health Companion 🩺✨

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20CSS3%20%7C%20HTML5-blue.svg)](https://developer.mozilla.org/)
[![Google Gemini API](https://img.shields.io/badge/AI-Google%20Gemini%20API-teal.svg)](https://aistudio.google.com/)
[![Hacktoberfest](https://img.shields.io/badge/Hacktoberfest-2026-orange.svg)](CONTRIBUTING.md)

**CarePulse** is an intelligent, accessible, and privacy-first web application designed to help patients of all ages — children, busy adults, and seniors — take the right medicine at the right time. Combining hospital-grade reminders with Web Audio synthesis, adherence streaks, vitals logging, and a compassionate trilingual AI health companion powered by Google Gemini.

---

## 🌟 The Problem CarePulse Solves

Medication non-adherence is one of the world's most critical yet preventable healthcare issues:
- **Over 50% of patients** do not take their prescribed medications as directed.
- **Seniors and elderly patients** frequently struggle with tiny fonts, complex logins, and cluttered interfaces.
- **Patients and caregivers** often forget whether a pill should be taken before or after meals, or what to do when a dose is missed.
- **Privacy concerns**: Traditional health apps require intrusive accounts, email logins, and track personal medical records on remote databases.

**CarePulse solves this completely:**
1. **Zero Login / 100% Privacy**: All medical records stay strictly inside your browser's local storage.
2. **Elder Mode**: A single toggle increases typography by +25%, enlarges touch targets, and boosts contrast for older adults.
3. **Audible & Visual Alarms**: Plays a soothing, multi-harmonic hospital chime synthesized using the **Web Audio API** and sends desktop notifications even if you are browsing another tab.
4. **CarePulse AI with Hardcoded Emergency Safety**: Answers health questions in English, Hindi, and Hinglish, with an unbypassable emergency rule that immediately displays emergency helpline numbers (**108 Ambulance** / **112**) whenever critical symptoms are detected.

---

## 📸 Screenshots & UI Showcase

```
+---------------------------------------------------------------------------------+
|  [Logo] CarePulse AI         Good Morning! Sunday, 17 Oct       [Elder] [Theme] |
+---------------------------------------------------------------------------------+
| (Dashboard)    |  +----------------------------------+  +--------------------+  |
|  Medicines     |  | TODAY'S ADHERENCE                |  | NEXT MEDICINE      |  |
|  Tracker       |  | [===========O] 75%               |  | Metformin 500mg    |  |
|  Health Log    |  | 3 of 4 Doses Taken  🔥 5 Streak  |  | Due in 25 mins     |  |
|  AI Chat       |  +----------------------------------+  +--------------------+  |
|  Settings      |                                                                |
|                |  TODAY'S SCHEDULE TIMELINE                                     |
|  * Reminders   |  * 08:30 AM  Metformin 500mg (After food)   [ ✓ Taken ]        |
|    Active      |  * 09:00 AM  Amlodipine 5mg (Any time)      [ ✓ Taken ]        |
|                |  * 01:00 PM  Vitamin D3 (With food)         [ ✓ Taken ]        |
|                |  * 08:30 PM  Metformin 500mg (After food)   [ Take ] [ Skip ]  |
+---------------------------------------------------------------------------------+
```

---

## 🚀 Key Features

### 1. Dashboard (Command Center)
- **Time-Aware Greeting**: Automatically updates ("Good Morning", "Good Afternoon", "Good Evening", "Rest Well Tonight") with the current date.
- **Animated SVG Progress Ring**: Circular progress bar dynamically updates as you mark doses taken.
- **Next Medicine Highlight Card**: Live countdown clock (e.g., *"Due in 35 mins"*, *"Due now!"*) with instant "Take Now" and "Snooze (10m)" buttons.
- **Today's Schedule Timeline**: Shows every dose scheduled for today with food timing instructions (Before food, After food, With food) and action buttons with celebratory feedback.
- **Streak Counter**: Consecutive day streak counter with an animated glowing flame icon 🔥.
- **Weekly Adherence Rate**: Quick overview percentage of medication adherence over the past 7 days.

### 2. Medicines Manager
- **Complete Prescriptions CRUD**: Add, edit, delete, and view all active medications.
- **Multiple Times per Day**: Add any number of reminder times per medicine with dynamic time chips.
- **Frequency Customization**: Choose individual days of the week or everyday intake.
- **Form Factors**: Tablets, Capsules, Syrups, Injections, Drops, Inhalers, and Ointments with distinct badges and icons.
- **Search & Filters**: Real-time search by medicine name, dose, or notes, plus filter by form type.
- **Empty State**: Friendly illustration and a 1-click **"Load Demo Data"** button.

### 3. Reminders & Audible Alarms
- **20-Second Precision Interval Checker**: Scans for upcoming doses in real time.
- **Web Audio API Synthesizer**: Plays a pleasant, four-tone medical chime (C5 → E5 → G5 → C6) without relying on external MP3 downloads or CORS.
- **Web Notifications API**: Polite permission prompt with fallback to in-app alerts.
- **Due Reminder Modal**: High-visibility alert popup with large, accessible buttons: **Mark as Taken**, **Snooze (10 min)**, or **Skip**.

### 4. History & Adherence Analytics
- **14-Day Visual Day Strip**: Color-coded calendar dots:
  - 🟢 **Green**: 100% doses taken.
  - 🟡 **Amber**: Partial adherence.
  - 🔴 **Red**: Missed doses.
- **Interactive Day Inspector**: Tap any historical day to see which medicines were taken or skipped.
- **Weekly Adherence Bar Chart**: Chart.js visualization comparing daily adherence across Monday–Sunday.
- **Dose Breakdown Doughnut Chart**: Proportional split between Taken, Skipped, and Missed medications.

### 5. Health Vitals & Mood Log
- **Comprehensive Logging**:
  - **Blood Pressure**: Systolic & Diastolic (mmHg).
  - **Blood Sugar**: mg/dL with context tags (*Fasting*, *Post-Meal*, *Random*).
  - **Weight**: Track body weight in kg.
  - **Mood Tracker**: 5-point emoji selector (😄 Great, 🙂 Good, 😐 Okay, 🙁 Poor, 😫 Rough).
  - **Doctor Notes**: Remarks on symptoms, exercise, or diet.
- **Multi-Metric Trend Line Charts**: Seamlessly switch between BP dual lines, Blood Sugar trends, and Weight curves.
- **Doctor Share Notice**: Gentle prompt: *"💡 Share these trends with your doctor at your next appointment."*

### 6. CarePulse AI (Health Assistant)
- **Trilingual Assistance**: Understands and replies in **English, Hindi, and Hinglish**!
- **Strict Medical Ethics System Prompt**: Never diagnoses, never prescribes, never recommends dosage adjustments. Answers in simple language and reminds patients to consult a licensed physician.
- **Hardcoded Emergency Safety Rule**:
  - Runs **BEFORE** any network or AI call.
  - Triggered by emergency keywords: `"chest pain"`, `"seene me dard"`, `"saans nahi"`, `"breathing difficulty"`, `"unconscious"`, `"behosh"`, `"heavy bleeding"`, `"stroke"`, `"heart attack"`, `"overdose"`, etc.
  - Instantly reveals a prominent red emergency card: **"🚨 Call 108 (Ambulance) or 112 immediately"** with tap-to-call buttons and suppresses AI response.
- **Suggested Question Chips**: Fast prompts for common questions (*"Before or after food?"*, *"What if I miss a dose?"*, *"Tips for better sleep"*).
- **Secure Architecture**: Serverless function at `/api/chat.js` reads `GEMINI_API_KEY` strictly from environment variables. The API key is **never** exposed to browser client code.

### 7. Accessibility, Themes & Backups
- **Dark Mode & Light Mode**: Deep navy `#0B1D3A` glassmorphism dark theme and clean light theme.
- **Elder Mode**: Specially calibrated +25% typography, enlarged touch targets (minimum 54px), and higher contrast.
- **Confetti Animation**: Native HTML5 Canvas particle confetti burst when marking medicines as taken.
- **JSON Backup & Restore**: One-click export of all prescriptions, adherence history, and vitals to a `.json` backup file, and import back anytime.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Structure** | Semantic HTML5 (ARIA attributes, WCAG AA contrast) |
| **Styling** | Vanilla CSS3 (CSS Custom Properties, Glassmorphism, Responsive Grid/Flexbox) |
| **Logic** | Vanilla JavaScript (ES6+ Modules, Object-Oriented Architecture) |
| **Storage** | Browser `localStorage` (Offline-first, Zero login) |
| **Audio** | Web Audio API (Synthesized harmonic chime) + HTML5 Audio fallback |
| **Reminders** | Web Notifications API + `setInterval` (20-second cycle) |
| **Visual Charts** | Chart.js via CDN |
| **Iconography** | Lucide Icons via CDN |
| **Typography** | Google Fonts ("Poppins" for headings, "Inter" for body) |
| **AI Integration** | Google Gemini API (`gemini-1.5-flash`) via Vercel Serverless Function (`/api/chat.js`) |

---

## 📁 Project Structure

```
carepulse/
├── index.html          # Main single-page application shell
├── css/
│   └── style.css       # Complete design system, themes, and elder mode
├── js/
│   ├── app.js          # Core app controller, navigation, theme, modals, backups
│   ├── medicines.js    # Prescriptions CRUD, validation, and card rendering
│   ├── reminders.js    # 20s interval checker, Web Audio chime, Web Notifications
│   ├── tracker.js      # Daily logs, streak algorithm, progress ring, Chart.js
│   ├── healthlog.js    # BP, Blood Sugar, Weight, Mood logging & trend charts
│   └── chat.js         # AI chat UI, suggested chips & hardcoded emergency rule
├── api/
│   └── chat.js         # Vercel serverless function (Node.js) for Gemini API
├── assets/
│   ├── logo.svg        # CarePulse Heart + ECG vector logo
│   ├── alarm.wav       # Dual-tone chime sound asset
│   └── alarm.mp3       # Fallback sound asset
├── .env.example        # Environment variable template for Gemini API key
├── .gitignore          # Ignores .env, node_modules, and OS caches
├── vercel.json         # Serverless API routing configuration
├── package.json        # NPM scripts and project metadata
├── CONTRIBUTING.md     # Open source contribution guide
└── README.md           # Comprehensive project documentation
```

---

## ⚡ Quick Start Guide

### Option A: Run Instantly (No Installation Required)
Everything in CarePulse (Dashboard, Medicines, Reminders, Audio Chimes, Tracker, Charts, Health Logs, and Fallback AI Knowledge) runs out-of-the-box in any modern browser!

1. Clone or download this repository:
   ```bash
   git clone https://github.com/your-username/carepulse.git
   cd carepulse
   ```
2. Double click `index.html` to open it in your browser, or start a simple local server:
   ```bash
   # Using Python
   python -m http.server 3000

   # Or using Node / npx
   npx serve .
   ```
3. Visit `http://localhost:3000` in your browser.

---

### Option B: Run with Google Gemini AI Serverless Function

To enable live Google Gemini AI responses in the CarePulse AI chat:

#### Step 1: Obtain a Free Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **"Get API key"** and select or create a project.
4. Copy your API key.

#### Step 2: Configure Environment Variables
Create a `.env` file in the project root:
```bash
cp .env.example .env
```
Open `.env` and paste your API key:
```env
GEMINI_API_KEY=AIzaSyYourSecretKeyHere...
```

#### Step 3: Launch with Vercel CLI
```bash
# Install Vercel CLI globally (if not installed)
npm install -g vercel

# Run the local development server with serverless functions
vercel dev
```
Open `http://localhost:3000` in your browser. The `/api/chat` serverless function will now communicate directly with Google Gemini!

---

## 🌐 Deploying to Vercel

Deploy CarePulse to the web in under 2 minutes:

1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your `carepulse` repository.
4. In the **Environment Variables** section, add:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `Your_Gemini_API_Key_Here`
5. Click **"Deploy"**.
6. Your production CarePulse app is now live with global HTTPS and serverless API endpoints!

---

## ⚠️ Limitations

- **Browser Tab Open**: Reminders and alarms operate via the browser's JavaScript runtime and Web Notifications API while the CarePulse tab is open or running in the background. If the browser or tab is completely closed, web notifications cannot fire (native mobile Service Workers and push notifications can be integrated in future phases).
- **Notification Permissions**: Browser desktop notifications require one-time user authorization. If declined, CarePulse automatically falls back to in-app audible and visual alerts.

---

## 🔮 Future Roadmap

- [ ] **Prescription OCR Scanner**: Take a photo of a doctor's prescription slip or pill bottle label to automatically prefill medicine name, dose, and frequency using Gemini Vision.
- [ ] **Family & Caregiver Alerts**: Send automatic WhatsApp / SMS / Email notifications to family members if an elderly patient misses their dose by more than 45 minutes.
- [ ] **Voice-Guided Reminders**: Multi-language text-to-speech voice reminders (*"Dadi ji, it is time for your blood pressure medicine"*).
- [ ] **Export Doctor PDF Report**: Generate a formatted, print-ready PDF summary of 30-day medication adherence and vitals trends for clinic appointments.
- [ ] **PWA / Service Worker Offline Cache**: Installable Progressive Web App with background sync.

---

## 🤝 Contributing & Hacktoberfest

Contributions from developers of all skill levels are warmly welcomed! CarePulse is proud to participate in **Hacktoberfest**.

Check out [`CONTRIBUTING.md`](CONTRIBUTING.md) for full instructions on our pull request workflow and coding standards.

### 💡 5 Good-First-Issue Ideas for Contributors:
1. **Custom Color Themes**: Add user-selectable accent themes (e.g., Lavender, Sunset Coral, Forest Emerald) in Settings.
2. **Complete Regional Localization**: Add full Hindi, Tamil, Telugu, or Spanish translation toggles for all UI button labels and titles.
3. **Medicine Interaction Warnings**: Highlight common interaction alerts (e.g., warning if two blood thinners are scheduled simultaneously).
4. **Printable Doctor PDF Export**: Use `jspdf` or print stylesheets to generate clean A4 medical reports.
5. **Unit & Integration Tests**: Write Vitest or Jest test suites for schedule date calculations and streak algorithms.

---

## ⚖️ Medical Disclaimer

> **IMPORTANT MEDICAL NOTICE**:
> CarePulse and CarePulse AI are informational health management and reminder tools designed to assist patients in tracking schedules and vitals. **CarePulse is NOT a medical device and does NOT provide medical advice, diagnosis, or treatment.**
> 
> Always seek the direct guidance of your physician, pharmacist, or qualified healthcare provider with any questions you may have regarding a medical condition, prescription schedule, or dosage change. Never disregard professional medical advice or delay seeking it because of information provided by this software.
>
> In the event of a medical emergency, immediately call **108** (Ambulance), **112**, or your local emergency services, or visit the nearest emergency room.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — feel free to use, modify, and build upon it.
