# Solvynk — Interactive Prototype (Phase P)

**Tagline:** Real Problems. Independent Solutions. Lasting Proof of Work.
**Working Name:** Solvynk (trademark & clearance pending)
**Phase:** Phase P (Pre-build) · Prototype & Validation Track

---

## 1. Overview

This directory contains the **Solvynk Frontend Prototype Workspace**, built with vanilla HTML, semantic CSS variables, and modern JavaScript. It embodies the dark, technically credible, developer-first aesthetic inspired by GitHub's technical density and modern software portfolios.

### Key Capabilities Demonstrated:
- **BuildTree Solution Matrix:** Independent software projects mapped against numbered requirements (R1–R8) showing `✓ Confirmed`, `◒ Claimed`, `✕ Not Claimed`, and owner reviews.
- **Project Passport:** Transparent separation of verified GitHub App repository metadata (read-only) from creator-declared engineering facts.
- **Outbound Link Safety Interstitial (`/out/[linkId]`):** Demonstration sites open through an advisory dialog showing destination domain and Google Web Risk status (SI-20).
- **Builder Studio (4-Step Flow):** Source selection (GitHub vs. Manual), engineering facts, screenshot arranger, and pre-publish secret scanning guardrails (SI-17).
- **Admin Operational Console:** Emergency safety kill switches and beta pre-moderation queue.
- **WCAG 2.2 AA Accessibility:** High-contrast tokens, 2px visible focus rings, non-color-only statuses, and reduced motion compliance.

---

## 2. Run Locally

Start the local server on port 4173:

```bash
python -m http.server 4173
```

Open in your browser:
- Homepage: `http://localhost:4173/index.html`
- Public Discovery (Explore): `http://localhost:4173/explore.html`
- Problem Detail & BuildTree Matrix: `http://localhost:4173/problem.html?slug=tamil-voice-recognition`
- Project Showcase & Passport: `http://localhost:4173/project.html?slug=kuralvoice`
- Studio Flows Workspace: `http://localhost:4173/prototype.html`

---

## 3. Architecture & Fixtures

- `styles.css`: Complete Solvynk design system tokens, typography (Inter + JetBrains Mono), responsive grid, badges, and components.
- `detail.css`: BuildTree coverage matrix table (desktop) and card transformation (mobile), Project Passport, screenshot gallery.
- `explore.css`: Live search bar, multi-category filter pills, and empty states.
- `prototype.css`: Flow controls, 4-step wizard, secret scan alert, and admin console styling.
- `accessibility.css`: Skip links, visible focus indicators, and screen-reader utility classes.
- `fixtures.js`: Realistic multi-scenario catalog (Tamil STT, Cauvery Clean Water Kit, WebAssembly Whisper, Android edge tools).
- `app.js` & `prototype.js`: Event routing, save toggle (`localStorage`), outbound interstitial controller, and secret scanner simulation.

---

## 4. Verification

Run syntax checks across all prototype scripts:

```bash
node --check app.js
node --check explore.js
node --check fixtures.js
node --check prototype.js
```

Verify all HTTP routes return `200 OK`:

```bash
curl.exe -I http://localhost:4173/index.html
curl.exe -I http://localhost:4173/explore.html
curl.exe -I http://localhost:4173/problem.html?slug=tamil-voice-recognition
curl.exe -I http://localhost:4173/project.html?slug=kuralvoice
curl.exe -I http://localhost:4173/prototype.html
```

---

## 5. Phase P & Release Gates

- **Phase:** Phase P (Pre-build)
- **Gate M0, M1, M2:** NOT PASSED (Only the founder changes gate status)
- **Implementation Status:** T-001 (Design System) & T-002 (Prototype) verified in Phase P static workspace.
