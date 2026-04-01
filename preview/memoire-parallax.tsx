// Memoire Parallax Scroll — Framer Code Component
// CLI + Figma Plugin spiral-in like a drawer cabinet. No agent strip.

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

const T = {
    bg: "#f5f3ef",
    surface: "#ffffff",
    surfaceMuted: "#f3f0eb",
    inset: "#e9e5de",
    fg: "#1a1816",
    fgSecondary: "#5c554c",
    fgDim: "#8a8279",
    fgFaint: "#b5aea5",
    accent: "#c05a2c",
    accentSoft: "rgba(192,90,44,0.10)",
    green: "#2d7a4f",
    greenSoft: "rgba(45,122,79,0.07)",
    greenStrong: "rgba(45,122,79,0.18)",
    yellow: "#9b7420",
    yellowSoft: "rgba(155,116,32,0.07)",
    yellowStrong: "rgba(155,116,32,0.18)",
    blue: "#3d6eb5",
    border: "rgba(26,24,22,0.08)",
    borderStrong: "rgba(26,24,22,0.14)",
    termBg: "#faf9f7",
    termSurface: "#f5f3ef",
    termFg: "#1a1816",
    termDim: "#8a8279",
    termGreen: "#2d7a4f",
    termYellow: "#9b7420",
    termAccent: "#c05a2c",
    termBlue: "#3d6eb5",
    termBorder: "rgba(26,24,22,0.10)",
    mono: "'SF Mono', ui-monospace, 'SFMono-Regular', 'Cascadia Code', Menlo, Monaco, Consolas, monospace",
    shadow: "0 4px 24px rgba(0,0,0,0.06)",
    shadowLg: "0 8px 40px rgba(0,0,0,0.08)",
    glassBg: "rgba(255,255,255,0.5)",
    glassBorder: "rgba(26,24,22,0.08)",
}

/* ═══ HELPERS ═══ */

const txt = (size: number, color: string, weight = 400): React.CSSProperties => ({
    fontSize: size, color, fontWeight: weight, fontFamily: T.mono, lineHeight: 1.4,
})

const row = (gap = 0, align = "center"): React.CSSProperties => ({
    display: "flex", alignItems: align, gap,
})

function useRange(
    scrollY: MotionValue<number>,
    start: number,
    end: number,
    springCfg?: { stiffness: number; damping: number },
) {
    const raw = useTransform(scrollY, [start, end], [0, 1])
    return springCfg ? useSpring(raw, springCfg) : raw
}

/* ═══ SCROLL PROMPT ═══ */

function ScrollPrompt({ scrollY, text, color }: { scrollY: MotionValue<number>; text: string; color: string }) {
    const p = useRange(scrollY, 0, 0.08)
    const opacity = useTransform(p, [0, 0.3, 1], [1, 0.3, 0])
    const y = useTransform(p, [0, 1], [0, -20])
    return (
        <motion.div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 12, opacity, y, pointerEvents: "none" as const, zIndex: 10 }}>
            <span style={{ ...txt(14, color, 400), letterSpacing: "0.06em" }}>{text}</span>
            <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
            </motion.div>
        </motion.div>
    )
}

/* ═══ BRAND FLOWER ═══ */

function Flower({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="2.5" fill="#c05a2c" />
            <ellipse cx="12" cy="6" rx="2.8" ry="4.5" stroke="#c05a2c" strokeWidth="1.2" opacity="0.7" fill="none" />
            <ellipse cx="12" cy="18" rx="2.8" ry="4.5" stroke="#c05a2c" strokeWidth="1.2" opacity="0.7" fill="none" />
            <ellipse cx="6" cy="12" rx="4.5" ry="2.8" stroke="#c05a2c" strokeWidth="1.2" opacity="0.7" fill="none" />
            <ellipse cx="18" cy="12" rx="4.5" ry="2.8" stroke="#c05a2c" strokeWidth="1.2" opacity="0.7" fill="none" />
            <ellipse cx="7.8" cy="7.8" rx="3.2" ry="2.2" transform="rotate(-45 7.8 7.8)" stroke="#c05a2c" strokeWidth="1" opacity="0.3" fill="none" />
            <ellipse cx="16.2" cy="16.2" rx="3.2" ry="2.2" transform="rotate(-45 16.2 16.2)" stroke="#c05a2c" strokeWidth="1" opacity="0.3" fill="none" />
            <ellipse cx="16.2" cy="7.8" rx="3.2" ry="2.2" transform="rotate(45 16.2 7.8)" stroke="#c05a2c" strokeWidth="1" opacity="0.3" fill="none" />
            <ellipse cx="7.8" cy="16.2" rx="3.2" ry="2.2" transform="rotate(45 7.8 16.2)" stroke="#c05a2c" strokeWidth="1" opacity="0.3" fill="none" />
        </svg>
    )
}

/* ═══ TERMINAL LINE ═══ */

function TermLine({ parts }: { parts: Array<{ text: string; color: string; weight?: number }> }) {
    return (
        <div style={{ display: "flex", gap: 0, minHeight: 17, flexWrap: "wrap" as const }}>
            {parts.map((p, i) => (
                <span key={i} style={{ color: p.color, fontWeight: p.weight || 400 }}>{p.text}</span>
            ))}
        </div>
    )
}

/* ═══ CHIP ═══ */

function Chip({ label, color, bg, border }: { label: string; color: string; bg: string; border: string }) {
    return (
        <span style={{ display: "inline-flex", padding: "1px 6px", borderRadius: 4, border: `1px solid ${border}`, background: bg, fontSize: 8, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" as const, color, fontFamily: T.mono }}>
            {label}
        </span>
    )
}

/* ═══ AGENT PILL ═══ */

function AgentPill({ name, dotColor }: { name: string; dotColor: string }) {
    return (
        <div style={{ ...row(4), padding: "2px 7px", borderRadius: 4, border: `1px solid ${T.border}`, background: T.surface, fontSize: 8.5, fontWeight: 500, color: T.fgSecondary, fontFamily: T.mono }}>
            <div style={{ width: 5, height: 5, borderRadius: 999, background: dotColor, flexShrink: 0 }} />
            {name}
        </div>
    )
}

/* ═══ RUNNING BAR ═══ */

function RunningBar({ color }: { color: string }) {
    return (
        <motion.div
            animate={{ scaleX: [0, 0.7, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ height: 2, background: color, borderRadius: 1, marginTop: 4, transformOrigin: "left" }}
        />
    )
}

/* ═══ SCROLL-REVEALED LINE ═══ */

function RevealLine({ scrollY, enter, children, style }: { scrollY: MotionValue<number>; enter: [number, number]; children: React.ReactNode; style?: React.CSSProperties }) {
    const spring = { stiffness: 80, damping: 22 }
    const p = useRange(scrollY, enter[0], enter[1], spring)
    const opacity = useTransform(p, [0, 0.2, 1], [0, 0.5, 1])
    const y = useTransform(p, [0, 1], [6, 0])
    return <motion.div style={{ opacity, y, ...style }}>{children}</motion.div>
}

/* ═══════════════════════════════════════════════ */
/* ═══ MAIN COMPONENT ═══ */
/* ═══════════════════════════════════════════════ */

interface Props {
    scrollHeight?: number
    navHeight?: number
    promptText?: string
    promptColor?: string
    titleColor?: string
    accentColor?: string
    logoSize?: number
}

export default function MemoireParallax({
    scrollHeight = 6000,
    navHeight = 60,
    promptText = "Scroll to explore",
    promptColor = "#b5aea5",
    titleColor = "#1a1816",
    accentColor = "#c05a2c",
    logoSize = 80,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    })

    const spring = { stiffness: 60, damping: 20 }

    // ── CLI panel: spirals in from left — cabinet drawer + clockwise spin ──
    const cliP = useRange(scrollYProgress, 0.06, 0.28, spring)
    const cliOpacity = useTransform(cliP, [0, 0.15, 0.5, 1], [0, 0.3, 0.8, 1])
    const cliRotateY = useTransform(cliP, [0, 1], [-70, 0])
    const cliRotateZ = useTransform(cliP, [0, 1], [-8, 0])
    const cliX = useTransform(cliP, [0, 1], [-300, 0])
    const cliScale = useTransform(cliP, [0, 1], [0.75, 1])

    // ── Plugin panel: spirals in from right — opposite rotation + counter-clockwise ──
    const pluginP = useRange(scrollYProgress, 0.10, 0.32, spring)
    const pluginOpacity = useTransform(pluginP, [0, 0.15, 0.5, 1], [0, 0.3, 0.8, 1])
    const pluginRotateY = useTransform(pluginP, [0, 1], [70, 0])
    const pluginRotateZ = useTransform(pluginP, [0, 1], [8, 0])
    const pluginX = useTransform(pluginP, [0, 1], [300, 0])
    const pluginScale = useTransform(pluginP, [0, 1], [0.75, 1])

    // ── Terminal line reveals (after panels land) ──
    const tl = Array.from({ length: 10 }, (_, i) =>
        [0.28 + i * 0.03, 0.34 + i * 0.03] as [number, number]
    )

    const progressP = useRange(scrollYProgress, 0.52, 0.62, spring)
    const progressW = useTransform(progressP, [0, 1], ["0%", "100%"])

    // ── Compose section ──
    const composeEnter: [number, number] = [0.58, 0.66]
    const agentEnter = Array.from({ length: 3 }, (_, i) =>
        [0.64 + i * 0.03, 0.70 + i * 0.03] as [number, number]
    )
    const agentP = agentEnter.map(([s, e]) => useRange(scrollYProgress, s, e, spring))

    const codeP = useRange(scrollYProgress, 0.74, 0.82, spring)
    const codeClip = useTransform(codeP, (v: number) => `inset(0 ${(1 - v) * 100}% 0 0)`)

    // ── Plugin card reveals ──
    const pluginCardEnters: [number, number][] = [
        [0.30, 0.40], [0.34, 0.44], [0.38, 0.48],
        [0.42, 0.52], [0.46, 0.56], [0.50, 0.60],
    ]

    return (
        <div ref={containerRef} style={{ position: "relative", width: "100%", height: scrollHeight, fontFamily: T.mono }}>
            <div style={{
                position: "sticky", top: 0, width: "100%", height: "100vh",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", paddingTop: navHeight, boxSizing: "border-box" as const,
                perspective: 1200,
            }}>


                {/* ═══ HERO: Logo + Brand + Prompt ═══ */}
                <motion.div style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column" as const,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0,
                    opacity: useTransform(useRange(scrollYProgress, 0, 0.08), [0, 0.5, 1], [1, 0.3, 0]),
                    scale: useTransform(useRange(scrollYProgress, 0, 0.12), [0, 1], [1, 0.6]),
                    y: useTransform(useRange(scrollYProgress, 0, 0.12), [0, 1], [0, -100]),
                    pointerEvents: "none" as const,
                    zIndex: 10,
                }}>
                    {/* Spinning flower with pulse rings */}
                    <div style={{ position: "relative", marginBottom: 32 }}>
                        <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0.12, 0, 0.12] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                            style={{ position: "absolute", inset: -24, borderRadius: "50%", border: "1px solid #d4a0a0", pointerEvents: "none" }}
                        />
                        <motion.div
                            animate={{ scale: [1.2, 1.8, 1.2], opacity: [0.06, 0, 0.06] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                            style={{ position: "absolute", inset: -40, borderRadius: "50%", border: "1px solid #c48a8a", pointerEvents: "none" }}
                        />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        >
                            {/* Brand flower — memoire-web nav palette */}
                            <svg width={logoSize} height={logoSize} viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="2.5" fill="#b07070" />
                                <ellipse cx="12" cy="6" rx="2.8" ry="4.5" stroke="#d4a0a0" strokeWidth="1.2" opacity="0.8" fill="none" />
                                <ellipse cx="12" cy="18" rx="2.8" ry="4.5" stroke="#d4a0a0" strokeWidth="1.2" opacity="0.8" fill="none" />
                                <ellipse cx="6" cy="12" rx="4.5" ry="2.8" stroke="#d4a0a0" strokeWidth="1.2" opacity="0.8" fill="none" />
                                <ellipse cx="18" cy="12" rx="4.5" ry="2.8" stroke="#d4a0a0" strokeWidth="1.2" opacity="0.8" fill="none" />
                                <ellipse cx="7.8" cy="7.8" rx="3.2" ry="2.2" transform="rotate(-45 7.8 7.8)" stroke="#c48a8a" strokeWidth="1" opacity="0.5" fill="none" />
                                <ellipse cx="16.2" cy="16.2" rx="3.2" ry="2.2" transform="rotate(-45 16.2 16.2)" stroke="#c48a8a" strokeWidth="1" opacity="0.5" fill="none" />
                                <ellipse cx="16.2" cy="7.8" rx="3.2" ry="2.2" transform="rotate(45 16.2 7.8)" stroke="#c48a8a" strokeWidth="1" opacity="0.5" fill="none" />
                                <ellipse cx="7.8" cy="16.2" rx="3.2" ry="2.2" transform="rotate(45 7.8 16.2)" stroke="#c48a8a" strokeWidth="1" opacity="0.5" fill="none" />
                            </svg>
                        </motion.div>
                    </div>

                    {/* Brand name — memoire-web gradient: gold → taupe → mauve → plum */}
                    <span style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: 42,
                        fontWeight: 300,
                        fontStyle: "italic",
                        letterSpacing: 6,
                        background: "linear-gradient(135deg, #edd2ad 0%, #d8ae90 34%, #b58786 68%, #7f6675 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        marginBottom: 24,
                        textShadow: "none",
                    }}>
                        m&#233;moire
                    </span>

                    {/* Thin separator */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: 56 }}
                        transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        style={{ height: 1, background: "linear-gradient(90deg, transparent, #d4a0a0, transparent)", marginBottom: 24, opacity: 0.5 }}
                    />

                    {/* Prompt text */}
                    <span style={{
                        fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
                        fontSize: 10,
                        fontWeight: 400,
                        color: promptColor,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase" as const,
                        marginBottom: 20,
                    }}>
                        {promptText}
                    </span>

                    {/* Double chevron */}
                    <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 1 }}>
                        <motion.div
                            animate={{ y: [0, 5, 0], opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b07070" strokeWidth="1.2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
                        </motion.div>
                        <motion.div
                            animate={{ y: [0, 5, 0], opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c48a8a" strokeWidth="1.2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
                        </motion.div>
                    </div>
                </motion.div>

                <div style={{ width: "90%", maxWidth: 1060, position: "relative" }}>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>

                        {/* ─── LEFT: CLI — spirals in from left ─── */}
                        <motion.div style={{
                            opacity: cliOpacity,
                            rotateY: cliRotateY,
                            rotateZ: cliRotateZ,
                            x: cliX,
                            scale: cliScale,
                            transformOrigin: "right center",
                            transformStyle: "preserve-3d" as const,
                            filter: useTransform(cliP, (v: number) => `drop-shadow(0 ${Math.round(v * 12)}px ${Math.round(v * 30)}px rgba(0,0,0,${(v * 0.08).toFixed(2)}))`),
                        }}>
                            <div style={{ borderRadius: 10, overflow: "hidden", background: T.termBg, border: `1px solid ${T.termBorder}`, boxShadow: T.shadowLg }}>

                                {/* Titlebar */}
                                <div style={{ ...row(6), padding: "7px 12px", borderBottom: `1px solid ${T.termBorder}`, background: T.termSurface }}>
                                    <div style={row(5)}>
                                        <div style={{ width: 9, height: 9, borderRadius: 999, background: "#ff5f56" }} />
                                        <div style={{ width: 9, height: 9, borderRadius: 999, background: "#ffbd2e" }} />
                                        <div style={{ width: 9, height: 9, borderRadius: 999, background: "#27c93f" }} />
                                    </div>
                                    <span style={{ fontSize: 10, color: T.termDim, fontWeight: 500, marginLeft: 10, fontFamily: T.mono }}>memoire</span>
                                </div>

                                {/* Body */}
                                <div style={{ padding: "10px 12px", fontSize: 10.5, fontFamily: T.mono, color: T.termFg, minHeight: 320 }}>

                                    <RevealLine scrollY={scrollYProgress} enter={tl[0]}>
                                        <TermLine parts={[{ text: "$ ", color: T.termAccent, weight: 600 }, { text: "memi connect", color: T.termFg, weight: 500 }]} />
                                    </RevealLine>
                                    <RevealLine scrollY={scrollYProgress} enter={tl[1]}>
                                        <TermLine parts={[{ text: "  Scanning ports 9223\u20139232...", color: T.termDim }]} />
                                    </RevealLine>
                                    <RevealLine scrollY={scrollYProgress} enter={tl[2]}>
                                        <TermLine parts={[{ text: "  Connected to Figma on :9224 (3ms)", color: T.termGreen }]} />
                                    </RevealLine>

                                    <RevealLine scrollY={scrollYProgress} enter={tl[3]} style={{ marginTop: 8 }}>
                                        <TermLine parts={[{ text: "$ ", color: T.termAccent, weight: 600 }, { text: "memi pull", color: T.termFg, weight: 500 }]} />
                                    </RevealLine>
                                    <RevealLine scrollY={scrollYProgress} enter={tl[4]}>
                                        <TermLine parts={[{ text: "  Pulling design system...", color: T.termAccent }]} />
                                    </RevealLine>
                                    <RevealLine scrollY={scrollYProgress} enter={tl[5]}>
                                        <TermLine parts={[{ text: "  42 tokens", color: T.termGreen }, { text: "  extracted", color: T.termDim }]} />
                                    </RevealLine>
                                    <RevealLine scrollY={scrollYProgress} enter={tl[6]}>
                                        <TermLine parts={[{ text: "  24 components", color: T.termGreen }, { text: "  mapped", color: T.termDim }]} />
                                    </RevealLine>
                                    <RevealLine scrollY={scrollYProgress} enter={tl[7]}>
                                        <TermLine parts={[{ text: "  8 styles", color: T.termGreen }, { text: "  synced", color: T.termDim }]} />
                                    </RevealLine>

                                    <RevealLine scrollY={scrollYProgress} enter={tl[8]} style={{ marginTop: 6 }}>
                                        <div style={{ ...row(4), paddingLeft: 12 }}>
                                            <span style={{ color: T.termGreen }}>+6 new</span>
                                            <span style={{ color: T.termDim }}>&middot;</span>
                                            <span style={{ color: T.termYellow }}>2 changed</span>
                                            <span style={{ color: T.termDim }}>&middot;</span>
                                            <span style={{ color: T.termDim }}>0 removed</span>
                                        </div>
                                    </RevealLine>

                                    <RevealLine scrollY={scrollYProgress} enter={tl[9]} style={{ marginTop: 8 }}>
                                        <div style={row(6)}>
                                            <span style={{ color: T.termDim, fontSize: 9 }}>SYNC</span>
                                            <div style={{ flex: 1, height: 3, borderRadius: 2, background: T.inset, overflow: "hidden" }}>
                                                <motion.div style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg, ${T.termAccent}, ${T.termGreen})`, width: progressW }} />
                                            </div>
                                            <span style={{ color: T.termGreen, fontSize: 9 }}>Done</span>
                                        </div>
                                    </RevealLine>

                                    {/* memi compose */}
                                    <RevealLine scrollY={scrollYProgress} enter={composeEnter} style={{ marginTop: 12 }}>
                                        <TermLine parts={[{ text: "$ ", color: T.termAccent, weight: 600 }, { text: 'memi compose "generate button variants"', color: T.termFg, weight: 500 }]} />
                                        <div style={{ marginTop: 3, paddingLeft: 12 }}>
                                            <TermLine parts={[{ text: "Classifying intent...", color: T.termDim }]} />
                                            <div style={{ marginTop: 2 }}>
                                                <TermLine parts={[{ text: "Plan:", color: T.termAccent, weight: 500 }]} />
                                                {["1. Pull latest tokens", "2. Create component spec", "3. Generate shadcn/ui code", "4. Validate output"].map((step) => (
                                                    <TermLine key={step} parts={[{ text: `  ${step}`, color: T.termDim }]} />
                                                ))}
                                            </div>
                                        </div>
                                    </RevealLine>

                                    {/* Agent dispatch */}
                                    <RevealLine scrollY={scrollYProgress} enter={[0.64, 0.72]} style={{ marginTop: 8 }}>
                                        <TermLine parts={[{ text: "  Dispatching to agents...", color: T.termYellow }]} />
                                        <div style={{ marginTop: 3, display: "flex", flexDirection: "column" as const, gap: 1 }}>
                                            {["token-engineer", "component-architect", "code-generator"].map((agent, i) => (
                                                <motion.div key={agent} style={{ opacity: useTransform(agentP[i], [0, 1], [0, 1]), x: useTransform(agentP[i], [0, 1], [-16, 0]) }}>
                                                    <div style={{ ...row(5), paddingLeft: 14 }}>
                                                        <span style={{ color: T.termGreen, fontSize: 8 }}>&#x25CF;</span>
                                                        <span style={{ color: T.termBlue }}>{agent}</span>
                                                        <span style={{ color: T.termDim }}>claimed</span>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </RevealLine>

                                    {/* Generated output */}
                                    <RevealLine scrollY={scrollYProgress} enter={[0.74, 0.82]} style={{ marginTop: 10 }}>
                                        <TermLine parts={[{ text: "  Generated:", color: T.termGreen }]} />
                                        <motion.div style={{ clipPath: codeClip, marginTop: 3 }}>
                                            <div style={{ paddingLeft: 14, borderLeft: `2px solid ${T.termAccent}`, marginLeft: 6, padding: "2px 0 2px 14px" }}>
                                                {["components/ui/button.tsx", "components/ui/button.stories.tsx", "components/ui/button.test.tsx"].map((f) => (
                                                    <TermLine key={f} parts={[{ text: f, color: T.termDim }]} />
                                                ))}
                                            </div>
                                        </motion.div>
                                    </RevealLine>

                                    {/* Success */}
                                    <RevealLine scrollY={scrollYProgress} enter={[0.84, 0.90]} style={{ marginTop: 10 }}>
                                        <div style={{ ...row(6), padding: "5px 8px", borderRadius: 5, background: T.greenSoft, border: `1px solid ${T.greenStrong}` }}>
                                            <span style={{ color: T.termGreen, fontWeight: 600 }}>&#x2713;</span>
                                            <span style={{ color: T.termGreen, fontSize: 9.5 }}>3 files generated, 0 errors, spec validated</span>
                                        </div>
                                    </RevealLine>
                                </div>
                            </div>
                        </motion.div>

                        {/* ─── RIGHT: FIGMA PLUGIN — spirals in from right ─── */}
                        <motion.div style={{
                            opacity: pluginOpacity,
                            rotateY: pluginRotateY,
                            rotateZ: pluginRotateZ,
                            x: pluginX,
                            scale: pluginScale,
                            transformOrigin: "left center",
                            transformStyle: "preserve-3d" as const,
                            filter: useTransform(pluginP, (v: number) => `drop-shadow(0 ${Math.round(v * 10)}px ${Math.round(v * 24)}px rgba(0,0,0,${(v * 0.06).toFixed(2)}))`),
                        }}>
                            {/* Glass wrap */}
                            <div style={{ padding: 10, borderRadius: 14, background: T.glassBg, border: `3px solid ${T.glassBorder}`, boxShadow: T.shadowLg }}>
                                <div style={{ borderRadius: 8, overflow: "hidden", background: T.surface, border: `1px solid ${T.border}` }}>

                                    {/* Topbar */}
                                    <div style={{ ...row(0), justifyContent: "space-between", padding: "7px 10px", background: T.surface, borderBottom: `1px solid ${T.border}` }}>
                                        <Flower size={16} />
                                        <div style={row(6)}>
                                            <span style={{ fontSize: 8, color: T.fgFaint, fontFamily: T.mono }}>:9224 &middot; 3ms</span>
                                            <div style={{ ...row(3), padding: "2px 6px 2px 4px", borderRadius: 999, border: `1px solid ${T.greenStrong}`, background: T.greenSoft }}>
                                                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 4, height: 4, borderRadius: 999, background: T.green }} />
                                                <span style={{ fontSize: 7.5, fontWeight: 600, color: T.green, textTransform: "uppercase" as const, letterSpacing: 0.6, fontFamily: T.mono }}>Connected</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Context */}
                                    <div style={{ ...row(0), padding: "3px 10px", background: T.surfaceMuted, borderBottom: `1px solid ${T.border}`, fontSize: 8 }}>
                                        <span style={{ color: T.fgFaint, textTransform: "uppercase" as const, letterSpacing: 0.8, fontSize: 7, fontFamily: T.mono }}>File</span>
                                        <span style={{ color: T.fg, fontWeight: 600, fontSize: 9, marginLeft: 3, fontFamily: T.mono }}>Memoire DS</span>
                                        <div style={{ width: 1, height: 8, background: T.borderStrong, margin: "0 6px" }} />
                                        <span style={{ color: T.fgFaint, textTransform: "uppercase" as const, letterSpacing: 0.8, fontSize: 7, fontFamily: T.mono }}>Page</span>
                                        <span style={{ color: T.fg, fontWeight: 600, fontSize: 9, marginLeft: 3, fontFamily: T.mono }}>Components</span>
                                    </div>

                                    {/* Toolbar */}
                                    <div style={{ ...row(3), flexWrap: "wrap" as const, padding: "4px 10px", background: T.surface, borderBottom: `1px solid ${T.border}` }}>
                                        {["sync", "inspect", "capture", "changes", "tree"].map((btn, i) => (
                                            <div key={btn} style={{ fontSize: 8.5, fontWeight: 500, fontFamily: T.mono, color: i === 0 ? T.accent : T.fgSecondary, padding: "2px 7px", borderRadius: 3, border: `1px solid ${i === 0 ? `${T.accent}30` : T.borderStrong}`, background: i === 0 ? T.accentSoft : T.surface }}>
                                                {btn}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Tabs */}
                                    <div style={{ ...row(0), padding: "0 10px", background: T.surface, borderBottom: `1px solid ${T.border}` }}>
                                        {["Jobs (3)", "Selection", "System"].map((tab, i) => (
                                            <div key={tab} style={{ padding: "4px 7px", borderBottom: i === 0 ? `2px solid ${T.accent}` : "2px solid transparent", fontSize: 7.5, fontWeight: 600, color: i === 0 ? T.fg : T.fgFaint, letterSpacing: 0.8, textTransform: "uppercase" as const, fontFamily: T.mono }}>
                                                {tab}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Jobs panel */}
                                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 3, padding: 5 }}>
                                        <RevealLine scrollY={scrollYProgress} enter={pluginCardEnters[0]}>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 1, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                                                {[
                                                    { label: "Running", value: "1", color: T.yellow },
                                                    { label: "Done", value: "14", color: T.green },
                                                    { label: "Failed", value: "0", color: T.fg },
                                                    { label: "Queue", value: "2", color: T.fg },
                                                ].map((m) => (
                                                    <div key={m.label} style={{ background: T.surfaceMuted, padding: "4px 5px" }}>
                                                        <div style={{ fontSize: 7, color: T.fgDim, textTransform: "uppercase" as const, letterSpacing: 0.8, fontFamily: T.mono }}>{m.label}</div>
                                                        <div style={{ fontSize: 12, fontWeight: 700, color: m.color, lineHeight: 1.2, fontFamily: T.mono }}>{m.value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </RevealLine>

                                        <RevealLine scrollY={scrollYProgress} enter={pluginCardEnters[1]}>
                                            <div style={row(3)}>
                                                <AgentPill name="token-eng" dotColor={T.yellow} />
                                                <AgentPill name="comp-arch" dotColor={T.green} />
                                                <AgentPill name="codegen" dotColor={T.green} />
                                            </div>
                                        </RevealLine>

                                        <RevealLine scrollY={scrollYProgress} enter={pluginCardEnters[2]}>
                                            <div style={{ border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.yellow}`, borderRadius: 3, background: T.yellowSoft, padding: "6px 8px" }}>
                                                <div style={{ ...row(0), justifyContent: "space-between", marginBottom: 2 }}>
                                                    <span style={txt(10, T.fg, 600)}>Sync design tokens</span>
                                                    <Chip label="Running" color={T.yellow} bg={T.yellowSoft} border={T.yellowStrong} />
                                                </div>
                                                <span style={{ fontSize: 9, color: T.fgSecondary, fontFamily: T.mono }}>getVariables &middot; 2.4s</span>
                                                <RunningBar color={T.yellow} />
                                            </div>
                                        </RevealLine>

                                        <RevealLine scrollY={scrollYProgress} enter={pluginCardEnters[3]}>
                                            <div style={{ border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.green}`, borderRadius: 3, background: T.greenSoft, padding: "6px 8px" }}>
                                                <div style={{ ...row(0), justifyContent: "space-between", marginBottom: 2 }}>
                                                    <span style={txt(10, T.fg, 600)}>Pull components</span>
                                                    <Chip label="Done" color={T.green} bg={T.greenSoft} border={T.greenStrong} />
                                                </div>
                                                <span style={{ fontSize: 9, color: T.fgSecondary, fontFamily: T.mono }}>24 components &middot; 1.8s</span>
                                            </div>
                                        </RevealLine>

                                        <RevealLine scrollY={scrollYProgress} enter={pluginCardEnters[4]}>
                                            <div style={{ border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.fgFaint}`, borderRadius: 3, background: T.surface, padding: "6px 8px" }}>
                                                <div style={{ ...row(0), justifyContent: "space-between", marginBottom: 2 }}>
                                                    <span style={txt(10, T.fg, 600)}>Generate code</span>
                                                    <Chip label="Queued" color={T.fgDim} bg={T.surfaceMuted} border={T.borderStrong} />
                                                </div>
                                                <span style={{ fontSize: 9, color: T.fgSecondary, fontFamily: T.mono }}>waiting for sync</span>
                                            </div>
                                        </RevealLine>
                                    </div>

                                    {/* Ticker */}
                                    <div style={{ ...row(5), padding: "4px 10px", background: T.surfaceMuted, borderTop: `1px solid ${T.border}` }}>
                                        <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 3, height: 3, borderRadius: 999, background: T.green, flexShrink: 0 }} />
                                        <span style={{ fontSize: 8, color: T.fgDim, fontFamily: T.mono }}>42 variables processed</span>
                                        <span style={{ marginLeft: "auto", fontSize: 8, color: T.fgFaint, fontFamily: T.mono }}>14:32:08</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(MemoireParallax, {
    scrollHeight: {
        type: ControlType.Number,
        title: "Scroll Height",
        defaultValue: 6000,
        min: 3000,
        max: 12000,
        step: 500,
    },
    navHeight: {
        type: ControlType.Number,
        title: "Nav Height",
        defaultValue: 60,
        min: 0,
        max: 120,
    },
    promptText: {
        type: ControlType.String,
        title: "Prompt Text",
        defaultValue: "Scroll to explore",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#1a1816",
    },
    promptColor: {
        type: ControlType.Color,
        title: "Prompt Color",
        defaultValue: "#b5aea5",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent / Logo",
        defaultValue: "#c05a2c",
    },
    logoSize: {
        type: ControlType.Number,
        title: "Logo Size",
        defaultValue: 80,
        min: 40,
        max: 160,
        step: 4,
    },
})
