---
name: design-audit
description: "Anti-slop design and polish guidelines for premium UI/UX, typography, spacing, motion, and accessibility audit"
when_to_use: "Active when reviewing, auditing, polishing, or implementing frontend and mobile UI components to ensure premium aesthetics, correct animation curves, and strict avoidance of generic templates/AI slop."
allowed-tools: Read, Write, Edit
version: 1.0
priority: HIGH
---

# Design Audit & Premium UI Polish (Anti-Slop Protocol)

> **PREMIUM UI/UX SKILL** - Review, audit, and polish UI layouts to eliminate "AI Slop" and enforce high-end design engineering principles (typography, spacing, micro-interactions, animation easing).

---

## Core Philosophy

> *"Design is not just what it looks like and feels like. Design is how it works, how it flows, and how it responds."*

Avoid the "AI Tell" — generic templates, standard button styles, default spacing, and flat animations. Every UI component must feel premium, intentional, and cohesive.

---

## 1. Typography & Hierarchy (The Impeccable Standard)

| Aspect | Rule |
|---|---|
| **Contrast** | Establish clear hierarchy through weight (e.g., SemiBold/Medium for headers, Regular for body, Light/Muted for helper text). |
| **Sizes** | Use a strict type scale (e.g., 12px, 14px, 16px, 18px, 20px, 24px, 32px, 40px). |
| **Line Height** | Always set appropriate line-heights (e.g., `1.2` for headings, `1.5` for body text) to prevent overlap and improve readability. |
| **Font Pairing** | Use a premium modern font family (e.g., *Inter*, *Outfit*, *Roboto*, *Outfit*) and configure proper fallbacks. |
| **No Hardcoded Styles** | Widgets must inherit typography styles from `Theme.of(context).textTheme` or global styles to maintain consistency across themes. |

---

## 2. Spacing, Alignment, & Layout

| Metric | Rule |
|---|---|
| **8px Grid** | All paddings, margins, and gaps must use multiples of 8px (or 4px for tight micro-spacing). Examples: 8, 12, 16, 24, 32, 48. |
| **Alignment** | Align text baselines. Align icon centers with their text. Align card contents cleanly on both axes. |
| **Border Radius** | Consistency is key. Standard Card: `16px`. Button/Input: `12px`. Small chips/badges: `8px`. |
| **Nested Radii** | For elements nested inside cards/containers, use the nested radius formula: $R_{outer} = R_{inner} + Spacing$. |
| **Borders over Shadows** | Prefer subtle, semi-transparent borders (e.g., `Border.all(color: color.withOpacity(0.08))`) instead of heavy elevations or shadows. This gives a premium, flat, modern glassmorphic look. |

---

## 3. Motion & Animation (The Emil Kowalski Rules)

Ensure all animations feel physical, premium, and performant:

*   **Custom Easing Curves**: Never use `linear` or default jerky transitions. Use smooth easing curves (e.g., `Curves.easeOutCubic`, `Curves.easeInOutCubic` or custom cubic-beziers).
*   **Standard Durations**:
    *   *Micro-interactions* (button presses, checkmarks): **150ms - 200ms**
    *   *Layout/Screen Transitions*: **300ms - 400ms**
    *   *Exits/Dismissals*: **150ms - 250ms** (faster for perceived performance)
*   **Staggered Lists**: When animating list items, stagger their fade/slide-in animations by index (e.g., `delay = index * 30ms` or `50ms`) to create a smooth wave effect.
*   **Scale & Fade Combo**: Combined opacity fades with subtle scale transitions (e.g., starting scale `0.96` to `1.0`) to avoid harsh pops.
*   **Perceived Speed**: Always animate exiting elements slightly faster than entering elements to make the interface feel responsive.

---

## 4. Mobile & Touch Conventions (Touch-First)

| Aspect | Target |
|---|---|
| **Touch Targets** | **Minimum 44pt x 44pt (iOS)** and **48dp x 48dp (Android)**. Even if the visual icon is smaller, expand the hit-test area. |
| **Thumb Zone** | Keep primary action buttons and CTAs (Call to Actions) in the lower half of the screen for easy one-handed operation. |
| **Haptic Feedback** | Provide subtle haptic feedback for success actions (e.g., transaction saved) and warning/error states. |
| **Safe Areas** | Always respect status bars, navigation bars, and notch safe-areas on modern devices. |

---

## 5. Design Review commands (/polish & /design-audit)

Use these mental checkpoints when verifying UI code:

### `/polish` Checkpoints (Visual Details):
- [ ] Is there proper typographic contrast between headers, body, and metadata?
- [ ] Are paddings and margins strictly adhering to the 8px/4px grid?
- [ ] Are border radii consistent and nested correctly?
- [ ] Are transitions using non-linear easing and appropriate durations?
- [ ] Are borders used in place of heavy, dirty shadows?

### `/design-audit` Checkpoints (Accessibility & Platform):
- [ ] Are all touch targets $\ge$ 44-48px?
- [ ] Are contrast ratios for text vs. background $\ge$ 4.5:1 (WCAG AA)?
- [ ] Do input fields have clear active/focus, error, and disabled states?
- [ ] Does the screen look correct in both Light Mode and Dark Mode?
- [ ] Are empty states and loading shimmer states designed beautifully instead of simple spinners?
