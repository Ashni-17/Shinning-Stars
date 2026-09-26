/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#10141C",
        surface: "#171D27",
        surface2: "#1F2733",
        surface3: "#252E3B",
        border: "#2A3341",
        borderLight: "#333E4E",
        text: "#E7EAEE",
        muted: "#8B93A3",
        dim: "#5C6577",
        accent: "#E8A33D",
        accentDark: "#C4841F",
        info: "#4FB0AE",
        success: "#4CAF6D",
        danger: "#E1585B",
      },
      fontFamily: {
        display: ["Barlow Condensed", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
