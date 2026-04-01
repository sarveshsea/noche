// Memoire CLI Terminal Scroll — Framer Code Component
// 1:1 replica of the memoire.cv terminal demo with scroll-driven reveal.

import React, { useRef } from "react"
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    MotionValue,
} from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/* ═══ TOKENS ═══ */

const C = {
    bg: "#fafaf9",
    fg: "#0a0a0a",
    fgMuted: "#8a8a8a",
    fgDim: "#b0b0b0",
    border: "rgba(0,0,0,0.08)",
    green: "#1a8a30",
    blue: "#2563eb",
    purple: "#7c3aed",
    amber: "#b8860b",
    chrome: "#f2f1ef",
    mono: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
}

/* ═══ HELPERS ═══ */

function useRange(
    scrollY: MotionValue<number>,
    start: number,
    end: number,
    springCfg?: { stiffness: number; damping: number }
) {
    const raw = useTransform(scrollY, [start, end], [0, 1])
    return springCfg ? useSpring(raw, springCfg) : raw
}

/* ═══ TERMINAL DATA ═══ */

type LineKind =
    | "cmd"
    | "output"
    | "output-dim"
    | "highlight"
    | "divider"
    | "spacer"
    | "final"

type PartStyle =
    | "ok"
    | "work"
    | "info"
    | "highlight"
    | "num"
    | "file"
    | "agent"
    | "tag"
    | "cmd-ref"
    | "dim"

interface TermLine {
    kind: LineKind
    cmd?: string
    parts?: Array<{ text: string; style?: PartStyle }>
    dividerText?: string
}

const LINES: TermLine[] = [
    { kind: "cmd", cmd: "memi connect" },
    {
        kind: "output-dim",
        parts: [{ text: "  Scanning ports 9223-9232..." }],
    },
    {
        kind: "highlight",
        parts: [
            { text: "  ", style: "ok" },
            { text: "+ " },
            { text: "Figma bridge connected", style: "highlight" },
            { text: " on :9224" },
        ],
    },
    {
        kind: "output-dim",
        parts: [
            { text: "  ", style: "info" },
            { text: "\u00b7 Ready - run " },
            { text: "memi pull", style: "cmd-ref" },
            { text: " in another terminal" },
        ],
    },

    { kind: "divider", dividerText: "DESIGN SYSTEM" },

    { kind: "cmd", cmd: "memi pull" },
    {
        kind: "output-dim",
        parts: [{ text: "  Extracting design system..." }],
    },
    {
        kind: "output-dim",
        parts: [
            { text: "  ", style: "ok" },
            { text: "+ Tokens: " },
            { text: "171", style: "num" },
            { text: " (color 50, spacing 12, type 8)" },
        ],
    },
    {
        kind: "output-dim",
        parts: [
            { text: "  ", style: "ok" },
            { text: "+ Components: " },
            { text: "23", style: "num" },
            { text: " via Code Connect" },
        ],
    },
    {
        kind: "highlight",
        parts: [
            { text: "  ", style: "ok" },
            { text: "+ " },
            { text: "Design system saved", style: "highlight" },
            { text: " in 1.2s" },
        ],
    },

    { kind: "divider", dividerText: "SPEC + GENERATE" },

    {
        kind: "cmd",
        cmd: "memi spec component UserProfileCard --level organism",
    },
    {
        kind: "output-dim",
        parts: [
            {
                text: "  Composing: Avatar (atom) + Badge (atom) + Button (atom)",
            },
        ],
    },
    {
        kind: "highlight",
        parts: [
            { text: "  ", style: "ok" },
            { text: "+ " },
            { text: "Spec created", style: "highlight" },
            { text: " .memoire/specs/UserProfileCard.json" },
        ],
    },

    { kind: "spacer" },

    { kind: "cmd", cmd: "memi generate UserProfileCard" },
    {
        kind: "output-dim",
        parts: [{ text: "  Reading spec... validating atomic rules..." }],
    },
    {
        kind: "output-dim",
        parts: [
            { text: "  ", style: "ok" },
            { text: "+ Generated " },
            {
                text: "components/organisms/UserProfileCard.tsx",
                style: "file",
            },
        ],
    },
    {
        kind: "output-dim",
        parts: [
            { text: "  ", style: "ok" },
            { text: "+ shadcn/ui + Tailwind + TypeScript strict" },
        ],
    },
    {
        kind: "highlight",
        parts: [
            { text: "  ", style: "ok" },
            { text: "+ " },
            { text: "Code generated", style: "highlight" },
            { text: " - atomic level: organism" },
        ],
    },

    { kind: "divider", dividerText: "AUTONOMOUS AGENT" },

    {
        kind: "cmd",
        cmd: 'memi compose "build a dashboard with charts for research data"',
    },
    {
        kind: "output-dim",
        parts: [
            { text: "  ~ Intent: " },
            { text: "page-layout", style: "tag" },
            { text: " " },
            { text: "dataviz", style: "tag" },
            { text: " " },
            { text: "research", style: "tag" },
        ],
    },
    {
        kind: "output-dim",
        parts: [
            {
                text: "  ~ Building execution DAG... 3 sub-tasks",
                style: "dim",
            },
        ],
    },
    {
        kind: "output-dim",
        parts: [
            { text: "  ", style: "ok" },
            { text: "+ " },
            { text: "layout-designer", style: "agent" },
            { text: " DashboardTemplate created" },
        ],
    },
    {
        kind: "output-dim",
        parts: [
            { text: "  ", style: "ok" },
            { text: "+ " },
            { text: "dataviz-builder", style: "agent" },
            { text: " 4 chart components generated" },
        ],
    },
    {
        kind: "output-dim",
        parts: [
            { text: "  ", style: "ok" },
            { text: "+ " },
            { text: "component-architect", style: "agent" },
            { text: " page assembled" },
        ],
    },
    {
        kind: "output-dim",
        parts: [
            { text: "  ", style: "ok" },
            { text: "+ Self-healing: screenshot + validate (pass 1/1)" },
        ],
    },
    {
        kind: "highlight",
        parts: [
            { text: "  ", style: "ok" },
            { text: "+ " },
            { text: "Dashboard complete", style: "highlight" },
            { text: " - 5 files, preview at localhost:5173" },
        ],
    },

    { kind: "divider", dividerText: "HEALTH CHECK" },

    { kind: "cmd", cmd: "memi doctor" },
    { kind: "spacer" },
    {
        kind: "output-dim",
        parts: [
            { text: "  ", style: "ok" },
            { text: "+ Project: vite + Tailwind" },
        ],
    },
    {
        kind: "output-dim",
        parts: [
            { text: "  ", style: "ok" },
            { text: "+ Design system: 171 tokens" },
        ],
    },
    {
        kind: "output-dim",
        parts: [
            { text: "  ", style: "ok" },
            { text: "+ Specs: 5 valid (component: 2, page: 1, dataviz: 2)" },
        ],
    },
    {
        kind: "output-dim",
        parts: [
            { text: "  ", style: "ok" },
            { text: "+ Figma bridge: connected on :9224" },
        ],
    },
    {
        kind: "output-dim",
        parts: [
            { text: "  ", style: "ok" },
            { text: "+ Preview: 7 pages" },
        ],
    },
    {
        kind: "output-dim",
        parts: [
            { text: "  ", style: "ok" },
            { text: "+ Code Connect: 23 mappings" },
        ],
    },
    {
        kind: "output-dim",
        parts: [
            { text: "  ", style: "ok" },
            { text: "+ Workspace: .memoire/ OK" },
        ],
    },
    { kind: "spacer" },
    {
        kind: "highlight",
        parts: [
            { text: "  " },
            { text: "7 passed, 0 warnings, 0 failed", style: "highlight" },
        ],
    },

    { kind: "final" },
]

/* ═══ STYLE MAP ═══ */

function partStyle(s?: string): React.CSSProperties {
    switch (s) {
        case "ok":
            return {
                color: C.green,
                display: "inline-block",
                width: 14,
                textAlign: "center",
            }
        case "work":
            return {
                color: C.amber,
                display: "inline-block",
                width: 14,
                textAlign: "center",
            }
        case "info":
            return {
                color: C.fgDim,
                display: "inline-block",
                width: 14,
                textAlign: "center",
            }
        case "highlight":
            return { color: C.fg, fontWeight: 600 }
        case "num":
            return { color: C.fg, fontWeight: 500 }
        case "file":
            return { color: C.blue }
        case "agent":
            return { color: C.purple, fontSize: 11 }
        case "cmd-ref":
            return { color: C.fg, fontWeight: 500 }
        case "dim":
            return { color: C.fgMuted }
        case "tag":
            return {
                fontSize: 10,
                padding: "1px 6px",
                background: "rgba(0,0,0,0.04)",
                borderRadius: 2,
                color: C.fgMuted,
                marginRight: 2,
                display: "inline-block",
            }
        default:
            return {}
    }
}

/* ═══ BLINKING CURSOR ═══ */

function Cursor({ visible }: { visible: MotionValue<number> }) {
    return (
        <motion.span style={{ opacity: visible }}>
            <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    repeatType: "reverse",
                }}
                style={{
                    display: "inline-block",
                    width: 7,
                    height: 15,
                    background: C.fg,
                    marginLeft: 1,
                    verticalAlign: "text-bottom",
                    flexShrink: 0,
                }}
            />
        </motion.span>
    )
}

/* ═══ SCROLL-REVEALED LINE ═══ */

function RevealLine({
    line,
    index,
    scrollY,
    total,
}: {
    line: TermLine
    index: number
    scrollY: MotionValue<number>
    total: number
}) {
    const spring = { stiffness: 80, damping: 22 }
    const start = index / total
    const end = (index + 0.6) / total
    const p = useRange(scrollY, start, end, spring)
    const opacity = useTransform(p, [0, 0.3, 1], [0, 0.5, 1])
    const x = useTransform(p, [0, 1], [-8, 0])

    // Cursor visibility: show from this cmd until next cmd appears
    const isCmd = line.kind === "cmd" || line.kind === "final"
    const nextCmdAt = (() => {
        for (let i = index + 1; i < total; i++) {
            if (LINES[i].kind === "cmd" || LINES[i].kind === "final")
                return i / total
        }
        return 1
    })()
    const cursorVisible = useTransform(
        scrollY,
        [start, nextCmdAt - 0.001, nextCmdAt],
        [1, 1, 0]
    )

    if (line.kind === "spacer") {
        return <motion.div style={{ height: 6, opacity }} />
    }

    if (line.kind === "divider") {
        return (
            <motion.div
                style={{
                    opacity,
                    x,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    margin: "12px 0 8px",
                }}
            >
                <span
                    style={{ flex: 1, height: 1, background: C.border }}
                />
                <span
                    style={{
                        fontSize: 8,
                        letterSpacing: 2,
                        color: C.fgDim,
                    }}
                >
                    {line.dividerText}
                </span>
                <span
                    style={{ flex: 1, height: 1, background: C.border }}
                />
            </motion.div>
        )
    }

    if (line.kind === "cmd") {
        return (
            <motion.div
                style={{
                    opacity,
                    x,
                    display: "flex",
                    alignItems: "center",
                    whiteSpace: "nowrap" as const,
                }}
            >
                <span style={{ color: C.fgDim }}>~/project</span>
                &nbsp;
                <span style={{ color: C.fg, fontWeight: 500 }}>
                    {line.cmd}
                </span>
                <Cursor visible={cursorVisible} />
            </motion.div>
        )
    }

    if (line.kind === "final") {
        return (
            <motion.div
                style={{
                    opacity,
                    x,
                    display: "flex",
                    alignItems: "center",
                    marginTop: 4,
                }}
            >
                <span style={{ color: C.fgDim }}>~/project</span>
                &nbsp;
                <Cursor visible={cursorVisible} />
            </motion.div>
        )
    }

    const isDim = line.kind === "output-dim"
    return (
        <motion.div
            style={{
                opacity,
                x,
                color: isDim ? C.fgMuted : C.fg,
                whiteSpace: "nowrap" as const,
                overflow: "hidden",
            }}
        >
            {line.parts?.map((p, i) => (
                <span key={i} style={partStyle(p.style)}>
                    {p.text}
                </span>
            ))}
        </motion.div>
    )
}

/* ═══ MAIN ═══ */

interface Props {
    scrollHeight?: number
    navHeight?: number
}

export default function MemoireTerminalScroll({
    scrollHeight = 5000,
    navHeight = 0,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    })

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: scrollHeight,
                fontFamily: C.mono,
            }}
        >
            <div
                style={{
                    position: "sticky",
                    top: 0,
                    width: "100%",
                    height: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    paddingTop: navHeight,
                    boxSizing: "border-box" as const,
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column" as const,
                        overflow: "hidden",
                    }}
                >
                    {/* Chrome */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "10px 16px",
                            background: C.chrome,
                            borderBottom: `1px solid ${C.border}`,
                            flexShrink: 0,
                        }}
                    >
                        <div style={{ display: "flex", gap: 6 }}>
                            <div
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: "50%",
                                    background: "#ff5f57",
                                }}
                            />
                            <div
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: "50%",
                                    background: "#febc2e",
                                }}
                            />
                            <div
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: "50%",
                                    background: "#28c840",
                                }}
                            />
                        </div>
                        <div
                            style={{
                                fontSize: 9,
                                letterSpacing: 2,
                                color: C.fgMuted,
                                marginLeft: 12,
                                flex: 1,
                            }}
                        >
                            MEMOIRE CLI
                        </div>
                    </div>

                    {/* Terminal body */}
                    <div
                        style={{
                            padding: "24px 28px",
                            flex: 1,
                            overflow: "hidden",
                            fontFamily: C.mono,
                            fontSize: 12,
                            lineHeight: 1.7,
                            background: C.bg,
                        }}
                    >
                        {LINES.map((line, i) => (
                            <RevealLine
                                key={i}
                                line={line}
                                index={i}
                                scrollY={scrollYProgress}
                                total={LINES.length}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(MemoireTerminalScroll, {
    scrollHeight: {
        type: ControlType.Number,
        title: "Scroll Height",
        defaultValue: 5000,
        min: 2000,
        max: 10000,
        step: 500,
    },
    navHeight: {
        type: ControlType.Number,
        title: "Nav Height",
        defaultValue: 0,
        min: 0,
        max: 120,
    },
})
