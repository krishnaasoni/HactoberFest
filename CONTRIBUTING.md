# Contributing to CarePulse 🩺✨

First off, thank you for considering contributing to **CarePulse**! We welcome contributions from developers, designers, translators, and healthcare advocates of all backgrounds and skill levels.

CarePulse is an open-source project committed to making digital healthcare accessible, private, and delightful for everyone.

---

## 🎃 Hacktoberfest Participation

CarePulse proudly participates in **Hacktoberfest**! 

To participate:
1. Make sure your PR solves a real issue or adds a thoughtful improvement.
2. We follow high-quality contribution standards — no spam or trivial cosmetic edits.
3. Check the **Good-First-Issue Ideas** section in [README.md](README.md) for inspiration!

---

## 🛠️ How to Contribute

### 1. Fork and Clone
1. Fork the CarePulse repository to your GitHub account.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/carepulse.git
   cd carepulse
   ```

### 2. Create a Feature Branch
Always work on a descriptive branch rather than `main`:
```bash
git checkout -b feature/add-pdf-report-export
# or
git checkout -b fix/elder-mode-contrast
```

### 3. Make Your Changes
- Keep changes focused and modular.
- Follow the architectural patterns established in the project:
  - Vanilla HTML5, CSS3, and JavaScript (ES6+).
  - No heavy frameworks or unnecessary NPM dependencies.
  - Accessible markup (`aria-*` attributes, semantic tags, minimum 44px touch targets).
  - Clean comments explaining what each function does in plain English.

### 4. Test Locally
Test your changes in multiple browsers and screen sizes (Mobile 375px, Tablet 768px, Desktop 1200px+):
```bash
# Serve locally
npx serve .
# or
python -m http.server 3000
```
- Verify there are no JavaScript errors in the browser console (`F12`).
- Check that both Dark Mode and Light Mode render cleanly.
- Verify that Elder Mode scales gracefully.

### 5. Commit and Push
Write clear, descriptive commit messages:
```bash
git add .
git commit -m "feat: add PDF summary generation for doctor appointments"
git push origin feature/add-pdf-report-export
```

### 6. Submit a Pull Request
1. Open a Pull Request from your branch against the `main` branch of `carepulse`.
2. Provide a clear description of the problem solved, changes made, and include screenshots or GIFs for visual changes.
3. Tag any related issue numbers (e.g., `Closes #12`).

---

## 📜 Code Style Guidelines

1. **Keep it Vanilla**: Stick to plain HTML5, CSS3, and Vanilla JavaScript. Avoid adding heavyweight frameworks.
2. **Beginner-Friendly Comments**: Write a clear 1-2 line JSDoc or plain English comment above every function explaining its purpose and arguments.
3. **Responsive & Mobile-First**: Every new component must be responsive from 320px up to 1440px+. Never introduce horizontal scrollbars.
4. **Accessibility First (WCAG AA)**: Always ensure high contrast ratios, proper labels for screen readers, and keyboard navigable modals.
5. **Security & Privacy**: Never place API keys or telemetry in client-side code. Respect user privacy.

---

## 💡 Need Help?
If you have questions, ideas, or need guidance on implementing a feature, feel free to open a GitHub Discussion or Issue. We are happy to pair and help you get your PR merged!
