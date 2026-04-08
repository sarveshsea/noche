/**
 * Page Generator — Creates full page layout components from PageSpec objects.
 *
 * Inputs:
 *   - PageSpec (from src/specs/types.ts) — defines layout, sections, responsive breakpoints, etc.
 *   - CodegenContext — provides design system and project context.
 *
 * Outputs:
 *   - PageCode: { page: string (TSX), barrel: string (index.ts) }
 *
 * Key responsibilities:
 *   1. Resolve the layout template (sidebar-main, full-width, centered, dashboard, split, marketing)
 *   2. Build section components with appropriate grid/flex classes per layout type
 *   3. Emit responsive Tailwind breakpoint classes from spec.responsive
 *   4. Derive page-level TypeScript prop types from section prop values
 *   5. Import section components from the generated/ directory
 */

import type { PageSpec } from "../specs/types.js";
import type { CodegenContext } from "./generator.js";

interface PageCode {
  page: string;
  barrel: string;
}

const LAYOUT_TEMPLATES: Record<string, { imports: string[]; wrapper: (content: string) => string }> = {
  "sidebar-main": {
    imports: [
      `import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"`,
      `import { AppSidebar } from "@/components/app-sidebar"`,
      `import { Separator } from "@/components/ui/separator"`,
    ],
    wrapper: (content) => [
      "    <SidebarProvider>",
      "      <AppSidebar />",
      "      <SidebarInset>",
      "        <header className=\"flex h-16 shrink-0 items-center gap-2 border-b px-4\">",
      "          <SidebarTrigger className=\"-ml-1\" />",
      "          <Separator orientation=\"vertical\" className=\"mr-2 h-4\" />",
      "          <h1 className=\"text-lg font-semibold\">Page Title</h1>",
      "        </header>",
      "        <main className=\"flex-1 p-6\">",
      content,
      "        </main>",
      "      </SidebarInset>",
      "    </SidebarProvider>",
    ].join("\n"),
  },
  "full-width": {
    imports: [],
    wrapper: (content) => [
      "    <div className=\"min-h-screen\">",
      "      <main className=\"container mx-auto p-6\">",
      content,
      "      </main>",
      "    </div>",
    ].join("\n"),
  },
  "centered": {
    imports: [],
    wrapper: (content) => [
      "    <div className=\"min-h-screen flex items-center justify-center\">",
      "      <div className=\"w-full max-w-4xl p-6\">",
      content,
      "      </div>",
      "    </div>",
    ].join("\n"),
  },
  "dashboard": {
    imports: [
      `import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"`,
      `import { AppSidebar } from "@/components/app-sidebar"`,
    ],
    wrapper: (content) => [
      "    <SidebarProvider>",
      "      <AppSidebar />",
      "      <SidebarInset>",
      "        <main className=\"flex-1 p-6 space-y-6\">",
      content,
      "        </main>",
      "      </SidebarInset>",
      "    </SidebarProvider>",
    ].join("\n"),
  },
  "split": {
    imports: [],
    wrapper: (content) => [
      "    <div className=\"min-h-screen grid grid-cols-2\">",
      content,
      "    </div>",
    ].join("\n"),
  },
  "marketing": {
    imports: [],
    wrapper: (content) => [
      "    <div className=\"min-h-screen\">",
      "      <main className=\"space-y-24\">",
      content,
      "      </main>",
      "    </div>",
    ].join("\n"),
  },
};

/**
 * Generate a React + TypeScript page component from a PageSpec.
 *
 * @param spec - The page spec describing layout, sections, responsive config, and metadata.
 * @param ctx  - Codegen context providing design system and project information.
 * @returns    PageCode with `page` (the .tsx source) and `barrel` (index.ts re-export).
 */
export function generatePage(spec: PageSpec, ctx: CodegenContext): PageCode {
  const layout = LAYOUT_TEMPLATES[spec.layout] ?? LAYOUT_TEMPLATES["full-width"];
  const sectionImports = new Set<string>();
  const sectionCode = buildSections(spec, sectionImports);
  const wrappedContent = layout.wrapper(sectionCode);

  const lines: string[] = [];

  // Imports
  lines.push(`import * as React from "react"`);
  lines.push(`import { cn } from "@/lib/utils"`);
  for (const imp of layout.imports) {
    lines.push(imp);
  }
  for (const imp of sectionImports) {
    lines.push(imp);
  }
  lines.push("");

  // Component — derive data props from section configurations
  const dataProps = derivePageDataProps(spec);
  lines.push(`export interface ${spec.name}Props {`);
  lines.push(`  className?: string`);
  for (const [name, type] of Object.entries(dataProps)) {
    lines.push(`  ${name}?: ${type}`);
  }
  lines.push(`}`);
  lines.push("");
  const destructuredPageProps = ["className", ...Object.keys(dataProps)].join(", ");
  lines.push(`export function ${spec.name}({ ${destructuredPageProps} }: ${spec.name}Props) {`);
  lines.push("  return (");
  lines.push(`    <div className={cn(className)}>`);
  lines.push(wrappedContent);
  lines.push("    </div>");
  lines.push("  )");
  lines.push("}");

  const barrel = [
    `export { ${spec.name} } from "./${spec.name}"`,
    `export type { ${spec.name}Props } from "./${spec.name}"`,
    "",
  ].join("\n");

  return { page: lines.join("\n"), barrel };
}

function buildSections(spec: PageSpec, imports: Set<string>): string {
  if (spec.sections.length === 0) {
    return "";
  }

  const lines: string[] = [];

  for (const section of spec.sections) {
    // Add import for the component
    imports.add(`import { ${section.component} } from "@/generated/components/${section.component}"`);

    const gridClass = layoutToGridClass(section.layout);
    const responsiveClass = buildResponsiveClasses(spec.responsive);

    if (section.repeat > 1) {
      lines.push(`          {/* ${section.name} */}`);
      lines.push(`          <section className="${gridClass} ${responsiveClass}">`);
      for (let i = 0; i < section.repeat; i++) {
        const propsStr = Object.entries(section.props)
          .map(([k, v]) => `${k}={${JSON.stringify(v)}}`)
          .join(" ");
        lines.push(`            <${section.component} ${propsStr} />`);
      }
      lines.push("          </section>");
    } else {
      lines.push(`          {/* ${section.name} */}`);
      const propsStr = Object.entries(section.props)
        .map(([k, v]) => `${k}={${JSON.stringify(v)}}`)
        .join(" ");
      lines.push(`          <section className="${section.layout === "full-width" ? "w-full" : ""}">`);
      lines.push(`            <${section.component} ${propsStr} />`);
      lines.push("          </section>");
    }
  }

  return lines.join("\n");
}

function layoutToGridClass(layout: string): string {
  const map: Record<string, string> = {
    "full-width": "w-full",
    "half": "grid grid-cols-2 gap-4",
    "third": "grid grid-cols-3 gap-4",
    "quarter": "grid grid-cols-4 gap-4",
    "grid-2": "grid grid-cols-2 gap-4",
    "grid-3": "grid grid-cols-3 gap-4",
    "grid-4": "grid grid-cols-4 gap-4",
    "stack": "flex flex-col gap-4",
    "inline": "flex flex-row gap-4",
  };
  return map[layout] ?? "w-full";
}

function buildResponsiveClasses(responsive: PageSpec["responsive"]): string {
  const classes: string[] = [];

  if (responsive.mobile === "stack") {
    classes.push("max-sm:flex max-sm:flex-col");
  }

  if (responsive.tablet.startsWith("grid-")) {
    const cols = responsive.tablet.split("-")[1];
    classes.push(`sm:grid-cols-${cols}`);
  }

  if (responsive.desktop.startsWith("grid-")) {
    const cols = responsive.desktop.split("-")[1];
    classes.push(`lg:grid-cols-${cols}`);
  }

  return classes.join(" ");
}

/** Derive data props from page sections' props for the page-level component interface. */
function derivePageDataProps(spec: PageSpec): Record<string, string> {
  const dataProps: Record<string, string> = {};

  for (const section of spec.sections) {
    for (const [key, value] of Object.entries(section.props)) {
      // Infer TypeScript types from prop values
      if (typeof value === "string") {
        dataProps[key] = "string";
      } else if (typeof value === "number") {
        dataProps[key] = "number";
      } else if (typeof value === "boolean") {
        dataProps[key] = "boolean";
      } else if (Array.isArray(value)) {
        dataProps[key] = "unknown[]";
      } else {
        dataProps[key] = "Record<string, unknown>";
      }
    }
  }

  // Add common page data props
  if (spec.meta && Object.keys(spec.meta).length > 0) {
    dataProps["pageTitle"] = "string";
    dataProps["pageDescription"] = "string";
  }

  return dataProps;
}
