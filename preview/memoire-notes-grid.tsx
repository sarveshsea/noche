// Memoire Skills Carousel — Framer Code Component
// Auto-rotating carousel showing skill files as live markdown readers.

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/* ═══ TOKENS ═══ */

const T = {
    bg: "#fafaf9",
    surface: "#ffffff",
    surfaceMuted: "#f5f5f4",
    fg: "#0a0a0a",
    fgMuted: "#737373",
    fgDim: "#9a9a9a",
    border: "rgba(0,0,0,0.08)",
    green: "#16a34a",
    greenSoft: "rgba(22,163,74,0.06)",
    greenBorder: "rgba(22,163,74,0.18)",
    yellow: "#ca8a04",
    yellowSoft: "rgba(202,138,4,0.06)",
    yellowBorder: "rgba(202,138,4,0.18)",
    blue: "#2563eb",
    blueSoft: "rgba(37,99,235,0.06)",
    blueBorder: "rgba(37,99,235,0.18)",
    purple: "#7c3aed",
    purpleSoft: "rgba(124,58,237,0.06)",
    purpleBorder: "rgba(124,58,237,0.18)",
    rose: "#d4a0a0",
    roseSoft: "rgba(212,160,160,0.08)",
    roseBorder: "rgba(212,160,160,0.2)",
    mono: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
    serif: "'Cormorant Garamond', Georgia, serif",
}

/* ═══ SKILL DATA ═══ */

interface Skill {
    name: string
    filename: string
    category: "craft" | "generate" | "connect" | "research" | "core"
    description: string
    lines: number
    sections: string[]
    preview: string[]
}

const SKILLS: Skill[] = [
    {
        name: "Figma Library Builder",
        filename: "FIGMA_GENERATE_LIBRARY.md",
        category: "craft",
        description: "Generate Figma component library from React/shadcn codebase with Code Connect parity",
        lines: 166,
        sections: ["Prerequisites", "Workflow", "Step 1: Check Mappings", "Step 2: Scan Codebase", "Step 3: Build Components", "Step 4: Code Connect", "Self-Healing Loop"],
        preview: [
            "---",
            "name: figma-generate-library",
            "description: Generate Figma component library",
            "  from React/shadcn codebase with Code",
            "  Connect parity",
            "user-invocable: true",
            "model: opus",
            "effort: max",
            "context:",
            "  - skills/FIGMA_USE.md",
            "  - skills/ATOMIC_DESIGN.md",
            "---",
            "",
            "# /figma-generate-library",
            "",
            "## Prerequisites",
            "- `/figma-use` foundational skill loaded",
            "- Codebase has shadcn/ui component library",
            "- `memi connect` active",
            "",
            "## Workflow",
            "",
            "### Step 1: Check Existing Mappings",
            "```",
            "get_code_connect_map",
            "  \u2192 what's already mapped?",
            "```",
            "",
            "### Step 2: Scan Codebase",
            "- Read each component directory",
            "- Extract props, variants, slots",
            "- Map to Atomic Design level",
            "",
            "### Step 3: Build in Figma",
            "- Create component with Auto Layout",
            "- Apply design tokens from variables",
            "- Set up variant properties",
            "- CREATE \u2192 SCREENSHOT \u2192 ANALYZE \u2192 FIX",
        ],
    },
    {
        name: "Motion & Video Design",
        filename: "MOTION_VIDEO_DESIGN.md",
        category: "generate",
        description: "Product animation, UI motion, portfolio videos with Apple-grade reveals and motion tokens",
        lines: 343,
        sections: ["Motion Tokens", "Reveal Patterns", "Page Transitions", "Micro-interactions", "Video Production", "Export Pipeline"],
        preview: [
            "---",
            "name: motion-video",
            "description: Product animation, UI motion,",
            "  portfolio videos \u2014 Apple-grade reveals,",
            "  motion tokens, full production pipelines",
            "user-invocable: true",
            "model: opus",
            "---",
            "",
            "# /motion-video",
            "",
            "## Motion Token System",
            "",
            "### Duration Scale",
            "- instant: 100ms   (micro-feedback)",
            "- fast:    200ms   (button, toggle)",
            "- normal:  350ms   (panel, card)",
            "- slow:    500ms   (page transition)",
            "- cinematic: 800ms (hero reveal)",
            "",
            "### Easing Curves",
            "- snappy: cubic-bezier(0.22, 1, 0.36, 1)",
            "- smooth: cubic-bezier(0.16, 1, 0.3, 1)",
            "- bounce: cubic-bezier(0.34, 1.56, 0.64, 1)",
            "",
            "## Reveal Patterns",
            "",
            "### Scroll-Triggered Cascade",
            "```tsx",
            "stagger: 0.08s per child",
            "translateY: 20px \u2192 0",
            "opacity: 0 \u2192 1",
            "scale: 0.95 \u2192 1",
            "```",
            "",
            "### Hero Entrance",
            "1. Background gradient fades in",
            "2. Title types letter by letter",
            "3. Subtitle slides up with blur",
        ],
    },
    {
        name: "Multi-Agent Orchestration",
        filename: "MULTI_AGENT.md",
        category: "core",
        description: "Orchestrate multiple Claude instances on Figma canvas with coordinated handoffs",
        lines: 163,
        sections: ["Agent Roles", "Registration", "Task Queue", "Conflict Resolution", "Health Monitoring", "Self-Healing"],
        preview: [
            "---",
            "name: multi-agent",
            "description: Orchestrate multiple Claude",
            "  instances on Figma canvas with box",
            "  widgets, coordinated handoffs",
            "user-invocable: true",
            "model: opus",
            "---",
            "",
            "# /multi-agent",
            "",
            "## Agent Roles (9 total)",
            "",
            "| Role               | Responsibility      |",
            "|--------------------|---------------------|",
            "| token-engineer     | Design tokens, vars |",
            "| component-architect| Component structure |",
            "| layout-designer    | Page layouts        |",
            "| dataviz-specialist | Charts, graphs      |",
            "| code-generator     | shadcn/ui output    |",
            "| accessibility      | WCAG compliance     |",
            "| design-auditor     | Quality checks      |",
            "| research-analyst   | User research       |",
            "| general            | Fallback executor   |",
            "",
            "## Lifecycle",
            "```",
            "spawn \u2192 register \u2192 heartbeat (10s)",
            "  \u2192 claim tasks \u2192 execute \u2192 report",
            "  \u2192 evict after 30s stale",
            "```",
            "",
            "## Task Queue",
            "- Dependency resolution (DAG)",
            "- Lock-based claiming",
            "- Timeout reclamation (120s)",
        ],
    },
    {
        name: "Design System Reference",
        filename: "DESIGN_SYSTEM_REFERENCE.md",
        category: "research",
        description: "Cross-industry component gallery with 110+ design systems indexed",
        lines: 1051,
        sections: ["Button Systems", "Navigation", "Data Display", "Forms & Input", "Feedback", "Layout", "110+ Systems"],
        preview: [
            "# Design System Reference",
            "",
            "## Purpose",
            "Master index of real-world design system",
            "implementations across 100+ organizations.",
            "",
            "## Systems Indexed",
            "",
            "### Enterprise",
            "- Carbon (IBM)         \u2192 carbondesign",
            "- Fluent (Microsoft)   \u2192 fluent2",
            "- Material (Google)    \u2192 m3.material",
            "- Spectrum (Adobe)     \u2192 spectrum.adobe",
            "- Lightning (Salesforce)",
            "",
            "### Product",
            "- Primer (GitHub)      \u2192 primer.style",
            "- Polaris (Shopify)    \u2192 polaris",
            "- Paste (Twilio)       \u2192 paste",
            "- Evergreen (Segment)  \u2192 evergreen",
            "",
            "### Startup / Modern",
            "- Radix (WorkOS)       \u2192 radix-ui",
            "- shadcn/ui            \u2192 ui.shadcn",
            "- Mantine              \u2192 mantine.dev",
            "- Chakra               \u2192 chakra-ui",
            "",
            "## Component: Button",
            "",
            "| System    | Variants | Sizes | A11y |",
            "|-----------|----------|-------|------|",
            "| Carbon    | 5        | 4     | AAA  |",
            "| Material  | 5        | 3     | AA   |",
            "| Primer    | 7        | 3     | AA   |",
            "| shadcn    | 6        | 3     | AA   |",
        ],
    },
    {
        name: "Figma Audit",
        filename: "FIGMA_AUDIT.md",
        category: "craft",
        description: "Audit Figma file for design system consistency, accessibility, token adoption",
        lines: 160,
        sections: ["Audit Checklist", "Token Coverage", "Accessibility", "Naming", "Component Usage", "Report"],
        preview: [
            "---",
            "name: figma-audit",
            "description: Audit Figma file for design",
            "  system consistency, accessibility,",
            "  token adoption, Code Connect coverage",
            "user-invocable: true",
            "---",
            "",
            "# /figma-audit",
            "",
            "## Audit Dimensions",
            "",
            "### 1. Token Adoption",
            "- [ ] All colors use variables",
            "- [ ] No raw hex values",
            "- [ ] Spacing uses 4/8px grid",
            "- [ ] Typography uses text styles",
            "",
            "### 2. Accessibility",
            "- [ ] Contrast \u2265 4.5:1 (AA)",
            "- [ ] Touch targets \u2265 44px",
            "- [ ] Focus indicators visible",
            "- [ ] Labels on all inputs",
            "",
            "### 3. Component Health",
            "- [ ] No detached instances",
            "- [ ] Variants complete",
            "- [ ] Props documented",
            "- [ ] Code Connect mapped",
            "",
            "### 4. Naming Convention",
            "- Components: PascalCase",
            "- Variables: kebab-case",
            "- Pages: Section / Subsection",
        ],
    },
    {
        name: "Atomic Design",
        filename: "ATOMIC_DESIGN.md",
        category: "core",
        description: "Atomic Design methodology — atoms, molecules, organisms, templates, pages",
        lines: 129,
        sections: ["Atoms", "Molecules", "Organisms", "Templates", "Pages", "Token Layer"],
        preview: [
            "---",
            "name: atomic-design",
            "description: Atomic Design methodology",
            "  reference \u2014 atoms, molecules, organisms,",
            "  templates, pages, tokens, accessibility",
            "---",
            "",
            "# Atomic Design Levels",
            "",
            "## Atom \u2192 components/ui/",
            "Standalone primitives.",
            "`composesSpecs` must be empty.",
            "",
            "Examples: Button, Input, Badge, Avatar,",
            "  Icon, Checkbox, Label, Separator",
            "",
            "## Molecule \u2192 components/molecules/",
            "Composes 2\u20135 atoms.",
            "",
            "Examples: SearchBar (Input + Button),",
            "  FormField (Label + Input + ErrorText)",
            "",
            "## Organism \u2192 components/organisms/",
            "Composes molecules and/or atoms.",
            "Manages local state.",
            "",
            "Examples: Header, DataTable, UserCard,",
            "  NavigationMenu, CommentThread",
            "",
            "## Template \u2192 components/templates/",
            "Page layout skeleton.",
            "Defines structure, not content.",
            "",
            "## Page \u2192 PageSpec",
            "Template filled with real content.",
        ],
    },
]

const CATEGORY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
    craft: { color: T.fg, bg: T.roseSoft, border: T.roseBorder },
    generate: { color: T.green, bg: T.greenSoft, border: T.greenBorder },
    connect: { color: T.blue, bg: T.blueSoft, border: T.blueBorder },
    research: { color: T.yellow, bg: T.yellowSoft, border: T.yellowBorder },
    core: { color: T.purple, bg: T.purpleSoft, border: T.purpleBorder },
}

/* ═══ SYNTAX HIGHLIGHT ═══ */

function highlightLine(line: string): React.ReactNode {
    // Frontmatter delimiter
    if (line === "---") return <span style={{ color: T.fgDim }}>{line}</span>
    // Headers
    if (line.startsWith("# ")) return <span style={{ color: T.fg, fontWeight: 600 }}>{line}</span>
    if (line.startsWith("## ")) return <span style={{ color: T.fg, fontWeight: 500 }}>{line}</span>
    if (line.startsWith("### ")) return <span style={{ color: T.fgMuted, fontWeight: 500 }}>{line}</span>
    // Code block
    if (line.startsWith("```")) return <span style={{ color: T.fgDim }}>{line}</span>
    // Key: value in frontmatter
    if (line.match(/^[a-z-]+:/)) {
        const [key, ...rest] = line.split(":")
        return <><span style={{ color: T.purple }}>{key}</span><span style={{ color: T.fgDim }}>:</span><span style={{ color: T.green }}>{rest.join(":")}</span></>
    }
    // Bullet points
    if (line.startsWith("- ")) return <><span style={{ color: T.rose }}>-</span><span style={{ color: T.fgMuted }}>{line.slice(1)}</span></>
    // Checkbox
    if (line.includes("- [ ]")) return <><span style={{ color: T.fgDim }}>{line.replace("- [ ]", "")}</span><span style={{ color: T.yellow }}> [ ]</span></>
    // Table
    if (line.startsWith("|")) return <span style={{ color: T.fgDim }}>{line}</span>
    // Arrow/ref
    if (line.includes("\u2192")) {
        const parts = line.split("\u2192")
        return <><span style={{ color: T.fgMuted }}>{parts[0]}</span><span style={{ color: T.rose }}>\u2192</span><span style={{ color: T.blue }}>{parts[1]}</span></>
    }
    // Indented content
    if (line.startsWith("  ")) return <span style={{ color: T.fgMuted }}>{line}</span>
    // Empty
    if (!line.trim()) return <span>{"\u00a0"}</span>
    return <span style={{ color: T.fgMuted }}>{line}</span>
}

/* ═══ FILE VIEWER ═══ */

function FileViewer({ skill, isActive }: { skill: Skill; isActive: boolean }) {
    const [scrollOffset, setScrollOffset] = useState(0)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        if (isActive) {
            setScrollOffset(0)
            intervalRef.current = setInterval(() => {
                setScrollOffset((prev) => {
                    if (prev >= skill.preview.length - 12) return 0
                    return prev + 1
                })
            }, 800)
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [isActive, skill])

    const visibleLines = skill.preview.slice(scrollOffset, scrollOffset + 16)
    const cat = CATEGORY_STYLES[skill.category] || CATEGORY_STYLES.craft

    return (
        <div style={{
            display: "flex", flexDirection: "column" as const, height: "100%",
            borderRadius: 8, overflow: "hidden",
            border: `1px solid ${T.border}`,
            background: T.surface,
            boxShadow: isActive ? "0 8px 32px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.03)",
            transition: "box-shadow 0.4s ease",
        }}>
            {/* File chrome */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "7px 12px", borderBottom: `1px solid ${T.border}`, background: T.surfaceMuted,
                flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 999, background: "#ff5f57" }} />
                        <div style={{ width: 8, height: 8, borderRadius: 999, background: "#febc2e" }} />
                        <div style={{ width: 8, height: 8, borderRadius: 999, background: "#28c840" }} />
                    </div>
                    <span style={{ fontSize: 9, color: T.fgDim, fontFamily: T.mono, letterSpacing: 0.3 }}>
                        skills/{skill.filename}
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                        fontSize: 7.5, fontWeight: 600, textTransform: "uppercase" as const,
                        letterSpacing: 0.8, padding: "1px 6px", borderRadius: 3,
                        color: cat.color, background: cat.bg, border: `1px solid ${cat.border}`,
                        fontFamily: T.mono,
                    }}>
                        {skill.category}
                    </span>
                    <span style={{ fontSize: 8.5, color: T.fgDim, fontFamily: T.mono }}>
                        {skill.lines} lines
                    </span>
                </div>
            </div>

            {/* Section tabs */}
            <div style={{
                display: "flex", gap: 0, padding: "0 12px",
                borderBottom: `1px solid ${T.border}`, background: T.surface,
                overflowX: "auto", flexShrink: 0,
            }}>
                {skill.sections.slice(0, 5).map((sec, i) => (
                    <span key={sec} style={{
                        padding: "4px 8px", fontSize: 8, fontFamily: T.mono,
                        color: i === 0 ? T.fg : T.fgDim, fontWeight: i === 0 ? 600 : 400,
                        borderBottom: i === 0 ? `2px solid ${cat.color}` : "2px solid transparent",
                        textTransform: "uppercase" as const, letterSpacing: 0.6,
                        whiteSpace: "nowrap" as const,
                    }}>
                        {sec}
                    </span>
                ))}
            </div>

            {/* Markdown content — auto-scrolling */}
            <div style={{
                flex: 1, padding: "8px 0", overflow: "hidden",
                fontFamily: T.mono, fontSize: 10, lineHeight: 1.6,
            }}>
                <AnimatePresence mode="popLayout">
                    {visibleLines.map((line, i) => (
                        <motion.div
                            key={`${scrollOffset}-${i}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2, delay: i * 0.02 }}
                            style={{
                                padding: "0 14px",
                                display: "flex", gap: 10,
                                minHeight: 16,
                            }}
                        >
                            <span style={{ color: T.fgDim, fontSize: 8, width: 20, textAlign: "right" as const, flexShrink: 0, fontFamily: T.mono, opacity: 0.5 }}>
                                {scrollOffset + i + 1}
                            </span>
                            <span style={{ fontFamily: T.mono }}>
                                {highlightLine(line)}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Footer: skill name + description */}
            <div style={{
                padding: "8px 14px", borderTop: `1px solid ${T.border}`,
                background: T.surfaceMuted, flexShrink: 0,
            }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.fg, fontFamily: T.mono, marginBottom: 2 }}>
                    {skill.name}
                </div>
                <div style={{ fontSize: 9, color: T.fgMuted, fontFamily: T.mono, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                    {skill.description}
                </div>
            </div>
        </div>
    )
}

/* ═══ MAIN ═══ */

interface Props {
    autoRotate?: boolean
    interval?: number
}

export default function MemoireNotesGrid({
    autoRotate = true,
    interval = 6000,
}: Props) {
    const [active, setActive] = useState(0)
    const [direction, setDirection] = useState(1)
    const prevRef = useRef(0)

    function goTo(i: number) {
        setDirection(i > prevRef.current ? 1 : -1)
        prevRef.current = i
        setActive(i)
    }

    useEffect(() => {
        if (!autoRotate) return
        const id = setInterval(() => {
            goTo((prevRef.current + 1) % SKILLS.length)
        }, interval)
        return () => clearInterval(id)
    }, [autoRotate, interval])

    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column" as const, gap: 12, fontFamily: T.mono }}>

            {/* Carousel: active skill viewer */}
            <div style={{ position: "relative", height: 420, overflow: "hidden" }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={active}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        style={{ position: "absolute", inset: 0 }}
                    >
                        <FileViewer skill={SKILLS[active]} isActive={true} />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Skill selector pills */}
            <div style={{ display: "flex", gap: 4, justifyContent: "center", flexShrink: 0 }}>
                {SKILLS.map((skill, i) => {
                    const cat = CATEGORY_STYLES[skill.category] || CATEGORY_STYLES.craft
                    const isActive = i === active
                    return (
                        <motion.button
                            key={skill.name}
                            onClick={() => setActive(i)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.96 }}
                            animate={{
                                background: isActive ? cat.color : T.surface,
                                color: isActive ? "#ffffff" : T.fgMuted,
                                borderColor: isActive ? cat.color : T.border,
                            }}
                            transition={{ duration: 0.25 }}
                            style={{
                                display: "flex", alignItems: "center", gap: 6,
                                padding: isActive ? "6px 16px" : "6px 12px",
                                borderRadius: 999, cursor: "pointer",
                                border: "1px solid",
                                fontFamily: T.mono, fontSize: 10, fontWeight: isActive ? 600 : 400,
                                outline: "none",
                                letterSpacing: 0.2,
                                boxShadow: isActive ? `0 2px 12px ${cat.color}40` : "none",
                            }}
                        >
                            {skill.name}
                            {isActive && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 0.8, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    style={{ fontSize: 8, overflow: "hidden", whiteSpace: "nowrap" as const }}
                                >
                                    {skill.lines}L
                                </motion.span>
                            )}
                        </motion.button>
                    )
                })}
            </div>

            {/* Progress bar */}
            {autoRotate && (
                <div style={{ height: 2, borderRadius: 1, background: T.border, overflow: "hidden", flexShrink: 0 }}>
                    <motion.div
                        key={active}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: interval / 1000, ease: "linear" }}
                        style={{
                            height: "100%", borderRadius: 1,
                            background: `linear-gradient(90deg, ${CATEGORY_STYLES[SKILLS[active].category]?.color || T.fgDim}, ${T.rose})`,
                        }}
                    />
                </div>
            )}
        </div>
    )
}

addPropertyControls(MemoireNotesGrid, {
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: true,
    },
    interval: {
        type: ControlType.Number,
        title: "Interval (ms)",
        defaultValue: 6000,
        min: 2000,
        max: 15000,
        step: 500,
    },
})
