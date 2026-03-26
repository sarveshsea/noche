/**
 * Component Catalog — Universal UI component registry
 *
 * Every Memoire project starts with this catalog pre-loaded.
 * Components are classified by Atomic Design level and grouped
 * into categories. Each entry maps to shadcn/ui primitives where
 * available, carries aliases from industry convention, and defines
 * the default variants/states/props for spec generation.
 *
 * Source: component.gallery taxonomy + shadcn/ui mapping
 */

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

export const COMPONENT_CATALOG: CatalogComponent[] = [
  // ═══════════════════════════════════ BUTTONS ═══
  {
    name: "Button", slug: "button", level: "atom", category: "buttons",
    description: "Triggers an action such as submitting a form or showing/hiding an interface component.",
    aliases: [],
    shadcnBase: ["Button"],
    variants: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    props: { children: "ReactNode", variant: "string?", size: "string?", disabled: "boolean?" },
    a11y: { role: "button" },
    prevalence: 118,
  },
  {
    name: "ButtonGroup", slug: "button-group", level: "molecule", category: "buttons",
    description: "A wrapper for multiple, related buttons.",
    aliases: ["Toolbar"],
    shadcnBase: ["Button"],
    variants: ["default", "compact"],
    props: { children: "ReactNode", orientation: "string?" },
    a11y: { role: "group" },
    prevalence: 36,
  },
  {
    name: "IconButton", slug: "icon-button", level: "atom", category: "buttons",
    description: "A button that displays an icon with optional label text.",
    aliases: [],
    shadcnBase: ["Button"],
    variants: ["default", "ghost", "outline"],
    props: { icon: "ReactNode", label: "string?", size: "string?" },
    a11y: { role: "button", ariaLabel: "required" },
    prevalence: 118,
  },
  {
    name: "Toggle", slug: "toggle", level: "atom", category: "buttons",
    description: "A control used to switch between two states: often on or off.",
    aliases: ["Switch", "Lightswitch", "Toggle button"],
    shadcnBase: ["Switch"],
    variants: ["default", "sm", "lg"],
    props: { checked: "boolean", onCheckedChange: "function", disabled: "boolean?" },
    a11y: { role: "switch" },
    prevalence: 59,
  },
  {
    name: "SegmentedControl", slug: "segmented-control", level: "molecule", category: "buttons",
    description: "A hybrid between a button group, radio buttons, and tabs for switching views.",
    aliases: ["Toggle button group"],
    shadcnBase: ["Tabs"],
    variants: ["default", "compact"],
    props: { value: "string", onValueChange: "function", options: "array" },
    a11y: { role: "radiogroup" },
    prevalence: 28,
  },
  {
    name: "Stepper", slug: "stepper", level: "molecule", category: "buttons",
    description: "A control for editing a numeric value with buttons for decrementing/incrementing.",
    aliases: ["Nudger", "Quantity", "Counter"],
    shadcnBase: ["Button", "Input"],
    variants: ["default", "compact"],
    props: { value: "number", min: "number?", max: "number?", step: "number?", onChange: "function" },
    a11y: { role: "spinbutton" },
    prevalence: 19,
  },

  // ═══════════════════════════════════ INPUTS ═══
  {
    name: "TextInput", slug: "text-input", level: "atom", category: "inputs",
    description: "A form control that accepts a single line of text.",
    aliases: [],
    shadcnBase: ["Input"],
    variants: ["default", "error", "disabled"],
    props: { value: "string", placeholder: "string?", onChange: "function", type: "string?" },
    a11y: { role: "textbox" },
    prevalence: 72,
  },
  {
    name: "Textarea", slug: "textarea", level: "atom", category: "inputs",
    description: "A form control for editing multi-line text.",
    aliases: ["Textbox", "Text box"],
    shadcnBase: ["Textarea"],
    variants: ["default", "error", "disabled"],
    props: { value: "string", placeholder: "string?", rows: "number?", onChange: "function" },
    a11y: { role: "textbox" },
    prevalence: 51,
  },
  {
    name: "SearchInput", slug: "search-input", level: "molecule", category: "inputs",
    description: "Search inputs allow users to find content by entering a search term.",
    aliases: ["Search"],
    shadcnBase: ["Input"],
    variants: ["default", "expanded"],
    props: { value: "string", placeholder: "string?", onSearch: "function" },
    a11y: { role: "searchbox" },
    prevalence: 29,
  },
  {
    name: "Select", slug: "select", level: "atom", category: "inputs",
    description: "A form input for selecting a value from a scrollable list of predefined options.",
    aliases: ["Dropdown", "Select input"],
    shadcnBase: ["Select"],
    variants: ["default", "error", "disabled"],
    props: { value: "string", options: "array", onValueChange: "function", placeholder: "string?" },
    a11y: { role: "listbox" },
    prevalence: 82,
  },
  {
    name: "Combobox", slug: "combobox", level: "molecule", category: "inputs",
    description: "An input that behaves similarly to a select, with free text filtering.",
    aliases: ["Autocomplete", "Autosuggest"],
    shadcnBase: ["Input", "Select"],
    variants: ["default", "multi"],
    props: { value: "string", options: "array", onValueChange: "function", placeholder: "string?" },
    a11y: { role: "combobox" },
    prevalence: 37,
  },
  {
    name: "Checkbox", slug: "checkbox", level: "atom", category: "inputs",
    description: "An input for choosing from predefined options: binary when alone, multi-select in groups.",
    aliases: [],
    shadcnBase: ["Checkbox"],
    variants: ["default", "indeterminate", "disabled"],
    props: { checked: "boolean", onCheckedChange: "function", label: "string?" },
    a11y: { role: "checkbox" },
    prevalence: 84,
  },
  {
    name: "RadioButton", slug: "radio-button", level: "atom", category: "inputs",
    description: "Allows a user to select a single option from a list of predefined options.",
    aliases: ["Radio", "Radio group"],
    shadcnBase: [],
    variants: ["default", "disabled"],
    props: { value: "string", options: "array", onValueChange: "function" },
    a11y: { role: "radiogroup" },
    prevalence: 86,
  },
  {
    name: "Slider", slug: "slider", level: "atom", category: "inputs",
    description: "A form control for choosing a value within a preset range.",
    aliases: ["Range input"],
    shadcnBase: [],
    variants: ["default", "range"],
    props: { value: "number", min: "number", max: "number", step: "number?", onChange: "function" },
    a11y: { role: "slider" },
    prevalence: 39,
  },
  {
    name: "DateInput", slug: "date-input", level: "molecule", category: "inputs",
    description: "A means of inputting a date, often separated into multiple individual fields.",
    aliases: [],
    shadcnBase: ["Input"],
    variants: ["default", "error"],
    props: { value: "string", onChange: "function", format: "string?" },
    a11y: {},
    prevalence: 17,
  },
  {
    name: "Datepicker", slug: "datepicker", level: "organism", category: "inputs",
    description: "A visual way to choose a date using a calendar view.",
    aliases: ["Calendar", "Datetime picker"],
    shadcnBase: [],
    variants: ["default", "range"],
    props: { value: "Date", onSelect: "function", minDate: "Date?", maxDate: "Date?" },
    a11y: { role: "dialog" },
    prevalence: 43,
  },
  {
    name: "ColorPicker", slug: "color-picker", level: "organism", category: "inputs",
    description: "An input for choosing a color.",
    aliases: [],
    shadcnBase: ["Input"],
    variants: ["default", "compact"],
    props: { value: "string", onChange: "function", format: "string?" },
    a11y: {},
    prevalence: 16,
  },
  {
    name: "FileUpload", slug: "file-upload", level: "molecule", category: "inputs",
    description: "An input which allows users to upload a file from their device.",
    aliases: ["File input", "File uploader", "Dropzone"],
    shadcnBase: ["Input"],
    variants: ["default", "dropzone"],
    props: { accept: "string?", multiple: "boolean?", onUpload: "function" },
    a11y: {},
    prevalence: 32,
  },
  {
    name: "Label", slug: "label", level: "atom", category: "inputs",
    description: "A text label for form inputs.",
    aliases: ["Form label"],
    shadcnBase: ["Label"],
    variants: ["default", "required"],
    props: { htmlFor: "string", children: "ReactNode" },
    a11y: {},
    prevalence: 15,
  },
  {
    name: "Fieldset", slug: "fieldset", level: "molecule", category: "inputs",
    description: "A group of related form fields with a legend.",
    aliases: [],
    shadcnBase: [],
    variants: ["default"],
    props: { legend: "string", children: "ReactNode" },
    a11y: { role: "group" },
    prevalence: 0,
  },
  {
    name: "Form", slug: "form", level: "organism", category: "inputs",
    description: "A grouping of input controls that allow a user to submit information to a server.",
    aliases: [],
    shadcnBase: [],
    variants: ["default", "inline"],
    props: { onSubmit: "function", children: "ReactNode" },
    a11y: { role: "form" },
    prevalence: 22,
  },
  {
    name: "Rating", slug: "rating", level: "molecule", category: "inputs",
    description: "Lets users see and/or set a star rating for a product or item.",
    aliases: [],
    shadcnBase: [],
    variants: ["default", "readonly"],
    props: { value: "number", max: "number?", onChange: "function?" },
    a11y: { role: "radiogroup" },
    prevalence: 19,
  },
  {
    name: "RichTextEditor", slug: "rich-text-editor", level: "organism", category: "inputs",
    description: "An interface for editing rich text content with formatting, usually through a WYSIWYG interface.",
    aliases: ["RTE", "WYSIWYG editor"],
    shadcnBase: [],
    variants: ["default", "minimal"],
    props: { value: "string", onChange: "function", toolbar: "array?" },
    a11y: { role: "textbox" },
    prevalence: 5,
  },

  // ═══════════════════════════════════ DATA DISPLAY ═══
  {
    name: "Badge", slug: "badge", level: "atom", category: "data-display",
    description: "A small label representing a status, property, or metadata.",
    aliases: ["Tag", "Label", "Chip"],
    shadcnBase: ["Badge"],
    variants: ["default", "secondary", "destructive", "outline"],
    props: { children: "ReactNode", variant: "string?" },
    a11y: {},
    prevalence: 122,
  },
  {
    name: "Avatar", slug: "avatar", level: "atom", category: "data-display",
    description: "A graphical representation of a user: usually a photo, illustration, or initial.",
    aliases: [],
    shadcnBase: ["Avatar"],
    variants: ["default", "sm", "lg"],
    props: { src: "string?", alt: "string", fallback: "string" },
    a11y: { role: "img" },
    prevalence: 37,
  },
  {
    name: "Card", slug: "card", level: "molecule", category: "data-display",
    description: "A container for content representing a single entity: e.g. a contact, article, or task.",
    aliases: ["Tile"],
    shadcnBase: ["Card"],
    variants: ["default", "interactive", "outlined"],
    props: { children: "ReactNode", className: "string?" },
    a11y: { role: "article" },
    prevalence: 79,
  },
  {
    name: "Table", slug: "table", level: "organism", category: "data-display",
    description: "A component for displaying large amounts of data in rows and columns with optional sorting/filtering.",
    aliases: ["Data Table"],
    shadcnBase: ["Table"],
    variants: ["default", "compact", "striped"],
    props: { columns: "array", data: "array", sortable: "boolean?" },
    a11y: { role: "table" },
    prevalence: 74,
  },
  {
    name: "List", slug: "list", level: "atom", category: "data-display",
    description: "Groups a collection of related items: unordered, ordered, or description list.",
    aliases: [],
    shadcnBase: [],
    variants: ["default", "ordered", "description"],
    props: { items: "array", children: "ReactNode?" },
    a11y: { role: "list" },
    prevalence: 69,
  },
  {
    name: "Image", slug: "image", level: "atom", category: "media",
    description: "An element for embedding images.",
    aliases: ["Picture"],
    shadcnBase: [],
    variants: ["default", "rounded", "cover"],
    props: { src: "string", alt: "string", width: "number?", height: "number?" },
    a11y: { role: "img", ariaLabel: "required" },
    prevalence: 27,
  },
  {
    name: "Icon", slug: "icon", level: "atom", category: "media",
    description: "A graphic symbol designed to visually indicate the purpose of an interface element.",
    aliases: [],
    shadcnBase: [],
    variants: ["default"],
    props: { name: "string", size: "number?", className: "string?" },
    a11y: { ariaLabel: "required" },
    prevalence: 45,
  },
  {
    name: "Video", slug: "video", level: "atom", category: "media",
    description: "An element for embedding video content.",
    aliases: [],
    shadcnBase: [],
    variants: ["default", "autoplay"],
    props: { src: "string", poster: "string?", controls: "boolean?" },
    a11y: {},
    prevalence: 0,
  },
  {
    name: "File", slug: "file", level: "molecule", category: "data-display",
    description: "A representation of a file such as an uploaded attachment or a downloadable PDF.",
    aliases: ["Attachment", "Download"],
    shadcnBase: ["Card"],
    variants: ["default", "compact"],
    props: { name: "string", size: "string?", type: "string?", href: "string?" },
    a11y: {},
    prevalence: 6,
  },
  {
    name: "Skeleton", slug: "skeleton", level: "atom", category: "data-display",
    description: "A placeholder layout for content that hasn't yet loaded, built up of grey boxes.",
    aliases: ["Skeleton loader"],
    shadcnBase: ["Skeleton"],
    variants: ["default", "circle", "text"],
    props: { width: "string?", height: "string?", className: "string?" },
    a11y: {},
    prevalence: 35,
  },
  {
    name: "Separator", slug: "separator", level: "atom", category: "data-display",
    description: "A separator between two elements, usually consisting of a horizontal line.",
    aliases: ["Divider", "Horizontal rule", "Vertical rule"],
    shadcnBase: ["Separator"],
    variants: ["horizontal", "vertical"],
    props: { orientation: "string?" },
    a11y: { role: "separator" },
    prevalence: 33,
  },
  {
    name: "Quote", slug: "quote", level: "atom", category: "data-display",
    description: "Displays a quotation from a person or another outside source.",
    aliases: ["Pull quote", "Block quote"],
    shadcnBase: [],
    variants: ["default", "pull"],
    props: { children: "ReactNode", cite: "string?" },
    a11y: {},
    prevalence: 11,
  },
  {
    name: "Stack", slug: "stack", level: "atom", category: "layout",
    description: "A wrapper component for adding a consistent margin between components.",
    aliases: [],
    shadcnBase: [],
    variants: ["vertical", "horizontal"],
    props: { gap: "string?", direction: "string?", children: "ReactNode" },
    a11y: {},
    prevalence: 9,
  },

  // ═══════════════════════════════════ FEEDBACK ═══
  {
    name: "Alert", slug: "alert", level: "molecule", category: "feedback",
    description: "A way of informing the user of important changes in a prominent way.",
    aliases: ["Notification", "Feedback", "Message", "Banner", "Callout"],
    shadcnBase: [],
    variants: ["default", "destructive", "success", "warning", "info"],
    props: { title: "string?", children: "ReactNode", variant: "string?" },
    a11y: { role: "alert" },
    prevalence: 108,
  },
  {
    name: "Toast", slug: "toast", level: "molecule", category: "feedback",
    description: "An alert that appears in a layer above other content, similar to a push notification.",
    aliases: ["Snackbar"],
    shadcnBase: [],
    variants: ["default", "destructive", "success"],
    props: { title: "string", description: "string?", action: "ReactNode?" },
    a11y: { role: "status" },
    prevalence: 42,
  },
  {
    name: "ProgressBar", slug: "progress-bar", level: "atom", category: "feedback",
    description: "A horizontal bar indicating the completion status of a long-running task.",
    aliases: ["Progress"],
    shadcnBase: ["Progress"],
    variants: ["default", "indeterminate"],
    props: { value: "number", max: "number?" },
    a11y: { role: "progressbar" },
    prevalence: 41,
  },
  {
    name: "ProgressIndicator", slug: "progress-indicator", level: "molecule", category: "feedback",
    description: "A representation of a user's progress through a series of discrete steps.",
    aliases: ["Progress tracker", "Steps", "Timeline", "Meter"],
    shadcnBase: [],
    variants: ["default", "vertical"],
    props: { steps: "array", currentStep: "number" },
    a11y: { role: "progressbar" },
    prevalence: 38,
  },
  {
    name: "Spinner", slug: "spinner", level: "atom", category: "feedback",
    description: "A visual indicator that a process is happening in the background.",
    aliases: ["Loader", "Loading"],
    shadcnBase: [],
    variants: ["default", "sm", "lg"],
    props: { size: "string?" },
    a11y: { role: "status", ariaLabel: "required" },
    prevalence: 66,
  },
  {
    name: "EmptyState", slug: "empty-state", level: "molecule", category: "feedback",
    description: "A placeholder shown when a view has no content to display.",
    aliases: [],
    shadcnBase: ["Card"],
    variants: ["default", "action"],
    props: { title: "string", description: "string?", action: "ReactNode?" },
    a11y: {},
    prevalence: 0,
  },

  // ═══════════════════════════════════ NAVIGATION ═══
  {
    name: "Navigation", slug: "navigation", level: "organism", category: "navigation",
    description: "A container for navigation links to other pages or elements within the current page.",
    aliases: ["Nav", "Menu"],
    shadcnBase: [],
    variants: ["horizontal", "vertical"],
    props: { items: "array", children: "ReactNode?" },
    a11y: { role: "navigation" },
    prevalence: 63,
  },
  {
    name: "Breadcrumbs", slug: "breadcrumbs", level: "molecule", category: "navigation",
    description: "A list of links showing the location of the current page in the navigational hierarchy.",
    aliases: ["Breadcrumb trail"],
    shadcnBase: [],
    variants: ["default"],
    props: { items: "array", separator: "string?" },
    a11y: { role: "navigation", ariaLabel: "required" },
    prevalence: 55,
  },
  {
    name: "Tabs", slug: "tabs", level: "molecule", category: "navigation",
    description: "A way of navigating between multiple panels, reducing clutter.",
    aliases: ["Tabbed interface"],
    shadcnBase: ["Tabs"],
    variants: ["default", "underline", "pills"],
    props: { value: "string", onValueChange: "function", children: "ReactNode" },
    a11y: { role: "tablist" },
    prevalence: 81,
  },
  {
    name: "Pagination", slug: "pagination", level: "molecule", category: "navigation",
    description: "Splits information over multiple pages and provides navigation between them.",
    aliases: [],
    shadcnBase: ["Button"],
    variants: ["default", "compact"],
    props: { page: "number", totalPages: "number", onPageChange: "function" },
    a11y: { role: "navigation" },
    prevalence: 49,
  },
  {
    name: "Link", slug: "link", level: "atom", category: "navigation",
    description: "A reference to a resource, either external or internal.",
    aliases: ["Anchor", "Hyperlink"],
    shadcnBase: [],
    variants: ["default", "muted", "underline"],
    props: { href: "string", children: "ReactNode", external: "boolean?" },
    a11y: { role: "link" },
    prevalence: 64,
  },
  {
    name: "SkipLink", slug: "skip-link", level: "atom", category: "navigation",
    description: "Links within a page for skipping to another section, primarily for keyboard navigation.",
    aliases: [],
    shadcnBase: [],
    variants: ["default"],
    props: { href: "string", children: "ReactNode" },
    a11y: {},
    prevalence: 14,
  },
  {
    name: "TreeView", slug: "tree-view", level: "organism", category: "navigation",
    description: "A component for displaying nested hierarchical information, such as a directory structure.",
    aliases: [],
    shadcnBase: [],
    variants: ["default", "selectable"],
    props: { data: "array", onSelect: "function?" },
    a11y: { role: "tree" },
    prevalence: 14,
  },

  // ═══════════════════════════════════ OVERLAYS ═══
  {
    name: "Modal", slug: "modal", level: "organism", category: "overlays",
    description: "An interface element that appears over other content, requiring user interaction.",
    aliases: ["Dialog", "Popup", "Modal window"],
    shadcnBase: ["Dialog"],
    variants: ["default", "fullscreen", "drawer"],
    props: { open: "boolean", onOpenChange: "function", title: "string?", children: "ReactNode" },
    a11y: { role: "dialog" },
    prevalence: 82,
  },
  {
    name: "Drawer", slug: "drawer", level: "organism", category: "overlays",
    description: "A panel which slides out from the edge of the screen.",
    aliases: ["Tray", "Flyout", "Sheet"],
    shadcnBase: ["Sheet"],
    variants: ["default", "left", "right", "bottom"],
    props: { open: "boolean", onOpenChange: "function", side: "string?", children: "ReactNode" },
    a11y: { role: "dialog" },
    prevalence: 38,
  },
  {
    name: "Popover", slug: "popover", level: "molecule", category: "overlays",
    description: "An element that pops up from another element, triggered via click, containing interactive content.",
    aliases: [],
    shadcnBase: [],
    variants: ["default"],
    props: { trigger: "ReactNode", children: "ReactNode", side: "string?" },
    a11y: {},
    prevalence: 50,
  },
  {
    name: "Tooltip", slug: "tooltip", level: "atom", category: "overlays",
    description: "A means of displaying a description or extra information about an element, usually on hover.",
    aliases: ["Toggletip"],
    shadcnBase: ["Tooltip"],
    variants: ["default"],
    props: { content: "string", children: "ReactNode", side: "string?" },
    a11y: { role: "tooltip" },
    prevalence: 74,
  },
  {
    name: "DropdownMenu", slug: "dropdown-menu", level: "molecule", category: "overlays",
    description: "A menu showing actions or navigation options, triggered by a button click.",
    aliases: ["Select menu"],
    shadcnBase: ["DropdownMenu"],
    variants: ["default"],
    props: { trigger: "ReactNode", items: "array" },
    a11y: { role: "menu" },
    prevalence: 48,
  },

  // ═══════════════════════════════════ LAYOUT ═══
  {
    name: "Accordion", slug: "accordion", level: "molecule", category: "layout",
    description: "A vertical stack of interactive headings that toggle the display of further content.",
    aliases: ["Arrow toggle", "Collapse", "Collapsible", "Details", "Disclosure", "Expandable", "Expander"],
    shadcnBase: [],
    variants: ["default", "multiple"],
    props: { items: "array", type: "string?" },
    a11y: {},
    prevalence: 101,
  },
  {
    name: "Carousel", slug: "carousel", level: "organism", category: "layout",
    description: "Displays multiple slides of content, navigable via swiping, scrolling, or buttons.",
    aliases: ["Content slider"],
    shadcnBase: [],
    variants: ["default", "autoplay"],
    props: { items: "array", autoplay: "boolean?" },
    a11y: { role: "region", ariaLabel: "required" },
    prevalence: 22,
  },
  {
    name: "Header", slug: "header", level: "organism", category: "layout",
    description: "An element that appears across the top of all pages, containing site name and main navigation.",
    aliases: [],
    shadcnBase: [],
    variants: ["default", "sticky", "transparent"],
    props: { children: "ReactNode" },
    a11y: { role: "banner" },
    prevalence: 41,
  },
  {
    name: "Footer", slug: "footer", level: "organism", category: "layout",
    description: "Appears at the bottom of a page to display copyright, legal information, or links.",
    aliases: [],
    shadcnBase: [],
    variants: ["default", "minimal"],
    props: { children: "ReactNode" },
    a11y: { role: "contentinfo" },
    prevalence: 19,
  },
  {
    name: "Hero", slug: "hero", level: "organism", category: "layout",
    description: "A large banner, usually appearing as one of the first items on a page.",
    aliases: ["Jumbotron", "Banner"],
    shadcnBase: ["Card"],
    variants: ["default", "centered", "split"],
    props: { title: "string", subtitle: "string?", cta: "ReactNode?", media: "ReactNode?" },
    a11y: {},
    prevalence: 9,
  },
  {
    name: "VisuallyHidden", slug: "visually-hidden", level: "atom", category: "layout",
    description: "Hides content visually while keeping it accessible to screen readers.",
    aliases: [],
    shadcnBase: [],
    variants: ["default"],
    props: { children: "ReactNode" },
    a11y: {},
    prevalence: 0,
  },

  // ═══════════════════════════════════ TYPOGRAPHY ═══
  {
    name: "Heading", slug: "heading", level: "atom", category: "typography",
    description: "A title or caption used to introduce a new section.",
    aliases: [],
    shadcnBase: [],
    variants: ["h1", "h2", "h3", "h4", "h5", "h6"],
    props: { level: "number", children: "ReactNode" },
    a11y: {},
    prevalence: 28,
  },
];

// ── Helpers ────────────────────────────────────────

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
