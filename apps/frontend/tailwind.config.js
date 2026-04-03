const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        phase: {
          takeoff: "#ff7849",
          climb: "#ffab40",
          cruise: "#00e676",
          descent: "#ffca28",
          landing: "#ff5252",
          unknown: "#607d8b",
        },
      },
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        mono: ["JetBrains Mono", ...defaultTheme.fontFamily.mono],
      },
      animation: {
        shimmer: "shimmer 2s infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
