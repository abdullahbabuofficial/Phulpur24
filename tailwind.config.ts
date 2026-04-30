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
        // Public site brand (kept for backwards compatibility)
        primary: {
          DEFAULT: "#B91C1C",
          dark: "#7F1D1D",
          light: "#EF4444",
        },
        accent: {
          DEFAULT: "#4F46E5",
          green: "#15803D",
          hover: "#4338CA",
          soft: "#EEF2FF",
          ring: "#A5B4FC",
        },
        brand: {
          text: "#0F172A",
          muted: "#64748B",
          border: "#E2E8F0",
          surface: "#FFFFFF",
          soft: "#F8FAFC",
        },
        // Admin design system (slate + indigo)
        app: "#F8FAFC",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#0F172A",
          muted: "#475569",
          subtle: "#64748B",
          faint: "#94A3B8",
        },
        line: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E1",
        },
        sidebar: {
          DEFAULT: "#0B1220",
          surface: "#0F172A",
          hover: "#1E293B",
          active: "#312E81",
          text: "#CBD5E1",
          muted: "#64748B",
          border: "#1E293B",
        },
        success: {
          DEFAULT: "#10B981",
          soft: "#ECFDF5",
          text: "#065F46",
        },
        warning: {
          DEFAULT: "#F59E0B",
          soft: "#FFFBEB",
          text: "#92400E",
        },
        danger: {
          DEFAULT: "#EF4444",
          soft: "#FEF2F2",
          text: "#991B1B",
        },
        info: {
          DEFAULT: "#0EA5E9",
          soft: "#F0F9FF",
          text: "#075985",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 1px 1px rgba(15,23,42,0.03)",
        elev: "0 8px 24px -8px rgba(15,23,42,0.12), 0 2px 6px rgba(15,23,42,0.04)",
        ring: "0 0 0 4px rgba(79,70,229,0.18)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        bangla: [
          "Noto Sans Bengali",
          "Mukti",
          "system-ui",
          "sans-serif",
        ],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slide-in-right": "slide-in-right 200ms ease-out",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
