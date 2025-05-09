/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
      },
      fontSize: {
        xs: ["11px", { lineHeight: "130%", letterSpacing: "2%" }],
        sm: ["13px", { lineHeight: "130%", letterSpacing: "2%" }],
        base: ["15px", { lineHeight: "130%", letterSpacing: "2%" }],
        md: ["17px", { lineHeight: "130%", letterSpacing: "2%" }],
        lg: ["20px", { lineHeight: "150%", letterSpacing: "3%" }],
        xl: ["23px", { lineHeight: "150%", letterSpacing: "3%" }],
        "2xl": ["26px", { lineHeight: "175%", letterSpacing: "3%" }],
        "3xl": ["30px", { lineHeight: "175%", letterSpacing: "3%" }],
        "4xl": ["34px", { lineHeight: "175%", letterSpacing: "3%" }],
        "5xl": ["39px", { lineHeight: "175%", letterSpacing: "3%" }],
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
        "pri-blue": {
          100: "#E6F3FC",
          200: "#B8DCF6",
          300: "#8BC5F0",
          400: "#5DAFEB",
          500: "#0081D7",
          600: "#006AB3",
          700: "#00538F",
          800: "#003D6B",
          900: "#002647",
        },
        "pri-pur": {
          100: "#B0B2E6",
          200: "#9B9EDF",
          300: "#7F81D9",
          400: "#6A6CC9",
          500: "#5E5FBC",
          600: "#4F4FB3",
          700: "#43459F",
          800: "#383A8C",
          900: "#2E3079",
        },
        neu: {
          100: "#FAFAFA",
          200: "#E0E4E5",
          300: "#C0C7CA",
          400: "#A0AAAF",
          500: "#7F8D95",
          600: "#5D666A",
          700: "#3A4043",
          800: "#2A2E30",
          900: "#1B1B1B",
        },
        "sup-suc": {
          100: "#D6F2E0",
          200: "#B3E5C9",
          300: "#86D6A9",
          400: "#57C87F",
          500: "#34A853",
          600: "#2C8D45",
          700: "#24733A",
          800: "#1D5A2F",
          900: "#164426",
        },
        "sup-err": {
          100: "#F9D9D9",
          200: "#F2B3B4",
          300: "#E88C8E",
          400: "#DC6568",
          500: "#CD4A4C",
          600: "#AD3E41",
          700: "#8E3335",
          800: "#70292A",
          900: "#561F20",
        },
        "sup-sys": {
          100: "#D6E7F7",
          200: "#B3D2F0",
          300: "#8DBCE9",
          400: "#6CA6E0",
          500: "#4C8FD3",
          600: "#3D77B4",
          700: "#316394",
          800: "#264D75",
          900: "#1B3958",
        },
        "sup-war": {
          100: "#FEF3D7",
          200: "#FCE1A9",
          300: "#FACC77",
          400: "#F6B94F",
          500: "#F4A938",
          600: "#D8902F",
          700: "#B87626",
          800: "#965D1D",
          900: "#754716",
        },
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
    },
  },
  plugins: [],
};
