/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ["Orbitron", "monospace"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        nb: "#00f3ff",
        np: "#bc13fe",
        nk: "#ff00ff",
        ng: "#00ff88",
        no: "#ff6600",
        ny: "#ffff00",
        nr: "#ff0040",
        bg: "#03030e",
        sf: "#08081a",
        bd: "#1a1a30",
      },
    },
  },
  plugins: [],
};
