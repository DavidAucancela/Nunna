/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "fondo-oscuro": "#0F0E0C",
        "fondo-claro": "#F5F1EA",
        "acento-rojo": "#B8312F",
        "acento-dorado": "#C89B3C",
        "acento-jade": "#1F4D3F",
        "texto-oscuro": "#1A1A1A",
        "texto-claro": "#EFEAE0",
        "borde-sutil": "#2A2724",
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 300ms ease-in-out",
        "slide-up": "slideUp 400ms ease-out",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
