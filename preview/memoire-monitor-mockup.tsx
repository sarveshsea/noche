// Memoire Monitor Mockup — Framer Code Component
// Plugin widget overlaid on monitor dashboard. Animated + draggable plugin.

import React, { useState, useEffect, useRef } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

const T = {
    bg: "#fafaf9",
    surface: "#ffffff",
    surfaceMuted: "#f5f5f4",
    fg: "#0a0a0a",
    fgMuted: "#8a8a8a",
    fgDim: "#b0b0b0",
    border: "rgba(0,0,0,0.08)",
    borderStrong: "rgba(0,0,0,0.12)",
    green: "#16a34a",
    greenSoft: "rgba(22,163,74,0.08)",
    greenBorder: "rgba(22,163,74,0.25)",
    red: "#dc2626",
    yellow: "#ca8a04",
    accent: "#c05a2c",
    mono: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
    serif: "'Cormorant Garamond', Georgia, serif",
    sans: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
}

const row = (gap = 0, align = "center"): React.CSSProperties => ({
    display: "flex", alignItems: align, gap,
})

/* ═══ LIVE CLOCK ═══ */

function useLiveClock() {
    const [now, setNow] = useState(new Date())
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(id)
    }, [])
    const h = String(now.getHours()).padStart(2, "0")
    const m = String(now.getMinutes()).padStart(2, "0")
    const s = String(now.getSeconds()).padStart(2, "0")
    return `${h}:${m}:${s}`
}

/* ═══ LIVE COUNTER ═══ */

function useCounter(start: number, interval: number) {
    const [count, setCount] = useState(start)
    useEffect(() => {
        const id = setInterval(() => setCount((c) => c + 1), interval)
        return () => clearInterval(id)
    }, [interval])
    return count
}

/* ═══ LIVE UPTIME ═══ */

function useUptime() {
    const startRef = useRef(Date.now())
    const [elapsed, setElapsed] = useState(0)
    useEffect(() => {
        const id = setInterval(() => setElapsed(Date.now() - startRef.current), 1000)
        return () => clearInterval(id)
    }, [])
    const mins = Math.floor(elapsed / 60000)
    const secs = Math.floor((elapsed % 60000) / 1000)
    return `${mins}m ${String(secs).padStart(2, "0")}s`
}

/* ═══ ANIMATED NUMBER ═══ */

function AnimatedNumber({ value, style }: { value: number; style?: React.CSSProperties }) {
    const mv = useMotionValue(0)
    const display = useTransform(mv, (v) => Math.round(v))
    const [text, setText] = useState("0")

    useEffect(() => {
        const ctrl = animate(mv, value, { duration: 1.2, ease: [0.22, 1, 0.36, 1] })
        const unsub = display.on("change", (v) => setText(String(v)))
        return () => { ctrl.stop(); unsub() }
    }, [value])

    return <motion.span style={style}>{text}</motion.span>
}

/* ═══ PLUGIN WIDGET (draggable) ═══ */

function PluginWidget() {
    const time = useLiveClock()
    const events = useCounter(205, 4200)
    const [activeTab, setActiveTab] = useState(0)

    // Simulated log entries that grow
    const [logs, setLogs] = useState([
        { msg: "+  Identified: Memoire Terminal", positive: true },
        { msg: ".  MSG:pong", positive: false },
        { msg: ".  MSG:pong", positive: false },
    ])

    useEffect(() => {
        const msgs = [
            { msg: ".  MSG:pong", positive: false },
            { msg: "+  Identified: Memoire Terminal", positive: true },
            { msg: ".  selection changed (3 nodes)", positive: false },
            { msg: "+  sync: 42 tokens pulled", positive: true },
            { msg: ".  MSG:pong", positive: false },
            { msg: "+  component captured: Button", positive: true },
            { msg: ".  document-changed (2 edits)", positive: false },
        ]
        let i = 0
        const id = setInterval(() => {
            setLogs((prev) => [{ ...msgs[i % msgs.length] }, ...prev].slice(0, 10))
            i++
        }, 3000)
        return () => clearInterval(id)
    }, [])

    // Pulsing port dots
    const [activePorts, setActivePorts] = useState([true, true, true, false, false])
    useEffect(() => {
        const id = setInterval(() => {
            setActivePorts((p) => {
                const next = [...p]
                const idx = Math.floor(Math.random() * 5)
                next[idx] = !next[idx]
                // Always keep at least 2 active
                if (next.filter(Boolean).length < 2) next[0] = true
                return next
            })
        }, 5000)
        return () => clearInterval(id)
    }, [])

    return (
        <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.1}
            whileDrag={{ scale: 1.02, boxShadow: "0 16px 48px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.1)" }}
            initial={{ opacity: 0, x: -30, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
                position: "absolute" as const,
                top: 20,
                left: 20,
                width: 296,
                zIndex: 10,
                borderRadius: 8,
                background: T.surface,
                border: `1px solid ${T.border}`,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                overflow: "hidden",
                fontFamily: T.mono,
                fontSize: 10,
                color: T.fg,
                cursor: "grab",
            }}
        >
            {/* Title bar */}
            <div style={{ ...row(0), justifyContent: "space-between", padding: "8px 12px", borderBottom: `1px solid ${T.border}`, background: T.surfaceMuted }}>
                <div style={row(6)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="2.5" fill={T.accent} />
                        <ellipse cx="12" cy="6" rx="2.8" ry="4.5" stroke={T.accent} strokeWidth="1.2" opacity="0.6" fill="none" />
                        <ellipse cx="12" cy="18" rx="2.8" ry="4.5" stroke={T.accent} strokeWidth="1.2" opacity="0.6" fill="none" />
                        <ellipse cx="6" cy="12" rx="4.5" ry="2.8" stroke={T.accent} strokeWidth="1.2" opacity="0.6" fill="none" />
                        <ellipse cx="18" cy="12" rx="4.5" ry="2.8" stroke={T.accent} strokeWidth="1.2" opacity="0.6" fill="none" />
                    </svg>
                    <span style={{ fontWeight: 600, fontSize: 11 }}>Memoire</span>
                </div>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.fgMuted} strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </div>

            {/* Brand + status */}
            <div style={{ ...row(0), justifyContent: "space-between", padding: "6px 12px", borderBottom: `1px solid ${T.border}` }}>
                <div style={row(8)}>
                    <span style={{ fontFamily: T.serif, fontSize: 12, fontWeight: 300, fontStyle: "italic", letterSpacing: 1.5 }}>memoire</span>
                    <span style={{ fontSize: 8, fontWeight: 600, color: T.green, background: T.greenSoft, border: `1px solid ${T.greenBorder}`, borderRadius: 3, padding: "1px 6px", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>
                        <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}>connected</motion.span>
                    </span>
                </div>
                <span style={{ fontSize: 9, color: T.fgMuted }}>Labor Budgeting 3.1</span>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 1, margin: 8, background: T.border, borderRadius: 4, overflow: "hidden" }}>
                {[
                    { label: "Port", value: ":9223", sub: "Memoire Terminal" },
                    { label: "Events", value: String(events), sub: `${Math.floor(events / 60)}+/min` },
                    { label: "Uptime", value: "10:01", sub: "session" },
                    { label: "Ping", value: "1ms", sub: "healthy" },
                ].map((s) => (
                    <div key={s.label} style={{ background: T.surface, padding: "6px 6px 4px", textAlign: "center" as const }}>
                        <div style={{ fontSize: 7.5, color: T.fgMuted, textTransform: "uppercase" as const, letterSpacing: 0.8, marginBottom: 2 }}>{s.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{s.value}</div>
                        <div style={{ fontSize: 7, color: T.fgDim }}>{s.sub}</div>
                    </div>
                ))}
            </div>

            {/* Ports */}
            <div style={{ padding: "4px 12px 6px" }}>
                <div style={{ fontSize: 8, color: T.fgMuted, textAlign: "center" as const, marginBottom: 4, letterSpacing: 0.5 }}>Ports</div>
                <div style={row(4)}>
                    {[9223, 9224, 9225, 9226, 9227].map((port, i) => (
                        <motion.span
                            key={port}
                            animate={{ borderColor: activePorts[i] ? "rgba(22,163,74,0.25)" : T.border, color: activePorts[i] ? T.green : T.fgDim, background: activePorts[i] ? T.greenSoft : "transparent" }}
                            transition={{ duration: 0.4 }}
                            style={{ fontSize: 9, fontWeight: 500, padding: "2px 8px", borderRadius: 3, border: "1px solid" }}
                        >
                            {port}
                        </motion.span>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ ...row(0), justifyContent: "space-between", padding: "0 12px", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
                <div style={row(0)}>
                    {["Log", "Actions", "Selection"].map((tab, i) => (
                        <motion.span
                            key={tab}
                            onClick={() => setActiveTab(i)}
                            whileHover={{ color: T.fg }}
                            style={{
                                padding: "5px 8px", fontSize: 9, fontWeight: activeTab === i ? 600 : 400,
                                color: activeTab === i ? T.fg : T.fgMuted,
                                borderBottom: activeTab === i ? `2px solid ${T.fg}` : "2px solid transparent",
                                textTransform: "uppercase" as const, letterSpacing: 0.8, cursor: "pointer",
                            }}
                        >
                            {tab}
                        </motion.span>
                    ))}
                </div>
                <span style={{ fontSize: 8, color: T.fgDim }}>{events} clear</span>
            </div>

            {/* Status dots */}
            <div style={{ ...row(4), padding: "6px 12px", borderBottom: `1px solid ${T.border}` }}>
                {activePorts.slice(0, 4).map((active, i) => (
                    <motion.div
                        key={i}
                        animate={{ background: active ? T.green : T.red }}
                        transition={{ duration: 0.3 }}
                        style={{ width: 6, height: 6, borderRadius: 999 }}
                    />
                ))}
            </div>

            {/* Log entries (live) */}
            <div style={{ padding: "4px 0", maxHeight: 130, overflow: "hidden" }}>
                {logs.map((entry, i) => (
                    <motion.div
                        key={`${i}-${entry.msg}`}
                        initial={i === 0 ? { opacity: 0, y: -8 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ ...row(8), padding: "2px 12px", fontSize: 9, color: entry.positive ? T.fg : T.fgMuted }}
                    >
                        <span style={{ color: T.fgDim, flexShrink: 0, width: 52 }}>{time}</span>
                        <span>{entry.msg}</span>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}

/* ═══ MONITOR DASHBOARD ═══ */

function MonitorDashboard() {
    const time = useLiveClock()
    const events = useCounter(27, 5500)
    const uptime = useUptime()
    const [activeAction, setActiveAction] = useState<string | null>(null)

    return (
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.fg, background: T.bg, width: "100%", height: "100%", overflow: "hidden" }}>

            {/* Nav */}
            <div style={{ ...row(0), justifyContent: "space-between", padding: "10px 20px", borderBottom: `1px solid ${T.border}`, background: "rgba(250,250,249,0.85)", backdropFilter: "blur(12px)" }}>
                <div style={row(2)}>
                    {["Systems", "Monitor", "Changelog"].map((tab, i) => (
                        <span key={tab} style={{
                            padding: "6px 12px", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: 1,
                            color: i === 1 ? T.fg : T.fgMuted, fontWeight: i === 1 ? 500 : 400,
                            background: i === 1 ? "rgba(0,0,0,0.05)" : "transparent", borderRadius: 2,
                        }}>
                            {tab}
                        </span>
                    ))}
                </div>
                <div style={row(16)}>
                    <span style={{ fontSize: 10, color: T.fgMuted }}><AnimatedNumber value={events} /> <span style={{ textTransform: "uppercase", letterSpacing: 0.8, fontSize: 9 }}>Events</span></span>
                    <span style={{ fontSize: 10, color: T.fgMuted }}><span style={{ textTransform: "uppercase", letterSpacing: 0.8, fontSize: 9 }}>Clients</span></span>
                </div>
            </div>

            {/* Connection */}
            <div style={{ ...row(0), justifyContent: "space-between", padding: "12px 20px", borderBottom: `1px solid ${T.border}` }}>
                <div style={row(8)}>
                    <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 8, height: 8, borderRadius: 999, background: T.green }} />
                    <span style={{ fontSize: 11 }}>active connection</span>
                </div>
                <span style={{ fontSize: 10, color: T.fgMuted }}>port 3334</span>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "16px 20px" }}>
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: "14px 16px", background: T.surface }}>
                    <div style={{ fontSize: 9, color: T.fgMuted, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 4 }}>Connected Plugins</div>
                    <div style={{ fontSize: 9, color: T.fgMuted }}>active connection</div>
                </div>
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: "14px 16px", background: T.surface, textAlign: "center" as const }}>
                    <div style={{ fontSize: 9, color: T.fgMuted, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 4 }}>Events Received</div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}><AnimatedNumber value={events} /></div>
                    <div style={{ fontSize: 9, color: T.fgMuted }}>Since page load</div>
                </div>
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: "14px 16px", background: T.surface, textAlign: "center" as const }}>
                    <div style={{ fontSize: 9, color: T.fgMuted, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 4 }}>Uptime</div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{uptime}</div>
                    <div style={{ fontSize: 9, color: T.fgMuted }}>SSE stream</div>
                </div>
            </div>

            {/* Actions */}
            <div style={{ padding: "0 20px 16px" }}>
                <div style={{ fontSize: 9, color: T.fgMuted, textTransform: "uppercase" as const, letterSpacing: 1.5, textAlign: "center" as const, marginBottom: 10 }}>Actions</div>
                <div style={{ ...row(8), justifyContent: "center", flexWrap: "wrap" as const }}>
                    {["Pull Components", "Page Tree", "Stickies", "Full Sync"].map((action) => (
                        <motion.span
                            key={action}
                            whileHover={{ background: "#f0f0ee", borderColor: T.borderStrong }}
                            whileTap={{ scale: 0.96 }}
                            onTap={() => {
                                setActiveAction(action)
                                setTimeout(() => setActiveAction(null), 1500)
                            }}
                            style={{
                                padding: "6px 16px",
                                border: `1px solid ${activeAction === action ? T.greenBorder : T.border}`,
                                borderRadius: 4, fontSize: 10,
                                color: activeAction === action ? T.green : T.fg,
                                background: activeAction === action ? T.greenSoft : T.surface,
                                cursor: "pointer",
                                transition: "color 0.2s, border-color 0.2s, background 0.2s",
                            }}
                        >
                            {activeAction === action ? "\u2713 " : ""}{action}
                        </motion.span>
                    ))}
                </div>
            </div>

            {/* Port Scanner */}
            <div style={{ padding: "0 20px 16px" }}>
                <div style={{ fontSize: 9, color: T.fgMuted, textTransform: "uppercase" as const, letterSpacing: 1.5, textAlign: "center" as const, marginBottom: 10 }}>Port Scanner (9223-9232)</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                    {[9223, 9224, 9225, 9226, 9227].map((port) => (
                        <motion.div
                            key={port}
                            whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}
                            style={{
                                border: `1px solid ${port === 9224 ? T.greenBorder : T.border}`,
                                borderRadius: 6, padding: "10px 8px", textAlign: "center" as const,
                                background: port === 9224 ? T.greenSoft : T.surface,
                            }}
                        >
                            <div style={{ fontSize: 16, fontWeight: 600 }}>{port}</div>
                            <div style={{ fontSize: 8, color: port === 9224 ? T.green : T.fgDim, textTransform: "uppercase" as const, letterSpacing: 0.5, marginTop: 2 }}>
                                {port === 9224 ? "Listening" : "\u2014"}
                            </div>
                            {port === 9224 && (
                                <motion.div
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    style={{ width: 4, height: 4, borderRadius: 999, background: T.green, margin: "4px auto 0" }}
                                />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Live Event Stream */}
            <div style={{ padding: "0 20px" }}>
                <div style={{ ...row(0), justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 9, color: T.fgMuted, textTransform: "uppercase" as const, letterSpacing: 1.5 }}>Live Event Stream</span>
                    <div style={row(12)}>
                        <span style={{ fontSize: 9, color: T.fgMuted, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Auto-Scroll</span>
                        <span style={{ fontSize: 9, color: T.fgMuted, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Clear</span>
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 1 }}>
                    {[
                        { type: "plugin-disconnected", msg: "Plugin disconnected", typeColor: T.red },
                        { type: "event", msg: "[info] Figma plugin connected", typeColor: T.fgMuted },
                        { type: "plugin-connected", msg: "unknown via figma", typeColor: T.green },
                        { type: "event", msg: "[info] Figma plugin disconnected", typeColor: T.fgDim },
                    ].map((entry, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: i === 3 ? 0.5 : 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.15, duration: 0.3 }}
                            style={{ ...row(12), padding: "6px 0", borderBottom: `1px solid ${T.border}` }}
                        >
                            <span style={{ color: T.fgDim, flexShrink: 0, width: 56, fontSize: 10 }}>{time}</span>
                            <span style={{ color: entry.typeColor, fontWeight: 500, flexShrink: 0, width: 130, fontSize: 10 }}>{entry.type}</span>
                            <span style={{ color: T.fgMuted, fontSize: 10 }}>{entry.msg}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}

/* ═══ MAIN ═══ */

interface Props {
    showPlugin?: boolean
}

export default function MemoireMonitorMockup({
    showPlugin = true,
}: Props) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: 8,
                border: `1px solid ${T.border}`,
                background: T.bg,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
        >
            {/* Browser chrome */}
            <div style={{ ...row(0), padding: "8px 12px", background: T.surfaceMuted, borderBottom: `1px solid ${T.border}` }}>
                <div style={{ ...row(5), marginRight: 12 }}>
                    <div style={{ width: 9, height: 9, borderRadius: 999, background: "#ff5f56" }} />
                    <div style={{ width: 9, height: 9, borderRadius: 999, background: "#ffbd2e" }} />
                    <div style={{ width: 9, height: 9, borderRadius: 999, background: "#27c93f" }} />
                </div>
                <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                    <span style={{ fontSize: 10, color: T.fgMuted, fontFamily: T.sans, letterSpacing: 0.3 }}>localhost:5173/monitor</span>
                </div>
                <div style={{ width: 40 }} />
            </div>

            {/* Dashboard */}
            <div style={{ height: "calc(100% - 34px)", overflow: "hidden" }}>
                <MonitorDashboard />
            </div>

            {/* Plugin overlay (draggable) */}
            {showPlugin && <PluginWidget />}
        </motion.div>
    )
}

addPropertyControls(MemoireMonitorMockup, {
    showPlugin: {
        type: ControlType.Boolean,
        title: "Show Plugin",
        defaultValue: true,
    },
})
