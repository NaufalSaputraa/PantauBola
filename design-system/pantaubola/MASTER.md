# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** PantauBola
**Generated:** 2026-07-04 11:40:33
**Category:** Analytics Dashboard

---

## Global Rules

### Color Palette

| Role | Light Mode Hex | Dark Mode Hex | CSS Variable |
|------|----------------|---------------|--------------|
| Primary / Accent | `#0071E3` (Apple Blue) | `#0A84FF` (Apple Blue Dark) | `--color-primary` |
| Secondary | `#86868B` (Apple Muted Gray) | `#8E8E93` | `--color-secondary` |
| Background | `#F5F5F7` (Apple Light Gray) | `#000000` (Pure Black) | `--color-background` |
| Card Background | `#FFFFFF` (Pure White) | `#1C1C1E` (Apple System Gray 6) | `--color-card-bg` |
| Text | `#1D1D1F` (Apple Dark Charcoal) | `#F5F5F7` | `--color-text` |
| Border | `#E8E8ED` (Thin Light Gray) | `#2C2C2E` | `--color-border` |

**Color Notes:** Monochromatic base with premium Apple system accents (blue, soft green for predictions, soft red for losses). Clean off-white and pure black base to keep contrast crisp.

### Typography

- **Heading Font:** Outfit (fallback for SF Pro Display)
- **Body Font:** Inter (fallback for SF Pro Text)
- **Mood:** Clean, Minimal, Sophisticated, Tech-forward, Spacious
- **Google Fonts:** [Outfit + Inter](https://fonts.google.com/share?selection.family=Outfit:wght@300;400;500;600;700|Inter:wght@300;400;500;600;700)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
```

### Spacing Tokens
- Standardized spacing scales matching Apple iOS layout guidelines:
  - Tight: `0.5rem` (8px)
  - Normal Card Gap: `1rem` (16px) or `1.5rem` (24px)
  - Section Spacing: `2.5rem` (40px) or `3rem` (48px)
  - Page Container Max Width: `1200px` (`max-w-7xl` or `max-w-6xl`)

---

## Component Specs

### Buttons (Apple Pill Style)

```css
/* Primary Pill Button */
.btn-pill-primary {
  background: var(--color-primary);
  color: white;
  padding: 10px 22px;
  border-radius: 9999px; /* Pill shaped */
  font-weight: 500;
  font-size: 14px;
  transition: all 200ms cubic-bezier(0.25, 0.1, 0.25, 1);
  cursor: pointer;
}

.btn-pill-primary:hover {
  opacity: 0.92;
  transform: scale(1.02);
}

.btn-pill-primary:active {
  transform: scale(0.98);
}

/* Secondary / Outline Button */
.btn-pill-secondary {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: 10px 22px;
  border-radius: 9999px;
  font-weight: 500;
  font-size: 14px;
  transition: all 200ms cubic-bezier(0.25, 0.1, 0.25, 1);
  cursor: pointer;
}

.btn-pill-secondary:hover {
  background: rgba(0, 0, 0, 0.03);
  border-color: var(--color-text);
}
```

### Cards (Apple Rounded Cards)

```css
.card-apple {
  background: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: 20px; /* Apple Widget style rounded corner */
  padding: 24px;
  transition: all 300ms cubic-bezier(0.25, 1, 0.5, 1);
}

.card-apple:hover {
  border-color: var(--color-secondary);
  box-shadow: 0 8px 30px rgba(0,0,0,0.04);
  transform: scale(1.005);
}
```

### Navigation Bar (Frosted Glass Effect)

```css
.navbar-apple {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.72); /* Light Mode */
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.dark .navbar-apple {
  background: rgba(0, 0, 0, 0.72); /* Dark Mode */
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
```

---

## Style Guidelines

**Style:** Apple Minimalist & Swiss Grid

- **Layout Structure**: 
  - Floating layouts, generous margins, grid alignment.
  - No harsh dark shadows, no unnecessary colorful background sections.
  - Focus strictly on content (typography, statistics, and chart visualizations).
- **Data Visualization Styling**:
  - Recharts radar and bar charts with minimal gridlines.
  - Use thin neutral lines (`#E8E8ED` or `#2C2C2E`) and single-color fills with high opacity/transparency.
- **Micro-interactions**:
  - Smooth custom transitions using standard cubic-bezier curves `cubic-bezier(0.25, 0.1, 0.25, 1)` or CSS transitions.
  - Hover states should slightly dim or expand borders, never jump text size.


---

## Anti-Patterns (Do NOT Use)

- ❌ Ornate design
- ❌ No filtering

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
