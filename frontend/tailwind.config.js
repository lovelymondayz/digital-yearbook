/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
      },
      colors: {
        primary: "#1a1a2e",
        secondary: "#16213e",
        accent: "#0f3460",
        highlight: "#e94560",
        gold: "#f5c518",
        cream: "#faf3e0",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          from: { boxShadow: "0 0 20px rgba(233, 69, 96, 0.3)" },
          to: { boxShadow: "0 0 40px rgba(233, 69, 96, 0.6)" },
        },
      },
    },
  },
  plugins: [],
}
