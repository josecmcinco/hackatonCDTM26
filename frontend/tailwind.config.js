/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        foreground: "var(--foreground)",
        "muted-foreground": "var(--muted-foreground)",
        border: "var(--border)",
        brand: {
          DEFAULT: "var(--brand)",
          foreground: "var(--brand-foreground)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        "chart-muted": "var(--chart-muted)",
        muted: {
          DEFAULT: "var(--surface)",
          foreground: "var(--muted-foreground)",
        },
        primary: {
          DEFAULT: "var(--brand)",
          foreground: "var(--brand-foreground)",
        },
        secondary: {
          DEFAULT: "var(--surface)",
          foreground: "var(--foreground)",
        },
        destructive: {
          DEFAULT: "var(--danger)",
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "var(--surface)",
          foreground: "var(--foreground)",
        },
        popover: {
          DEFAULT: "var(--surface)",
          foreground: "var(--foreground)",
        },
      },
      borderRadius: {
        card: "16px",
        control: "10px",
        lg: "16px",
        md: "10px",
        sm: "8px",
      },
      fontFamily: {
        sans: ["Geist", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
