# 08 — UI & UX Specification Proposal

Status: **PROPOSAL ONLY — NOT AUTHORITATIVE (Awaiting Founder Review)**

This document provides the proposed design specification for Solvynk (working name) in Phase P, covering the design system, component contracts, responsive layout rules, the BuildTree coverage matrix, and accessibility requirements.

---

## 1. Visual Direction & Palette Tokens

Solvynk uses a dark, technically dense, high-contrast visual architecture.

```css
:root {
  /* Canvas Surfaces */
  --canvas-base: #0B0F16;
  --canvas-nav: #101722;
  --canvas-card: #151E2B;
  --canvas-raised: #1D2939;
  --canvas-sunken: #080B10;

  /* Borders */
  --border-subtle: #202B3B;
  --border-default: #303E52;
  --border-hover: #455770;
  --border-focus: #58A6FF;

  /* Typography */
  --text-primary: #EDF3FA;
  --text-secondary: #A9B9CE;
  --text-muted: #6C7D93;
  --text-disabled: #435164;

  /* Brand Accents */
  --accent-primary: #58A6FF;
  --accent-primary-hover: #79B8FF;
  --accent-primary-subtle: rgba(88, 166, 255, 0.12);
  --accent-secondary: #A78BFA;
  --accent-secondary-subtle: rgba(167, 139, 250, 0.12);

  /* Semantic Statuses */
  --status-success: #3FC995;
  --status-success-bg: rgba(63, 201, 149, 0.12);
  --status-warning: #F0B45E;
  --status-warning-bg: rgba(240, 180, 94, 0.12);
  --status-error: #F16F78;
  --status-error-bg: rgba(241, 111, 120, 0.12);
  --status-neutral: #8B949E;
  --status-neutral-bg: rgba(139, 148, 158, 0.12);
}
```

---

## 2. Typography Scale

- **Primary Interface:** Modern Sans-Serif (`Inter` or `Plus Jakarta Sans`)
- **Code & Repository Facts:** Monospace (`JetBrains Mono` or `DM Mono`)

| Token | Size | Line Height | Weight | Letter Spacing |
|---|---|---|---|---|
| `display-lg` | 36px | 1.15 | 800 | -0.025em |
| `heading-xl` | 28px | 1.25 | 700 | -0.02em |
| `heading-lg` | 22px | 1.30 | 600 | -0.015em |
| `heading-md` | 18px | 1.35 | 600 | -0.01em |
| `body-md` | 15px | 1.55 | 400 | normal |
| `body-sm` | 13px | 1.50 | 400 | normal |
| `mono-sm` | 13px | 1.40 | 500 | 0.01em |
| `caption` | 12px | 1.40 | 500 | 0.02em |

---

## 3. Core Component Library

1. **Navigation:** Sidebar navigation rail (desktop) / Bottom navigation bar (mobile) / Breadcrumb headers.
2. **Project Card:** Stage badge (`Released`, `Working Demo`, `Prototype`, `Idea`), Source badge (`Public GitHub`, `Private Source`), Cover visual/screenshot, one-line value statement, creator attribution.
3. **Problem Card:** Numbered requirements count, build window timeline, solution count, category pill, owner attribution.
4. **BuildTree Coverage Matrix:**
   - Rows: Independent solutions.
   - Columns: R1..Rn numbered requirements.
   - Visual indicators: Both symbol + text + color (never color alone):
     - `✓ Confirmed`: Green background + checkmark + "Confirmed".
     - `◒ Claimed`: Amber background + half-circle + "Claimed".
     - `✕ Not Claimed`: Neutral gray outline + dash + "Not Claimed".
5. **Outbound Safety Interstitial (`/out/[linkId]`):** Destination domain banner, Web Risk status, clear user warning, no open redirect.
6. **Secret Scan Feedback:** Inline blocking alerts for API keys, AWS credentials, and tokens.

---

## 4. Accessibility (WCAG 2.2 AA)

- 4.5:1 minimum contrast for normal text; 3:1 for large text and interactive boundaries.
- Visible focus rings (`outline: 2px solid var(--border-focus); outline-offset: 2px`).
- Touch targets ≥ 44×44px on mobile devices.
- `prefers-reduced-motion` suppresses all non-essential transitions.
- Screen reader announcements (`aria-live="polite"`) for autosave, filters, and dynamic counts.
