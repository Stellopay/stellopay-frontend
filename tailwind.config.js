module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        clash: ["var(--font-clash)"],
        general: ["var(--font-general)"],
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "search-highlight": {
          "0%": { backgroundColor: "rgba(59, 130, 246, 0.15)" },
          "100%": { backgroundColor: "transparent" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite",
        "search-highlight": "search-highlight 2.5s ease-out",
      },
    },
  },
  plugins: [],
};
