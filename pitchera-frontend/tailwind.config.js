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
        sans: ["Alkatra_400Regular"],
        alkatra: ["Alkatra_400Regular"],
      },
    },
  },

  plugins: [],
};