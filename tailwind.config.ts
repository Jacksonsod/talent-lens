import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ["DM Sans", "sans-serif"],
        display: ["Syne", "sans-serif"],
      },
      colors: {
        bg: {
          DEFAULT:  "#F0F2F5",    // warm-grey page background (Umurava match)
          surface:  "#FFFFFF",
          surface2: "#F0F2F5",
          surface3: "#D8DCE6",
        },
        brand: {
          blue:          "#2F6FE4",                    // ✅ exact Umurava CTA blue
          "blue-dim":    "rgba(47, 111, 228, 0.12)",
          "blue-mid":    "rgba(47, 111, 228, 0.22)",
          cobalt:        "#1A47C8",                    // sidebar deep cobalt
          green:         "#10B981",
          "green-dim":   "rgba(16, 185, 129, 0.12)",
          amber:         "#F59E0B",
          "amber-dim":   "rgba(245, 158, 11, 0.12)",
          red:           "#EF4444",
          "red-dim":     "rgba(239, 68, 68, 0.12)",
          accent:        "#2F6FE4",
          "accent-dim":  "rgba(47, 111, 228, 0.14)",
          "accent-hover":"#245FCD",
        },
        text: {
          DEFAULT: "#1A1F36",   // blue-tinted near-black
          light:   "#6B7480",
          muted:   "#9EA6B4",
        },
        chip: {
          "blue-bg":    "#E8F0FE",
          "blue-text":  "#2F6FE4",
          "green-bg":   "#E6F7F1",
          "green-text": "#059669",
          "amber-bg":   "#FEF3C7",
          "amber-text": "#D97706",
        },
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease forwards",
        pulse:     "pulse 2s infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
