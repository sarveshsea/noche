---
name: token-architecture
description: Design token architecture -- multi-tier token systems, semantic naming, theme switching, CSS custom properties, Tailwind mapping, and Figma variable sync
category: craft
activateOn: component-creation
freedomLevel: high
tags: [design-tokens, theming, css-variables, tailwind, figma-variables, semantic-tokens]
version: 1.0.0
---

# Token Architecture -- Multi-Tier Design Token System

A structured approach to design tokens that scales across platforms, themes, and teams. Tokens are the single source of truth connecting Figma variables, CSS custom properties, Tailwind config, and native platform code.

---

## The Three-Tier Model

```
Tier 1: Global Tokens (primitives)
  --blue-500: #3b82f6
  --space-4: 1rem
  --radius-md: 8px

Tier 2: Alias Tokens (semantic)
  --color-primary: var(--blue-500)
  --spacing-component: var(--space-4)
  --radius-default: var(--radius-md)

Tier 3: Component Tokens (scoped)
  --button-bg: var(--color-primary)
  --card-padding: var(--spacing-component)
  --input-radius: var(--radius-default)
```

### Why Three Tiers

| Tier | Audience | Changes When |
|------|----------|-------------|
| Global | Token authors | Color palette evolves, spacing scale changes |
| Alias | Theme authors | New theme added, brand refresh |
| Component | Component authors | Component API changes |

A button never references `--blue-500` directly. It references `--button-bg`, which resolves through `--color-primary` to `--blue-500`. Changing the brand color only requires updating the alias tier.

---

## Semantic Naming Conventions

### Pattern

```
--{category}-{property}-{element}-{variant}-{state}
```

All segments after `category` are optional. Omit segments that do not apply.

### Categories

| Category | Purpose | Examples |
|----------|---------|---------|
| `color` | All color values | `--color-bg-primary`, `--color-text-muted` |
| `spacing` | Margins, paddings, gaps | `--spacing-sm`, `--spacing-page-x` |
| `radius` | Border radii | `--radius-sm`, `--radius-full` |
| `shadow` | Box shadows | `--shadow-sm`, `--shadow-overlay` |
| `font` | Font families | `--font-sans`, `--font-mono` |
| `text` | Font sizes, weights, line heights | `--text-sm`, `--text-heading-weight` |
| `motion` | Durations, easings | `--motion-fast`, `--motion-ease-out` |
| `z` | Z-index layers | `--z-dropdown`, `--z-modal`, `--z-toast` |
| `size` | Fixed dimensions | `--size-icon-sm`, `--size-avatar-lg` |

### Naming Rules

1. Use lowercase kebab-case exclusively
2. No raw values in names (`--color-blue` is wrong; `--color-primary` is correct)
3. State suffixes: `-hover`, `-active`, `-disabled`, `-focus`
4. Variant suffixes: `-muted`, `-subtle`, `-inverse`
5. Scale suffixes when needed: `-xs`, `-sm`, `-md`, `-lg`, `-xl`, `-2xl`

---

## Theme Switching

### CSS Custom Properties Approach

```css
/* Base theme (light) */
:root {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-border-default: #e2e8f0;
  --color-accent: #3b82f6;
}

/* Dark theme */
.dark {
  --color-bg-primary: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-border-default: #334155;
  --color-accent: #60a5fa;
}

/* Brand variant */
.brand-b {
  --color-accent: #8b5cf6;
  --color-bg-primary: #faf5ff;
}
```

### Theme Toggle Implementation

```typescript
function setTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(prefersDark ? 'dark' : 'light');
  } else {
    root.classList.add(theme);
  }

  localStorage.setItem('theme', theme);
}
```

---

## Token Export Formats

### 1. CSS Custom Properties

```css
:root {
  /* Global */
  --blue-50: #eff6ff;
  --blue-500: #3b82f6;
  --blue-900: #1e3a5f;

  /* Alias */
  --color-primary: var(--blue-500);
  --color-primary-hover: var(--blue-600);

  /* Component */
  --button-bg: var(--color-primary);
  --button-bg-hover: var(--color-primary-hover);
}
```

### 2. Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius-default)',
        sm: 'var(--radius-sm)',
        lg: 'var(--radius-lg)',
      },
      spacing: {
        'component': 'var(--spacing-component)',
        'page-x': 'var(--spacing-page-x)',
      },
    },
  },
};
```

### 3. JSON (W3C Design Token Format)

```json
{
  "color": {
    "primary": {
      "$value": "{blue.500}",
      "$type": "color",
      "$description": "Primary brand color"
    },
    "bg": {
      "primary": {
        "$value": "#ffffff",
        "$type": "color"
      }
    }
  },
  "spacing": {
    "sm": { "$value": "0.5rem", "$type": "dimension" },
    "md": { "$value": "1rem", "$type": "dimension" }
  }
}
```

### 4. Dart (Flutter ThemeExtension)

```dart
class AppTokens extends ThemeExtension<AppTokens> {
  final Color colorPrimary;
  final Color colorBgPrimary;
  final double spacingSm;
  final double spacingMd;
  final double radiusDefault;

  const AppTokens({
    this.colorPrimary = const Color(0xFF3B82F6),
    this.colorBgPrimary = const Color(0xFFFFFFFF),
    this.spacingSm = 4.0,
    this.spacingMd = 8.0,
    this.radiusDefault = 8.0,
  });

  // copyWith and lerp omitted for brevity
}
```

---

## Token Governance

### Deprecation Protocol

1. Mark token as deprecated with `$deprecated` flag and migration target
2. Add console warning in dev builds when deprecated token is used
3. Maintain deprecated token for 2 release cycles minimum
4. Remove after migration verified across all consumers

```json
{
  "color-brand": {
    "$value": "{color.primary}",
    "$deprecated": true,
    "$deprecatedMessage": "Use color.primary instead. Removal in v3.0."
  }
}
```

### Versioning

- Tokens follow semver: `MAJOR.MINOR.PATCH`
- Adding a token: minor bump
- Renaming or removing a token: major bump
- Changing a value within the same semantic intent: patch bump

### Review Checklist

- [ ] Token name follows semantic naming convention
- [ ] Token exists at the correct tier (global / alias / component)
- [ ] No hardcoded values bypass the token system
- [ ] Dark theme and brand variants are defined
- [ ] Token is documented with `$description`

---

## Cross-Platform Distribution

| Platform | Format | Tooling |
|----------|--------|---------|
| Web | CSS custom properties | PostCSS, Tailwind |
| iOS | Swift `enum` / asset catalog | Style Dictionary |
| Android | XML resources / Compose `Color` | Style Dictionary |
| Flutter | Dart `ThemeExtension` | Custom transformer |
| React Native | JS module | Style Dictionary |

Use Style Dictionary or a custom Memoire transformer to generate platform outputs from the canonical W3C JSON token file.

---

## Integration with Figma Variables

### Sync Direction

```
Figma Variables  <-->  Token JSON  -->  Platform Outputs
     (source)         (canonical)       (CSS, Tailwind, Dart)
```

### Variable Collection Mapping

| Figma Collection | Token Tier | Purpose |
|-----------------|-----------|---------|
| Primitives | Global | Raw palette, scale values |
| Semantic | Alias | Theme-aware references |
| Component | Component | Scoped overrides |

### Sync Workflow

1. `memi tokens pull` -- extract Figma variables to token JSON
2. Validate against token schema (Zod)
3. Run transformers to generate platform outputs
4. `memi tokens push` -- update Figma variables from token JSON (if canonical source is code)

### Conflict Resolution

- Figma wins for visual design decisions (colors, spacing, type scale)
- Code wins for platform-specific values (z-index, motion timing, breakpoints)
- Both changes flagged for manual review in `memi tokens diff`

---

## Design-Dev Handoff via Tokens

Tokens eliminate ambiguity in handoff. Designers reference token names, not raw values.

### Handoff Checklist

1. Every color in the design maps to an alias or component token
2. Every spacing value maps to a spacing token
3. Every text style maps to a typography token
4. Component specs reference token names, not pixel/hex values
5. Theme variants (light/dark) are defined and previewed
6. Token changelog is included with the design update
