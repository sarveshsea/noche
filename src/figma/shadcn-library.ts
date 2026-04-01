/**
 * shadcn/ui Library for Figma — The complete mapping layer.
 *
 * This module defines a complete shadcn/ui component library, translating
 * each component's design specifications into Figma node structures.
 * Every component includes accurate sizing, layout specs, color tokens,
 * typography, and all variants with full Figma node tree definitions.
 *
 * The library is the source of truth for converting shadcn specs into
 * Figma designs, supporting both automated design generation and
 * visual component galleries.
 */

// ── Type Definitions ────────────────────────────────────────────

/**
 * Recursive structure describing how to build a Figma component.
 * Maps directly to the Figma Plugin API's node creation model.
 */
export interface FigmaNodeSpec {
  type:
    | "FRAME"
    | "TEXT"
    | "RECTANGLE"
    | "ELLIPSE"
    | "COMPONENT"
    | "INSTANCE"
    | "GROUP";
  name: string;

  // Auto-layout configuration
  layout?: {
    mode: "HORIZONTAL" | "VERTICAL" | "NONE";
    padding?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    gap?: number;
    sizing?: {
      width: "FIXED" | "HUG" | "FILL";
      height: "FIXED" | "HUG" | "FILL";
    };
    alignment?: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
    counterAlignment?: "MIN" | "CENTER" | "MAX";
  };

  // Dimensions
  size?: {
    width: number;
    height: number;
  };

  // Visual styling
  style?: {
    fill?: string; // hex color or token reference
    stroke?: string;
    strokeWidth?: number;
    cornerRadius?: number | CornerRadiusObject;
    opacity?: number;
    shadow?: ShadowSpec[];
  };

  // Text node content
  text?: {
    content: string;
    fontSize: number;
    fontWeight: number;
    fontFamily: string;
    color: string;
    lineHeight?: number;
    letterSpacing?: number;
  };

  // Nested children
  children?: FigmaNodeSpec[];
}

interface CornerRadiusObject {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

interface ShadowSpec {
  x: number;
  y: number;
  blur: number;
  spread?: number;
  color: string;
}

export interface ShadcnVariant {
  name: string;
  label: string;
  description?: string;
  properties: Record<string, unknown>;
  preview: {
    width: number;
    height: number;
  };
}

/**
 * Complete definition of a shadcn/ui component for Figma.
 * Includes visual specs, all variants, React code snippet, and Figma structure.
 */
export interface ShadcnFigmaComponent {
  // Identity
  name: string; // e.g. "Button"
  category:
    | "input"
    | "display"
    | "layout"
    | "feedback"
    | "navigation"
    | "data";
  description: string;

  // Variants and defaults
  variants: ShadcnVariant[];
  defaultProps: Record<string, unknown>;

  // Figma integration
  figmaStructure: FigmaNodeSpec;
  codeSnippet: string; // React code for dev mode
  importPath: string; // @/components/ui/button

  // Metadata
  tags: string[];
  notes: string[];
}

// ── Color Tokens ────────────────────────────────────────────────

export const SHADCN_COLORS = {
  background: "#ffffff",
  foreground: "#09090b",
  card: "#ffffff",
  cardForeground: "#09090b",
  popover: "#ffffff",
  popoverForeground: "#09090b",
  primary: "#18181b",
  primaryForeground: "#fafafa",
  secondary: "#f4f4f5",
  secondaryForeground: "#18181b",
  muted: "#f4f4f5",
  mutedForeground: "#71717a",
  accent: "#f4f4f5",
  accentForeground: "#18181b",
  destructive: "#ef4444",
  destructiveForeground: "#fafafa",
  border: "#e4e4e7",
  input: "#e4e4e7",
  ring: "#18181b",
};

export const SHADCN_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
};

export const SHADCN_RADIUS = 8; // 0.5rem in px
export const SHADCN_TYPOGRAPHY = {
  fontFamily: "Inter, system-ui, sans-serif",
  xs: { fontSize: 12, fontWeight: 400, lineHeight: 16 },
  sm: { fontSize: 14, fontWeight: 400, lineHeight: 20 },
  base: { fontSize: 14, fontWeight: 400, lineHeight: 20 },
  lg: { fontSize: 18, fontWeight: 600, lineHeight: 28 },
  xl: { fontSize: 20, fontWeight: 600, lineHeight: 28 },
  "2xl": { fontSize: 24, fontWeight: 700, lineHeight: 32 },
};

// ── Figma Node Helpers ──────────────────────────────────────────

function rect(
  name: string,
  width: number,
  height: number,
  fill: string,
  radius = SHADCN_RADIUS
): FigmaNodeSpec {
  return {
    type: "RECTANGLE",
    name,
    size: { width, height },
    style: { fill, cornerRadius: radius },
  };
}

function text(
  name: string,
  content: string,
  fontSize: number,
  fontWeight: number,
  color: string
): FigmaNodeSpec {
  return {
    type: "TEXT",
    name,
    text: {
      content,
      fontSize,
      fontWeight,
      fontFamily: SHADCN_TYPOGRAPHY.fontFamily,
      color,
      lineHeight: fontSize * 1.4,
    },
  };
}

function frame(
  name: string,
  width: number,
  height: number,
  layout: "HORIZONTAL" | "VERTICAL" | "NONE" = "VERTICAL",
  padding = SHADCN_SPACING.md,
  gap = SHADCN_SPACING.sm,
  fill?: string
): FigmaNodeSpec {
  const spec: FigmaNodeSpec = {
    type: "FRAME",
    name,
    size: { width, height },
    layout:
      layout !== "NONE"
        ? {
            mode: layout,
            padding: { top: padding, right: padding, bottom: padding, left: padding },
            gap,
            sizing: { width: "FIXED", height: "FIXED" },
          }
        : undefined,
  };

  if (fill) {
    spec.style = { fill, cornerRadius: SHADCN_RADIUS };
  }

  return spec;
}

// ── Compact Component Factory ───────────────────────────────────

interface CompactComponentDef {
  name: string;
  category: ShadcnFigmaComponent["category"];
  description: string;
  variants: ShadcnVariant[];
  defaultProps: Record<string, unknown>;
  figmaStructure: FigmaNodeSpec;
  importPath: string;
  tags: string[];
  notes: string[];
}

/** Variant shorthand: [name, label, description, properties, width, height] */
type V = [string, string, string, Record<string, unknown>, number, number];

function v(variants: V[]): ShadcnVariant[] {
  return variants.map(([name, label, description, properties, width, height]) => ({
    name,
    label,
    description,
    properties,
    preview: { width, height },
  }));
}

function comp(def: CompactComponentDef): ShadcnFigmaComponent {
  return {
    ...def,
    codeSnippet: `import { ${def.name} } from "${def.importPath}"`,
  };
}

// ── Component Definitions ───────────────────────────────────────

const C = SHADCN_COLORS;
const S = SHADCN_SPACING;

const COMPONENTS: CompactComponentDef[] = [
  {
    name: "Button",
    category: "input",
    description: "Interactive button with multiple variants and sizes, built on shadcn/ui",
    variants: v([
      ["default-default", "Default / Default", "Primary action button, default size", { variant: "default", size: "default" }, 80, 36],
      ["default-sm", "Default / Small", "Primary action button, small size", { variant: "default", size: "sm" }, 70, 32],
      ["default-lg", "Default / Large", "Primary action button, large size", { variant: "default", size: "lg" }, 100, 40],
      ["default-icon", "Default / Icon", "Icon-only primary button", { variant: "default", size: "icon" }, 36, 36],
      ["outline-default", "Outline / Default", "Secondary action button, outlined", { variant: "outline", size: "default" }, 80, 36],
      ["destructive-default", "Destructive / Default", "Dangerous action button", { variant: "destructive", size: "default" }, 80, 36],
      ["secondary-default", "Secondary / Default", "Secondary action button", { variant: "secondary", size: "default" }, 80, 36],
      ["ghost-default", "Ghost / Default", "Subtle action button", { variant: "ghost", size: "default" }, 80, 36],
      ["link-default", "Link / Default", "Text link styled as button", { variant: "link", size: "default" }, 60, 36],
    ]),
    defaultProps: { variant: "default", size: "default", disabled: false },
    figmaStructure: frame("Button", 80, 36, "HORIZONTAL", 8, 4, C.primary),
    importPath: "@/components/ui/button",
    tags: ["interactive", "primary", "action"],
    notes: [
      "h-9 (36px) base height with px-4 (16px) horizontal padding",
      "All variants support sm, lg, icon sizes",
      "Supports loading and disabled states",
    ],
  },
  {
    name: "Card",
    category: "layout",
    description: "Container for grouped content with section support",
    variants: v([
      ["default", "Default Card", "Standard card with header and content", {}, 300, 200],
      ["with-footer", "Card with Footer", "Card including footer actions", {}, 300, 240],
    ]),
    defaultProps: {},
    figmaStructure: frame("Card", 300, 200, "VERTICAL", S.lg, S.lg, C.card),
    importPath: "@/components/ui/card",
    tags: ["container", "layout", "grouping"],
    notes: [
      "White background with subtle border (1px, var(--border))",
      "Rounded corners (8px border-radius)",
      "Padding varies by section: header 24px, content 16px, footer 16px",
      "Shadow: 0 1px 3px rgba(0,0,0,0.1)",
    ],
  },
  {
    name: "Input",
    category: "input",
    description: "Text input field with optional label and error state",
    variants: v([
      ["default", "Input / Default", "Standard text input", { hasLabel: false, hasError: false }, 280, 40],
      ["with-label", "Input / With Label", "Input with accompanying label", { hasLabel: true, hasError: false }, 280, 72],
      ["with-error", "Input / Error", "Input showing validation error", { hasLabel: true, hasError: true }, 280, 96],
    ]),
    defaultProps: { placeholder: "Enter text..." },
    figmaStructure: frame("Input", 280, 40, "VERTICAL", 0, 8),
    importPath: "@/components/ui/input",
    tags: ["form", "input", "text-field"],
    notes: [
      "h-9 (36px) base height",
      "Border: 1px var(--input) #e4e4e7",
      "Padding: 8px 12px",
      "Focus: outline-none ring-2 ring-offset-2 ring-ring",
      "Placeholder: muted-foreground #71717a",
    ],
  },
  {
    name: "Badge",
    category: "display",
    description: "Small label for categorization or status indication",
    variants: v([
      ["default", "Badge / Default", "Primary badge", { variant: "default" }, 60, 24],
      ["secondary", "Badge / Secondary", "Secondary badge", { variant: "secondary" }, 60, 24],
      ["destructive", "Badge / Destructive", "Destructive badge", { variant: "destructive" }, 60, 24],
      ["outline", "Badge / Outline", "Outlined badge", { variant: "outline" }, 60, 24],
    ]),
    defaultProps: { variant: "default" },
    figmaStructure: frame("Badge", 60, 24, "HORIZONTAL", 4, 4, C.primary),
    importPath: "@/components/ui/badge",
    tags: ["label", "status", "category"],
    notes: [
      "Inline-flex display",
      "Height: 20px (h-5)",
      "Padding: 2px 10px",
      "Font size: 12px",
      "Border radius: 2px (slightly less than base)",
      "Font weight: 500",
    ],
  },
  {
    name: "Avatar",
    category: "display",
    description: "Circular profile image or initials",
    variants: v([
      ["with-image", "Avatar / With Image", "Avatar displaying user image", { hasImage: true }, 40, 40],
      ["with-fallback", "Avatar / With Fallback", "Avatar displaying initials", { hasImage: false }, 40, 40],
      ["large", "Avatar / Large", "Larger avatar (64px)", { size: "lg" }, 64, 64],
    ]),
    defaultProps: {},
    figmaStructure: frame("Avatar", 40, 40, "NONE"),
    importPath: "@/components/ui/avatar",
    tags: ["user", "profile", "image"],
    notes: [
      "Default: 40px x 40px (h-10 w-10)",
      "Circular border-radius: 9999px",
      "Aspect ratio: 1/1",
      "Fallback background: secondary #f4f4f5",
      "Fallback color: secondary-foreground #18181b",
    ],
  },
  {
    name: "Label",
    category: "display",
    description: "Associated label for form inputs",
    variants: v([
      ["default", "Label / Default", "Standard form label", {}, 120, 20],
    ]),
    defaultProps: {},
    figmaStructure: text("Label", "Label", SHADCN_TYPOGRAPHY.sm.fontSize, 500, C.foreground),
    importPath: "@/components/ui/label",
    tags: ["form", "text", "label"],
    notes: [
      "Font size: 14px (text-sm)",
      "Font weight: 500 (medium)",
      "Color: foreground #09090b",
      "Cursor: pointer when associated with input",
    ],
  },
  {
    name: "Textarea",
    category: "input",
    description: "Multi-line text input field",
    variants: v([
      ["default", "Textarea / Default", "Standard textarea", {}, 280, 120],
    ]),
    defaultProps: { placeholder: "Enter your message...", rows: 4 },
    figmaStructure: frame("Textarea", 280, 120, "VERTICAL", 8),
    importPath: "@/components/ui/textarea",
    tags: ["form", "input", "text"],
    notes: [
      "Min height: 80px",
      "Padding: 8px 12px",
      "Border: 1px var(--input)",
      "Font: 14px, same as input",
      "Line height: 1.4 (20px)",
      "Supports resize (vertical)",
    ],
  },
  {
    name: "Switch",
    category: "input",
    description: "Toggle switch for boolean inputs",
    variants: v([
      ["off", "Switch / Off", "Toggle in off position", { checked: false }, 44, 24],
      ["on", "Switch / On", "Toggle in on position", { checked: true }, 44, 24],
    ]),
    defaultProps: { checked: false },
    figmaStructure: frame("Switch", 44, 24, "HORIZONTAL"),
    importPath: "@/components/ui/switch",
    tags: ["toggle", "form", "input"],
    notes: [
      "Width: 44px, Height: 24px",
      "Track background: secondary #f4f4f5 (off), primary #18181b (on)",
      "Thumb: 20px circle, white",
      "Transition: 200ms",
      "Accessibility: role=switch, aria-checked",
    ],
  },
  {
    name: "Checkbox",
    category: "input",
    description: "Checkbox input for multi-select",
    variants: v([
      ["unchecked", "Checkbox / Unchecked", "Checkbox in unchecked state", { checked: false }, 20, 20],
      ["checked", "Checkbox / Checked", "Checkbox in checked state", { checked: true }, 20, 20],
      ["indeterminate", "Checkbox / Indeterminate", "Checkbox in indeterminate state", { checked: "indeterminate" }, 20, 20],
    ]),
    defaultProps: { checked: false },
    figmaStructure: rect("Checkbox", 20, 20, C.background, 4),
    importPath: "@/components/ui/checkbox",
    tags: ["form", "input", "select"],
    notes: [
      "Size: 20px x 20px (h-5 w-5)",
      "Border: 2px ring-primary #18181b",
      "Checked background: primary #18181b",
      "Border radius: 4px (rounded-sm)",
      "Focus ring: ring-offset-2 ring-ring",
    ],
  },
  {
    name: "Separator",
    category: "layout",
    description: "Visual divider between content sections",
    variants: v([
      ["horizontal", "Separator / Horizontal", "Horizontal divider line", { orientation: "horizontal" }, 200, 1],
      ["vertical", "Separator / Vertical", "Vertical divider line", { orientation: "vertical" }, 1, 100],
    ]),
    defaultProps: {},
    figmaStructure: rect("Separator", 200, 1, C.border),
    importPath: "@/components/ui/separator",
    tags: ["divider", "layout"],
    notes: [
      "Horizontal: height 1px, full width",
      "Vertical: width 1px, full height",
      "Color: border #e4e4e7",
      "No padding or margin built-in (added by parent)",
    ],
  },
  {
    name: "Skeleton",
    category: "feedback",
    description: "Loading placeholder skeleton",
    variants: v([
      ["rect", "Skeleton / Rectangle", "Rectangular skeleton for images or blocks", { shape: "rect" }, 100, 100],
      ["circle", "Skeleton / Circle", "Circular skeleton for avatars", { shape: "circle" }, 40, 40],
      ["text", "Skeleton / Text", "Text line skeleton", { shape: "text" }, 200, 16],
    ]),
    defaultProps: {},
    figmaStructure: rect("Skeleton", 100, 100, "#e4e4e7", SHADCN_RADIUS),
    importPath: "@/components/ui/skeleton",
    tags: ["loading", "placeholder", "feedback"],
    notes: [
      "Background: #e4e4e7 (muted color)",
      "Animated: pulse animation (opacity 0.5 - 1, 2s infinite)",
      "Border radius: matches context (4px for text, 9999px for circle)",
      "Used as container for other skeletons",
    ],
  },
  {
    name: "Alert",
    category: "feedback",
    description: "Alert message container with icon and text",
    variants: v([
      ["default", "Alert / Default", "Standard info alert", { variant: "default" }, 400, 80],
      ["destructive", "Alert / Destructive", "Error/destructive alert", { variant: "destructive" }, 400, 80],
    ]),
    defaultProps: { variant: "default" },
    figmaStructure: frame("Alert", 400, 80, "HORIZONTAL", S.md, S.md, C.secondary),
    importPath: "@/components/ui/alert",
    tags: ["message", "feedback", "notification"],
    notes: [
      "Padding: 16px",
      "Border: 1px var(--border)",
      "Border radius: 8px",
      "Background: secondary #f4f4f5 (default), destructive #fee2e2 (destructive)",
      "Icon color: primary (default), destructive #ef4444",
    ],
  },
  {
    name: "Progress",
    category: "feedback",
    description: "Progress bar showing completion percentage",
    variants: v([
      ["0-percent", "Progress / 0%", "Empty progress bar", { value: 0 }, 300, 4],
      ["50-percent", "Progress / 50%", "Half complete progress bar", { value: 50 }, 300, 4],
      ["100-percent", "Progress / 100%", "Completed progress bar", { value: 100 }, 300, 4],
    ]),
    defaultProps: { value: 0 },
    figmaStructure: frame("Progress", 300, 4, "HORIZONTAL", 0, 0, "#e4e4e7"),
    importPath: "@/components/ui/progress",
    tags: ["feedback", "progress", "loading"],
    notes: [
      "Height: 4px (h-1)",
      "Background: secondary #f4f4f5",
      "Indicator background: primary #18181b",
      "Border radius: 9999px (fully rounded)",
      "Animated: smooth width transition",
    ],
  },
  {
    name: "Table",
    category: "data",
    description: "Data table with header, rows, and cells",
    variants: v([
      ["default", "Table / Default", "Standard data table", {}, 500, 200],
    ]),
    defaultProps: {},
    figmaStructure: frame("Table", 500, 200, "VERTICAL", S.md),
    importPath: "@/components/ui/table",
    tags: ["data", "table"],
    notes: [
      "Header background: secondary #f4f4f5",
      "Header text: secondary-foreground #18181b, font-weight 500",
      "Row borders: 1px var(--border) bottom",
      "Cell padding: 12px 16px (py-3 px-4)",
      "Striped rows: alternating background (every other row)",
      "Hover: subtle background on row hover",
    ],
  },
  {
    name: "Tabs",
    category: "navigation",
    description: "Tabbed content with tab list and content areas",
    variants: v([
      ["default", "Tabs / Default", "Standard tab list", {}, 400, 200],
    ]),
    defaultProps: { defaultValue: "tab1" },
    figmaStructure: frame("Tabs", 400, 200, "VERTICAL", S.md),
    importPath: "@/components/ui/tabs",
    tags: ["navigation", "content"],
    notes: [
      "TabsList background: secondary #f4f4f5",
      "TabsTrigger: inactive color muted-foreground #71717a",
      "TabsTrigger: active color foreground #09090b with underline",
      "TabsTrigger padding: 8px 12px (py-2 px-3)",
      "Tab gap: 8px",
      "Border bottom: 2px, color ring #18181b (active)",
    ],
  },
  {
    name: "Dialog",
    category: "feedback",
    description: "Modal dialog with overlay, header, content, and footer",
    variants: v([
      ["default", "Dialog / Default", "Standard modal dialog", {}, 500, 300],
    ]),
    defaultProps: {},
    figmaStructure: frame("Dialog", 500, 300, "VERTICAL", S.lg),
    importPath: "@/components/ui/dialog",
    tags: ["modal", "feedback"],
    notes: [
      "Overlay: rgba(0, 0, 0, 0.5) backdrop",
      "Content: white background, 500px width (max-width 90vw)",
      "Border radius: 8px",
      "Shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      "Close button: top-right corner",
      "Header: gap 16px",
      "Footer: flex gap 8px, justify-end",
    ],
  },
  {
    name: "Select",
    category: "input",
    description: "Dropdown select with options",
    variants: v([
      ["closed", "Select / Closed", "Select in closed state", { isOpen: false }, 280, 40],
      ["open", "Select / Open", "Select in open state with options", { isOpen: true }, 280, 160],
    ]),
    defaultProps: {},
    figmaStructure: frame("Select", 280, 40, "VERTICAL", 0),
    importPath: "@/components/ui/select",
    tags: ["form", "input", "select"],
    notes: [
      "Trigger: h-9 (36px) with border and padding 8px 12px",
      "Trigger border: 1px var(--input)",
      "Trigger background: white",
      "Content: white background, border 1px var(--border)",
      "Content shadow: 0 10px 15px rgba(0,0,0,0.1)",
      "Options: padding 8px 12px, height 36px each",
      "Hover: background secondary #f4f4f5",
      "Selected: background primary #18181b, color primary-foreground #fafafa",
    ],
  },
  {
    name: "Tooltip",
    category: "feedback",
    description: "Tooltip popup on hover",
    variants: v([
      ["top", "Tooltip / Top", "Tooltip positioned above trigger", { side: "top" }, 200, 60],
      ["bottom", "Tooltip / Bottom", "Tooltip positioned below trigger", { side: "bottom" }, 200, 60],
    ]),
    defaultProps: {},
    figmaStructure: frame("Tooltip", 200, 30, "HORIZONTAL", 8, 4),
    importPath: "@/components/ui/tooltip",
    tags: ["feedback", "info"],
    notes: [
      "Background: primary #18181b",
      "Text: primary-foreground #fafafa",
      "Padding: 8px 12px (py-1.5 px-3)",
      "Border radius: 4px",
      "Font size: 12px (text-xs)",
      "Arrow: 6px triangle, same color as background",
      "Offset from trigger: 4px",
      "Max width: 300px",
    ],
  },
  {
    name: "DropdownMenu",
    category: "navigation",
    description: "Dropdown menu with items, separators, and submenus",
    variants: v([
      ["default", "DropdownMenu / Default", "Standard dropdown menu", {}, 200, 240],
    ]),
    defaultProps: {},
    figmaStructure: frame("DropdownMenu", 200, 240, "VERTICAL", S.sm),
    importPath: "@/components/ui/dropdown-menu",
    tags: ["navigation", "menu"],
    notes: [
      "Content: white background, border 1px var(--border)",
      "Content shadow: 0 10px 15px rgba(0,0,0,0.1)",
      "Items: padding 8px 12px, height 36px",
      "Item hover: background secondary #f4f4f5",
      "Separator: height 1px, background var(--border)",
      "Submenu: arrow indicator, nested menu on hover",
      "Border radius: 8px content, 4px items",
    ],
  },
  {
    name: "Sheet",
    category: "layout",
    description: "Slide-out sheet panel from any side",
    variants: v([
      ["left", "Sheet / Left", "Sheet sliding from left", { side: "left" }, 320, 600],
      ["right", "Sheet / Right", "Sheet sliding from right", { side: "right" }, 320, 600],
    ]),
    defaultProps: {},
    figmaStructure: frame("Sheet", 320, 600, "VERTICAL", S.lg),
    importPath: "@/components/ui/sheet",
    tags: ["overlay", "navigation", "sidebar"],
    notes: [
      "Overlay: rgba(0, 0, 0, 0.5)",
      "Content: white background",
      "Slide direction: left, right, top, bottom",
      "Width (left/right): 320px",
      "Height (top/bottom): varies",
      "Animation: 200ms ease-out",
      "Close button: top-right or context",
    ],
  },
  {
    name: "ScrollArea",
    category: "layout",
    description: "Custom styled scrollable container",
    variants: v([
      ["vertical", "ScrollArea / Vertical", "Vertically scrollable area", { orientation: "vertical" }, 300, 200],
      ["horizontal", "ScrollArea / Horizontal", "Horizontally scrollable area", { orientation: "horizontal" }, 300, 100],
    ]),
    defaultProps: {},
    figmaStructure: frame("ScrollArea", 300, 200, "VERTICAL", 8),
    importPath: "@/components/ui/scroll-area",
    tags: ["layout", "scroll"],
    notes: [
      "Scrollbar: width 8px, auto-hide on scroll end",
      "Thumb: background muted #f4f4f5",
      "Thumb hover: background muted-foreground #71717a",
      "Border radius: 4px on thumb",
      "Track: transparent",
    ],
  },
  {
    name: "Sidebar",
    category: "layout",
    description: "Navigation sidebar with collapsible sections",
    variants: v([
      ["default", "Sidebar / Default", "Standard sidebar layout", {}, 250, 600],
    ]),
    defaultProps: {},
    figmaStructure: frame("Sidebar", 250, 600, "VERTICAL", S.md),
    importPath: "@/components/ui/sidebar",
    tags: ["navigation", "layout"],
    notes: [
      "Width: 250px (customizable)",
      "Background: secondary #f4f4f5 (light mode)",
      "Header: full width, padding 16px",
      "Content: scrollable, padding 8px",
      "Items: padding 8px 12px, gap 8px",
      "Collapsible groups: chevron indicator",
      "Active item: primary background #18181b, primary-foreground #fafafa",
    ],
  },
];

// ── Export Complete Library ──────────────────────────────────────

export const SHADCN_LIBRARY: Map<string, ShadcnFigmaComponent> = new Map(
  COMPONENTS.map((def) => [def.name, comp(def)])
);

// ── Helper Functions ────────────────────────────────────────────

/**
 * Get a single component definition from the library.
 */
export function getShadcnComponent(
  name: string
): ShadcnFigmaComponent | undefined {
  return SHADCN_LIBRARY.get(name);
}

/**
 * List all component names in the library.
 */
export function listShadcnComponents(): string[] {
  return Array.from(SHADCN_LIBRARY.keys()).sort();
}

/**
 * Get all components in a specific category.
 */
export function getComponentsByCategory(
  category: ShadcnFigmaComponent["category"]
): ShadcnFigmaComponent[] {
  return Array.from(SHADCN_LIBRARY.values()).filter(
    (c) => c.category === category
  );
}

/**
 * Convert a FigmaNodeSpec to a serializable command object
 * that can be sent to the Figma plugin for node creation.
 */
export function buildComponentTree(
  spec: FigmaNodeSpec
): Record<string, unknown> {
  const cmd: Record<string, unknown> = {
    type: spec.type,
    name: spec.name,
  };

  if (spec.size) {
    cmd.width = spec.size.width;
    cmd.height = spec.size.height;
  }

  if (spec.style) {
    const style: Record<string, unknown> = {};
    if (spec.style.fill) style.fill = spec.style.fill;
    if (spec.style.stroke) style.stroke = spec.style.stroke;
    if (spec.style.strokeWidth) style.strokeWidth = spec.style.strokeWidth;
    if (spec.style.cornerRadius) style.cornerRadius = spec.style.cornerRadius;
    if (spec.style.opacity) style.opacity = spec.style.opacity;
    if (spec.style.shadow) style.shadow = spec.style.shadow;
    if (Object.keys(style).length > 0) cmd.style = style;
  }

  if (spec.layout) {
    cmd.layout = spec.layout;
  }

  if (spec.text) {
    cmd.text = spec.text;
  }

  if (spec.children && spec.children.length > 0) {
    cmd.children = spec.children.map((child) => buildComponentTree(child));
  }

  return cmd;
}

/**
 * Get all components, optionally filtered by tag.
 */
export function getAllComponents(tag?: string): ShadcnFigmaComponent[] {
  const components = Array.from(SHADCN_LIBRARY.values());
  if (!tag) return components;
  return components.filter((c) => c.tags.includes(tag));
}

/**
 * Get component summary for UI display.
 */
export function getComponentSummary(
  name: string
): { name: string; category: string; variantCount: number } | undefined {
  const component = getShadcnComponent(name);
  if (!component) return undefined;
  return {
    name: component.name,
    category: component.category,
    variantCount: component.variants.length,
  };
}
