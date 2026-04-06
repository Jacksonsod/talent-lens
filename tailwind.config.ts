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
        sans: ["DM Sans", "sans-serif"],
        display: ["Syne", "sans-serif"],
      },
      colors: {
        bg: {
          DEFAULT: "#0a0a0f",
          surface: "#13131a",
          surface2: "#1c1c26",
          surface3: "#242432",
        },
        brand: {
          green: "#00e5a0",
          "green-dim": "rgba(0,229,160,0.12)",
          amber: "#ffb547",
          "amber-dim": "rgba(255,181,71,0.12)",
          red: "#ff6b6b",
          "red-dim": "rgba(255,107,107,0.12)",
          blue: "#6b8aff",
          "blue-dim": "rgba(107,138,255,0.12)",
          accent: "#7c6fff",
          "accent-dim": "rgba(124,111,255,0.15)",
        },
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease forwards",
        pulse: "pulse 2s infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
