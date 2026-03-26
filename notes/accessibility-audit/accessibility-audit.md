---
name: Accessibility Audit
description: >
  WCAG 2.2 AA/AAA compliance auditing for design systems and generated components.
  Covers color contrast, keyboard navigation, screen reader compatibility, focus
  management, motion sensitivity, and semantic structure. Outputs actionable
  findings with severity and remediation steps.
activateOn: design-review
freedomLevel: read-only
category: research
tags:
  - accessibility
  - wcag
  - a11y
  - screen-reader
  - color-contrast
  - keyboard-nav
  - aria
---

# Accessibility Audit — Memoire Research Skill

Systematic WCAG 2.2 compliance checks for Figma designs and generated code.
Produces structured findings that feed back into specs and codegen.

---

## Audit Checklist

### 1. Color Contrast (WCAG 1.4.3 / 1.4.6)

| Check | AA Threshold | AAA Threshold |
|-------|-------------|---------------|
| Normal text (< 18px) | 4.5:1 | 7:1 |
| Large text (>= 18px or 14px bold) | 3:1 | 4.5:1 |
| UI components & graphics | 3:1 | 3:1 |
| Focus indicators | 3:1 | — |

**How to audit:**
- Extract color tokens from design system
- For each foreground/background pair, compute contrast ratio
- Flag pairs below threshold with severity (error for AA fail, warning for AAA fail)
- Check all component variants (hover, active, disabled, focus states)

**Contrast ratio formula:**
```
ratio = (L1 + 0.05) / (L2 + 0.05)
where L1 = lighter relative luminance, L2 = darker
```

### 2. Keyboard Navigation (WCAG 2.1.1 / 2.4.7)

| Element | Required | Notes |
|---------|----------|-------|
| Buttons | Tab + Enter/Space | `role="button"` if not `<button>` |
| Links | Tab + Enter | Visible focus ring |
| Inputs | Tab | Clear label association |
| Modals | Trap focus inside | Escape to close |
| Menus | Arrow keys | `role="menu"`, `role="menuitem"` |
| Tabs | Arrow keys within, Tab to panel | `role="tablist"` |
| Dropdowns | Arrow keys, Escape | `aria-expanded` |

**Audit steps:**
1. Tab through every interactive element — verify logical order
2. Verify focus ring is visible (min 2px, contrasts with background)
3. Verify Escape closes overlays
4. Verify no keyboard traps (can always Tab out of non-modal elements)

### 3. Screen Reader (WCAG 4.1.2)

| Pattern | Required ARIA |
|---------|--------------|
| Icon-only button | `aria-label` |
| Image | `alt` text (or `role="presentation"`) |
| Form field | `<label>` or `aria-label` |
| Live region | `aria-live="polite"` or `"assertive"` |
| Loading state | `aria-busy="true"` |
| Error message | `aria-describedby` linking to error |
| Expandable | `aria-expanded` |
| Selected state | `aria-selected` or `aria-current` |

### 4. Focus Management (WCAG 2.4.3)

- **Modal open**: Move focus to first focusable element inside
- **Modal close**: Return focus to trigger element
- **Page navigation**: Move focus to main content or heading
- **Dynamic content**: Announce changes with `aria-live`
- **Skip links**: Provide "Skip to main content" as first focusable

### 5. Motion & Animation (WCAG 2.3.1 / 2.3.3)

- Respect `prefers-reduced-motion: reduce`
- No content flashes more than 3 times per second
- Auto-playing animations must have pause/stop controls
- Parallax and scroll-linked animations need reduced-motion alternative

### 6. Semantic Structure (WCAG 1.3.1)

- One `<h1>` per page
- Heading levels don't skip (h1 > h2 > h3, not h1 > h3)
- Lists use `<ul>/<ol>/<dl>`, not styled divs
- Tables have `<th>` headers with `scope`
- Landmarks: `<main>`, `<nav>`, `<aside>`, `<header>`, `<footer>`

---

## Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| **Critical** | Blocks access for disabled users | Must fix before ship |
| **Major** | Significant barrier, workaround exists | Fix in current sprint |
| **Minor** | Degraded experience, not a blocker | Fix in backlog |
| **Info** | Best practice improvement | Track for next iteration |

## Output Format

Each finding should produce:

```json
{
  "id": "a11y-001",
  "rule": "WCAG 1.4.3",
  "severity": "critical",
  "component": "StatusBadge",
  "element": "badge text on green background",
  "issue": "Contrast ratio 2.8:1 — below 4.5:1 AA threshold",
  "remediation": "Darken text to #1a472a or lighten background",
  "effort": "low"
}
```

## Integration with Memoire

- Findings map to spec `accessibility` field updates
- Critical/Major issues block codegen (emit warning)
- Color contrast findings update design token recommendations
- Keyboard nav findings add to component `keyboardNav` spec property
