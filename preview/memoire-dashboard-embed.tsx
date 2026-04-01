// Memoire Dashboard Embed — Framer Code Component
// Live interactive dashboard inside a device frame with glass border.

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/* ═══ TOKENS ═══ */

const T = {
    accent: "#c05a2c",
    mono: "'SF Mono', ui-monospace, 'SFMono-Regular', 'Cascadia Code', Menlo, Monaco, Consolas, monospace",
    sans: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
}

/* ═══ MAIN ═══ */

interface Props {
    url?: string
    borderRadius?: number
    glassPadding?: number
    glassBorderWidth?: number
    glassOpacity?: number
    shadowIntensity?: number
    showTitlebar?: boolean
    titlebarText?: string
}

export default function MemoireDashboardEmbed({
    url = "https://www.memoire.cv/dashboard/index.html",
    borderRadius = 14,
    glassPadding = 12,
    glassBorderWidth = 3,
    glassOpacity = 0.06,
    shadowIntensity = 0.08,
    showTitlebar = true,
    titlebarText = "memoire.cv/dashboard",
}: Props) {
    const innerRadius = Math.max(4, borderRadius - glassPadding / 2)

    // Fetch HTML and use srcdoc to bypass Framer's iframe sandbox
    const [html, setHtml] = useState<string>("")
    useEffect(() => {
        fetch(url)
            .then((r) => r.text())
            .then((text) => setHtml(text))
            .catch(() => setHtml(""))
    }, [url])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{
                width: "100%",
                height: "100%",
                padding: glassPadding,
                borderRadius: borderRadius + glassPadding / 2,
                background: `rgba(255, 255, 255, ${glassOpacity})`,
                border: `${glassBorderWidth}px solid rgba(255, 255, 255, ${glassOpacity + 0.02})`,
                backdropFilter: "blur(20px) saturate(1.3)",
                WebkitBackdropFilter: "blur(20px) saturate(1.3)",
                boxShadow: `
                    0 0 0 1px rgba(255, 255, 255, ${glassOpacity / 2}) inset,
                    0 1px 0 0 rgba(255, 255, 255, ${glassOpacity}) inset,
                    0 8px 32px rgba(0, 0, 0, ${shadowIntensity}),
                    0 24px 64px rgba(0, 0, 0, ${shadowIntensity * 0.6})
                `,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column" as const,
            }}
        >
            {/* Glass highlight */}
            <div
                style={{
                    position: "absolute" as const,
                    top: 0,
                    left: glassPadding + 16,
                    right: glassPadding + 16,
                    height: 1,
                    background: `linear-gradient(90deg, transparent, rgba(255,255,255,${glassOpacity * 2}) 30%, rgba(255,255,255,${glassOpacity * 2}) 70%, transparent)`,
                    borderRadius: 1,
                }}
            />

            {/* Browser chrome */}
            <div
                style={{
                    borderRadius: `${innerRadius}px ${innerRadius}px 0 0`,
                    overflow: "hidden",
                    background: "#ffffff",
                    border: "1px solid rgba(26, 24, 22, 0.08)",
                    borderBottom: "none",
                    display: showTitlebar ? "flex" : "none",
                    flexDirection: "column" as const,
                    flexShrink: 0,
                }}
            >
                {/* Titlebar */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "8px 12px",
                        background: "#f8f7f5",
                        borderBottom: "1px solid rgba(26, 24, 22, 0.06)",
                        gap: 8,
                    }}
                >
                    {/* Traffic lights */}
                    <div style={{ display: "flex", gap: 5, marginRight: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 999, background: "#ff5f56" }} />
                        <div style={{ width: 10, height: 10, borderRadius: 999, background: "#ffbd2e" }} />
                        <div style={{ width: 10, height: 10, borderRadius: 999, background: "#27c93f" }} />
                    </div>

                    {/* URL bar */}
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "4px 12px",
                            borderRadius: 6,
                            background: "#f0eeeb",
                            border: "1px solid rgba(26, 24, 22, 0.06)",
                        }}
                    >
                        {/* Lock icon */}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8a8279" strokeWidth="2" strokeLinecap="round" style={{ marginRight: 6, flexShrink: 0 }}>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                        <span
                            style={{
                                fontSize: 11,
                                fontFamily: T.sans,
                                color: "#5c554c",
                                fontWeight: 400,
                                letterSpacing: 0.2,
                            }}
                        >
                            {titlebarText}
                        </span>
                    </div>

                    {/* Spacer matching traffic lights width */}
                    <div style={{ width: 52 }} />
                </div>
            </div>

            {/* iframe */}
            <div
                style={{
                    flex: 1,
                    borderRadius: showTitlebar ? `0 0 ${innerRadius}px ${innerRadius}px` : innerRadius,
                    overflow: "hidden",
                    border: "1px solid rgba(26, 24, 22, 0.08)",
                    borderTop: showTitlebar ? "none" : undefined,
                    background: "#f8f6f2",
                }}
            >
                <iframe
                    srcDoc={html || undefined}
                    src={html ? undefined : url}
                    style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        display: "block",
                    }}
                    loading="lazy"
                    allow="clipboard-read; clipboard-write"
                />
            </div>
        </motion.div>
    )
}

addPropertyControls(MemoireDashboardEmbed, {
    url: {
        type: ControlType.String,
        title: "Dashboard URL",
        defaultValue: "https://www.memoire.cv/dashboard/index.html",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 14,
        min: 0,
        max: 32,
    },
    glassPadding: {
        type: ControlType.Number,
        title: "Glass Padding",
        defaultValue: 12,
        min: 0,
        max: 24,
    },
    glassBorderWidth: {
        type: ControlType.Number,
        title: "Glass Border",
        defaultValue: 3,
        min: 0,
        max: 8,
    },
    glassOpacity: {
        type: ControlType.Number,
        title: "Glass Opacity",
        defaultValue: 0.06,
        min: 0,
        max: 0.3,
        step: 0.01,
    },
    shadowIntensity: {
        type: ControlType.Number,
        title: "Shadow",
        defaultValue: 0.08,
        min: 0,
        max: 0.4,
        step: 0.01,
    },
    showTitlebar: {
        type: ControlType.Boolean,
        title: "Titlebar",
        defaultValue: true,
    },
    titlebarText: {
        type: ControlType.String,
        title: "URL Text",
        defaultValue: "memoire.cv/dashboard",
    },
})
