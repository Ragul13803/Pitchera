/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  presets: [require("nativewind/preset")],

  darkMode: "class",

  theme: {
    extend: {
      fontFamily: {
        sans: ["CormorantGaramond_400Regular"],
        medium: ["CormorantGaramond_500Medium"],
        semibold: ["CormorantGaramond_600SemiBold"],
        bold: ["CormorantGaramond_700Bold"],
        italic: ["CormorantGaramond_400Regular_Italic"],
      },
    },
  },

  plugins: [],
};