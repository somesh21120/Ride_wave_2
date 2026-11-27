/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "var(--brand)",
        "brand-dark": "var(--brand-dark)",
        "brand-light": "var(--brand-light)",
        "brand-ink": "var(--brand-ink)",
        ai: "var(--ai)",
        "ai-light": "var(--ai-light)",
        gold: "var(--gold)",
        accent: "var(--accent)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        border: "var(--border)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.625rem" }],
        xl: ["1.375rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.75rem", { lineHeight: "2rem" }],
        "3xl": ["2.25rem", { lineHeight: "2.5rem" }],
      },
      borderRadius: {
        sm: "10px",
        md: "14px",
        lg: "20px",
        xl: "28px",
        pill: "999px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(18,22,28,0.04), 0 1px 1px rgba(18,22,28,0.03)",
        md: "0 8px 24px rgba(18,22,28,0.06)",
        lg: "0 24px 60px rgba(18,22,28,0.10)",
      },
    },
  },
  plugins: [],
}
