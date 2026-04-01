/**
 * Component Catalog — Universal UI component registry
 *
 * Data lives in catalog.json; this module loads it, applies defaults,
 * and re-exports the same typed API.
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Types ────────────────────────────────────────────

export type AtomicLevel = "atom" | "molecule" | "organism" | "template";

export interface CatalogComponent {
  /** PascalCase name used in specs and codegen */
  name: string;
  /** Display slug (kebab-case) */
  slug: string;
  /** Atomic Design level */
  level: AtomicLevel;
  /** Category group for dashboard display */
  category: CatalogCategory;
  /** One-line description */
  description: string;
  /** Alternate names across design systems */
  aliases: string[];
  /** shadcn/ui base components this maps to (empty = custom) */
  shadcnBase: string[];
  /** Default variants for spec scaffolding */
  variants: string[];
  /** Default prop definitions */
  props: Record<string, string>;
  /** Accessibility defaults */
  a11y: { role?: string; ariaLabel?: string };
  /** How many design systems include this (from component.gallery) */
  prevalence: number;
}

export type CatalogCategory =
  | "buttons"
  | "inputs"
  | "data-display"
  | "feedback"
  | "navigation"
  | "layout"
  | "overlays"
  | "media"
  | "typography";

// ── Category metadata ────────────────────────────────

export const CATALOG_CATEGORIES: Record<CatalogCategory, { label: string; description: string }> = {
  buttons:        { label: "Buttons",       description: "Actions, triggers, and interactive controls" },
  inputs:         { label: "Inputs",        description: "Form controls for collecting user data" },
  "data-display": { label: "Data Display",  description: "Components for presenting information and content" },
  feedback:       { label: "Feedback",      description: "Status indicators, loading states, and user notifications" },
  navigation:     { label: "Navigation",    description: "Wayfinding, menus, and page structure" },
  layout:         { label: "Layout",        description: "Structural components for page composition" },
  overlays:       { label: "Overlays",      description: "Modals, popovers, drawers, and floating content" },
  media:          { label: "Media",         description: "Images, icons, video, and rich content" },
  typography:     { label: "Typography",    description: "Text elements, headings, and content formatting" },
};

// ── Load and hydrate catalog data ────────────────────

type RawEntry = Partial<CatalogComponent> & Pick<CatalogComponent, "name" | "slug" | "level" | "category" | "description" | "prevalence" | "props">;

const raw: RawEntry[] = JSON.parse(readFileSync(join(__dir, "catalog.json"), "utf-8"));

export const COMPONENT_CATALOG: CatalogComponent[] = raw.map(r => ({
  aliases: [],
  shadcnBase: [],
  variants: [],
  a11y: {},
  ...r,
}));

// ── Helpers ──────────────────────────────────────────

/** Get all components in a category */
export function getCatalogByCategory(cat: CatalogCategory): CatalogComponent[] {
  return COMPONENT_CATALOG.filter(c => c.category === cat);
}

/** Lookup by slug or name (case-insensitive) */
export function findCatalogComponent(query: string): CatalogComponent | undefined {
  const q = query.toLowerCase();
  return COMPONENT_CATALOG.find(
    c => c.slug === q || c.name.toLowerCase() === q || c.aliases.some(a => a.toLowerCase() === q)
  );
}

/** Get all shadcn-mapped components */
export function getShadcnMapped(): CatalogComponent[] {
  return COMPONENT_CATALOG.filter(c => c.shadcnBase.length > 0);
}

/** Get components by atomic level */
export function getCatalogByLevel(level: AtomicLevel): CatalogComponent[] {
  return COMPONENT_CATALOG.filter(c => c.level === level);
}

/** Summary counts */
export function getCatalogStats() {
  const atoms = COMPONENT_CATALOG.filter(c => c.level === "atom").length;
  const molecules = COMPONENT_CATALOG.filter(c => c.level === "molecule").length;
  const organisms = COMPONENT_CATALOG.filter(c => c.level === "organism").length;
  const shadcn = getShadcnMapped().length;
  return { total: COMPONENT_CATALOG.length, atoms, molecules, organisms, shadcn };
}
