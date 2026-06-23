/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./modules/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "fondo-oscuro": "rgb(var(--fondo-oscuro) / <alpha-value>)",
        "fondo-claro": "rgb(var(--fondo-claro) / <alpha-value>)",
        "acento-rojo": "rgb(var(--acento-rojo) / <alpha-value>)",
        "acento-dorado": "rgb(var(--acento-dorado) / <alpha-value>)",
        "acento-jade": "rgb(var(--acento-jade) / <alpha-value>)",
        "texto-oscuro": "rgb(var(--texto-oscuro) / <alpha-value>)",
        "texto-claro": "rgb(var(--texto-claro) / <alpha-value>)",
        "borde-sutil": "rgb(var(--borde-sutil) / <alpha-value>)",
        // Escala stone temática: invierte en claro/oscuro vía variables CSS
        stone: {
          50: "rgb(var(--stone-50) / <alpha-value>)",
          100: "rgb(var(--stone-100) / <alpha-value>)",
          200: "rgb(var(--stone-200) / <alpha-value>)",
          300: "rgb(var(--stone-300) / <alpha-value>)",
          400: "rgb(var(--stone-400) / <alpha-value>)",
          500: "rgb(var(--stone-500) / <alpha-value>)",
          600: "rgb(var(--stone-600) / <alpha-value>)",
          700: "rgb(var(--stone-700) / <alpha-value>)",
          800: "rgb(var(--stone-800) / <alpha-value>)",
          900: "rgb(var(--stone-900) / <alpha-value>)",
          950: "rgb(var(--stone-950) / <alpha-value>)",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-sm": ["clamp(2.5rem, 8vw, 4.5rem)", { lineHeight: "1.0", letterSpacing: "-0.02em" }],
        "display":    ["clamp(3.5rem, 11vw, 8rem)",  { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        "display-lg": ["clamp(4rem, 15vw, 12rem)",   { lineHeight: "0.9",  letterSpacing: "-0.04em" }],
      },
      animation: {
        "fade-in":    "fadeIn 300ms ease-in-out",
        "slide-up":   "slideUp 400ms ease-out",
        "spin-slow":  "spin 30s linear infinite",
        "float":      "float 6s ease-in-out infinite",
        "shimmer":    "shimmer 2.8s linear infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow":       "glow 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        glow: {
          "0%, 100%": { opacity: "0.6" },
          "50%":      { opacity: "1" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      transitionDuration: {
        "400": "400ms",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
