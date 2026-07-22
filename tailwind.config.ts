import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "var(--bg-void)",
        panel: {
          DEFAULT: "var(--bg-panel)",
          raised: "var(--bg-panel-raised)",
        },
        line: "var(--line)",
        "text-primary": "var(--text-primary)",
        "text-muted": "var(--text-muted)",
        "signal-orange": "var(--signal-orange)",
        "signal-cyan": "var(--signal-cyan)",
        "signal-red": "var(--signal-red)",
        
        // Aliases for compatibility
        background: "var(--bg-void)",
        foreground: "var(--text-primary)",
        muted: "var(--text-muted)",
        accent: "var(--signal-orange)",
        danger: "var(--signal-red)",
        success: "var(--signal-cyan)",
        warning: "#FFB800",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        hairline: "inset 0 0 0 1px var(--line)",
        "panel-glow": "0 0 40px rgba(255, 94, 26, 0.08)",
        "cyan-glow": "0 0 30px rgba(30, 230, 196, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
