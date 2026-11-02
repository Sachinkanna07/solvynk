# Solvynk — Interactive Prototype (Phase P)

**Tagline:** Real Problems. Independent Solutions. Lasting Proof of Work.
**Working Name:** Solvynk (trademark & clearance pending)
**Phase:** Phase P (Pre-build) · Prototype & Validation Track

---

## 1. Overview

This directory contains the **Solvynk Frontend Prototype Workspace**, built with vanilla HTML, semantic CSS variables, and modern JavaScript. It embodies the dark, technically credible, developer-first aesthetic inspired by GitHub's technical density and modern software portfolios.

### Key Capabilities Demonstrated:
- **BuildTree Solution Matrix:** Independent software projects mapped against numbered requirements (R1–R8) showing `✓ Confirmed`, `◒ Claimed`, `✕ Not Claimed`, and owner reviews.
- **Project Passport demonstration:** Fixture labels distinguish GitHub-style repository facts from creator-declared engineering facts. There is no live GitHub verification yet.
- **Outbound-link interstitial demonstration:** A static advisory presents the destination. There is no live Web Risk check yet.
- **Builder Studio (4-Step Flow):** Source selection (GitHub vs. Manual), engineering facts, screenshot arranger, and pre-publish secret scanning guardrails (SI-17).
- **Admin Operational Console:** Emergency safety kill switches and beta pre-moderation queue.
- **Accessibility foundation:** Contrast tokens, visible focus rings, non-color-only statuses, and reduced-motion styles are present. WCAG 2.2 AA conformance still requires component and browser testing.

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

- `packages/ui`: Shared tokens, CSS primitives, and accessibility utilities used by the prototype. Inter and JetBrains Mono are served locally from `assets/fonts` under OFL licenses.
- `styles.css`: Prototype layout and visual composition built on the shared tokens and components.
- `detail.css`: BuildTree coverage matrix table (desktop) and card transformation (mobile), Project Passport, screenshot gallery.
- `explore.css`: Live search bar, multi-category filter pills, and empty states.
- `prototype.css`: Flow controls, 4-step wizard, secret scan alert, and admin console styling.
- `accessibility.css`: Imports the shared skip-link, focus, reduced-motion, and touch-target utilities.
- `fixtures.js`: Realistic multi-scenario catalog (Tamil STT, Cauvery Clean Water Kit, WebAssembly Whisper, Android edge tools).
- `app.js` & `prototype.js`: Event routing, save toggle (`localStorage`), outbound interstitial controller, and secret scanner simulation.

---

## 4. Verification

Run the T-001 browser, keyboard, responsive, and axe-core checks using installed Chrome:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
```

The browser tests save 15 review screenshots in `artifacts/t001/`, covering seven homepage widths and mobile/desktop views of Explore, problem detail, project detail, and Studio. Automated axe checks are not a substitute for manual screen-reader review.

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
- **Implementation Status:** T-001 and T-002 have prototype candidates under review. They are not accepted or production-verified.
