import type { Config } from "tailwindcss";

// Colors resolve to CSS variables defined in app/globals.css (the Family Hub's
// navy-and-glow palette), so a token change there restyles every page.
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        panel: {
          bg: "var(--panel-bg)",
          surface: "var(--panel-surface)",
          surface2: "var(--panel-surface2)",
          tint: "var(--panel-tint)",
          track: "var(--panel-track)",
          ink: "var(--panel-ink)",
          inkMuted: "var(--panel-ink-muted)",
          faint: "var(--panel-faint)",
          line: "var(--panel-line)",
          lineSoft: "var(--panel-line-soft)",
          col: "var(--panel-col)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          strong: "var(--accent-strong)",
          soft: "var(--accent-soft)",
          line: "var(--accent-line)",
          ink: "var(--accent-ink)",
        },
        status: {
          "ok-bar": "var(--ok-bar)",
          "ok-ink": "var(--ok-ink)",
          "ok-soft": "var(--ok-soft)",
          "ok-line": "var(--ok-line)",
          "warn-bar": "var(--warn-bar)",
          "warn-ink": "var(--warn-ink)",
          "warn-soft": "var(--warn-soft)",
          "warn-line": "var(--warn-line)",
          "over-bar": "var(--over-bar)",
          "over-ink": "var(--over-ink)",
          "over-soft": "var(--over-soft)",
          "over-line": "var(--over-line)",
          "debt-bar": "var(--debt-bar)",
        },
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
        "glow-ok": "0 0 14px -2px var(--ok-glow)",
        "glow-warn": "0 0 14px -2px var(--warn-glow)",
        "glow-over": "0 0 14px -2px var(--over-glow)",
        "glow-accent": "0 0 14px -2px var(--accent-glow)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
