/** @type {import('tailwindcss').Config} */
const { lightColors, darkColors } = require("./src/styles/colors");

module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        gradientMove: {
          "0%": { backgroundPosition: "0% 0%" },
          "25%": { backgroundPosition: "100% 50%" },
          "50%": { backgroundPosition: "50% 100%" },
          "75%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "0% 0%" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-out forwards",
        gradientMove: "gradientMove 10s ease-in-out infinite",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      fontSize: {
        xs: [
          "11px",
          { lineHeight: "130%", letterSpacing: "2%", fontFamily: "inter" },
        ],
        sm: [
          "13px",
          { lineHeight: "130%", letterSpacing: "2%", fontFamily: "inter" },
        ],
        base: [
          "15px",
          { lineHeight: "130%", letterSpacing: "2%", fontFamily: "inter" },
        ],
        md: [
          "17px",
          { lineHeight: "130%", letterSpacing: "2%", fontFamily: "inter" },
        ],
        lg: [
          "20px",
          { lineHeight: "150%", letterSpacing: "3%", fontFamily: "inter" },
        ],
        xl: [
          "23px",
          { lineHeight: "150%", letterSpacing: "3%", fontFamily: "inter" },
        ],
        "2xl": [
          "26px",
          { lineHeight: "175%", letterSpacing: "3%", fontFamily: "inter" },
        ],
        "3xl": [
          "30px",
          { lineHeight: "175%", letterSpacing: "3%", fontFamily: "inter" },
        ],
        "4xl": [
          "34px",
          { lineHeight: "175%", letterSpacing: "3%", fontFamily: "inter" },
        ],
        "5xl": [
          "39px",
          { lineHeight: "175%", letterSpacing: "3%", fontFamily: "inter" },
        ],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "10px",
        lg: "15px",
        xl: "17px",
        "2xl": "20px",
        "3xl": "23px",
        "4xl": "26px",
        "5xl": "30px",
      },
      spacing: {
        xs: "5px",
        sm: "10px",
        md: "15px",
        lg: "20px",
        xl: "26px",
        "2xl": "34px",
        "3xl": "45px",
        "4xl": "60px",
        "5xl": "79px",
        "6xl": "105px",
        "7xl": "138px",
        "8xl": "182px",
        "9xl": "240px",
      },
      colors: {
        ...lightColors,
        dark: darkColors,
      },
      width: {
        xs: "30px",
        sm: "39px",
        md: "52px",
        lg: "60px",
        xl: "69px",
        "2xl": "79px",
        "3xl": "91px",
        "4xl": "105px",
        "5xl": "120px",
        "6xl": "138px",
        "7xl": "158px",
        "8xl": "182px",
        "9xl": "209px",
        "10xl": "240px",
      },
      height: {
        xs: "30px",
        sm: "39px",
        md: "52px",
        lg: "60px",
        xl: "69px",
        "2xl": "79px",
        "3xl": "91px",
        "4xl": "105px",
        "5xl": "120px",
        "6xl": "138px",
        "7xl": "158px",
        "8xl": "182px",
        "9xl": "209px",
        "10xl": "240px",
      },
      backgroundImage: {
        "gradient-rose-peach":
          "linear-gradient(90deg, theme(colors.sec-rose.500) 0%, theme(colors.sec-pea.500) 50%, theme(colors.sec-rose.500) 100%)",
        "gradient-rose-peach-75":
          "linear-gradient(90deg, rgba(239, 112, 155, 0.75) 0%, rgba(250, 147, 114, 0.75) 100%)",
        "gradient-purple-rose-peach":
          "linear-gradient(90deg, theme(colors.pri-pur.500) 0%, theme(colors.sec-rose.500) 50%, theme(colors.sec-pea.500) 100%)",
        "gradient-highlighted-task":
          "linear-gradient(90deg, rgba(167, 139, 250, 0.3) 0%, rgba(109, 40, 217, 0.3) 100%)",
      },
    },
  },
  plugins: [
    function ({ addBase, theme }) {
      addBase({
        // Light mode styles
        ":root": {
          ...Object.entries(lightColors).reduce((acc, [key, value]) => {
            Object.entries(value).forEach(([shade, color]) => {
              acc[`--color-${key}-${shade}`] = color;
            });
            return acc;
          }, {}),
        },
        // Dark mode styles
        ".dark": {
          ...Object.entries(darkColors).reduce((acc, [key, value]) => {
            Object.entries(value).forEach(([shade, color]) => {
              acc[`--color-${key}-${shade}`] = color;
            });
            return acc;
          }, {}),
        },
      });
    },
  ],
};
