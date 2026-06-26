/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Marca da CONTA (white-label) — injetada via CSS vars em runtime.
        brand: {
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
          fg: "rgb(var(--brand-fg) / <alpha-value>)",
          soft: "rgb(var(--brand) / 0.10)",
        },
        ink: {
          DEFAULT: "#1A1D21",
          soft: "#5B6470",
          faint: "#8A929E",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F6F7F9",
          sunken: "#EEF0F3",
        },
        line: "#E4E7EC",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Manrope", "Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)",
        pop: "0 12px 30px -8px rgba(16,24,40,.18)",
      },
    },
  },
  plugins: [],
};
