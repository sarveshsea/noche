# Component Catalog — Universal UI Registry

## Purpose
Memoire ships with a pre-loaded catalog of 56 universal UI components derived from industry convention (component.gallery taxonomy). Every component is classified by Atomic Design level, mapped to shadcn/ui primitives where available, and grouped into categories. This catalog serves as the foundation for spec generation, code scaffolding, and design system audits.

## When to Load
- Creating new component specs (use catalog as starting point)
- Auditing a design system for completeness
- Mapping Figma components to code
- Generating a component library from scratch
- Answering "what components should we have?"

## Catalog Location
`src/specs/catalog.ts` — exports `COMPONENT_CATALOG`, category definitions, and helper functions.

## Categories (9)

| Category | Components | Purpose |
|----------|-----------|---------|
| **Buttons** | Button, ButtonGroup, IconButton, Toggle, SegmentedControl, Stepper | Actions and interactive controls |
| **Inputs** | TextInput, Textarea, SearchInput, Select, Combobox, Checkbox, RadioButton, Slider, DateInput, Datepicker, ColorPicker, FileUpload, Label, Fieldset, Form, Rating, RichTextEditor | Form controls |
| **Data Display** | Badge, Avatar, Card, Table, List, File, Skeleton, Separator, Quote | Presenting information |
| **Feedback** | Alert, Toast, ProgressBar, ProgressIndicator, Spinner, EmptyState | Status and notifications |
| **Navigation** | Navigation, Breadcrumbs, Tabs, Pagination, Link, SkipLink, TreeView | Wayfinding |
| **Overlays** | Modal, Drawer, Popover, Tooltip, DropdownMenu | Floating content |
| **Layout** | Accordion, Carousel, Header, Footer, Hero, Stack, VisuallyHidden | Page structure |
| **Media** | Image, Icon, Video | Rich content |
| **Typography** | Heading | Text elements |

## Atomic Distribution

| Level | Count | Rule |
|-------|-------|------|
| Atom | ~22 | Standalone primitives. `composesSpecs` must be empty. |
| Molecule | ~22 | Composes 2-5 atoms. |
| Organism | ~12 | Composes molecules + atoms, manages state. |

## shadcn/ui Mapping

The following catalog components have direct shadcn/ui mappings:

| Catalog | shadcn/ui |
|---------|-----------|
| Button, IconButton, ButtonGroup | Button |
| Toggle | Switch |
| SegmentedControl, Tabs | Tabs |
| TextInput, SearchInput, DateInput | Input |
| Textarea | Textarea |
| Select | Select |
| Checkbox | Checkbox |
| Label | Label |
| Badge | Badge |
| Avatar | Avatar |
| Card, File, EmptyState, Hero | Card |
| Table | Table |
| Skeleton | Skeleton |
| Separator | Separator |
| Tooltip | Tooltip |
| DropdownMenu | DropdownMenu |
| Modal | Dialog |
| Drawer | Sheet |
| ProgressBar | Progress |
| Stepper | Button + Input |
| Combobox | Input + Select |
| Pagination | Button |

Components without shadcn mapping (Accordion, Carousel, Navigation, etc.) generate custom implementations using Tailwind.

## How to Use the Catalog

### 1. Scaffold a spec from catalog
```typescript
import { findCatalogComponent } from "../specs/catalog.js";

const entry = findCatalogComponent("datepicker");
// Returns full CatalogComponent with level, props, variants, shadcnBase
// Use as starting point for ComponentSpec
```

### 2. Audit completeness
```typescript
import { COMPONENT_CATALOG, getCatalogByCategory } from "../specs/catalog.js";

const missing = COMPONENT_CATALOG.filter(c =>
  !registry.hasSpec(c.name)
);
// Shows which catalog components are not yet specced
```

### 3. Generate from catalog entry
When creating a spec, pre-fill from the catalog:
- `level` — use catalog's atomic level
- `shadcnBase` — use catalog's mapping
- `variants` — use catalog's defaults
- `props` — use catalog's prop definitions
- `accessibility` — use catalog's a11y defaults

### 4. Dashboard display
The design-system.html COMPONENTS tab renders all catalog entries grouped by category, with live previews, atomic badges, and variant counts.

## Rules

1. **Catalog is the baseline** — every project should eventually spec all 56 components
2. **Aliases resolve** — `findCatalogComponent("Dialog")` finds Modal, `"Switch"` finds Toggle
3. **Prevalence = priority** — higher prevalence = more design systems use it = implement first
4. **shadcn first** — if a catalog component has a shadcn mapping, use it. Don't build custom.
5. **Extend, don't fork** — add project-specific components alongside catalog components, never replace them
