// Light mode colors
const lightColors = {
  // Primary Colors
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

  // Gradients
  "gradient-rose-peach": "linear-gradient(to bottom right, #EF709B, #FA9372)",
  "gradient-rose-peach-75":
    "linear-gradient(to bottom right, rgba(239, 112, 155, 0.75), rgba(250, 147, 114, 0.75))",
  "gradient-purple-rose-peach":
    "linear-gradient(to bottom right, #5E5FBC, #EF709B, #FA9372)",
  "gradient-highlighted-task":
    "linear-gradient(to bottom right, rgba(167, 139, 250, 0.3), rgba(109, 40, 217, 0.3))",

  // Focus/Tab Colors
  "pri-focus": {
    100: "#E0F2FF",
    200: "#BAE6FF",
    300: "#7DD3FC",
    400: "#38BDF8",
    500: "#0EA5E9",
    600: "#0284C7",
    700: "#0369A1",
    800: "#075985",
    900: "#0C4A6E",
  },

  // Task Background Colors
  "task-sky": {
    100: "#E0F2FE",
    hover: "#BAE6FD",
  },
  "task-emerald": {
    100: "#D1FAE5",
    hover: "#A7F3D0",
  },
  "task-amber": {
    100: "#FEF3C7",
    hover: "#FDE68A",
  },
  "task-rose": {
    100: "#FFE4E6",
    hover: "#FECDD3",
  },
  "task-lilac": {
    100: "#F3E8FF",
    hover: "#E9D5FF",
  },
  "task-stone": {
    100: "#F5F5F4",
    hover: "#E5E5E4",
  },
  "task-peach": {
    100: "#FFE9D5",
    hover: "#FFD7B8",
  },
  "task-mint": {
    100: "#E3FCEF",
    hover: "#C6F6E4",
  },
  "task-steel": {
    100: "#E5E7EB",
    hover: "#D1D5DB",
  },

  // Secondary Colors
  "sec-rose": {
    100: "#FFE8EF",
    200: "#FFC8DA",
    300: "#FFA5C3",
    400: "#F883AD",
    500: "#EF709B",
    600: "#D65E89",
    700: "#B94B74",
    800: "#99385F",
    900: "#732547",
  },
  "sec-pea": {
    100: "#FFF1EC",
    200: "#FFD9CB",
    300: "#FFC0AA",
    400: "#FEA88C",
    500: "#FA9372",
    600: "#E17D60",
    700: "#C46650",
    800: "#A45040",
    900: "#823B30",
  },

  // Neutral Colors
  "neu-whi": {
    100: "#FFFFFF",
    200: "#FFF5F8",
    300: "#FFEBF1",
    400: "#FFE0EA",
    500: "#FFD6E3",
    600: "#FFC9DA",
    700: "#FFBCCF",
    800: "#FFADC3",
    900: "#FF9EB5",
  },
  "neu-gre": {
    100: "#F9FAFB",
    200: "#F3F4F6",
    300: "#E5E7EB",
    400: "#D1D5DB",
    500: "#9CA3AF",
    600: "#6B7280",
    700: "#4B5563",
    800: "#374151",
    900: "#1F2937",
  },
  "neu-bla": {
    100: "#EDEDED",
    200: "#D6D6D6",
    300: "#B0B0B0",
    400: "#8A8A8A",
    500: "#5F5F5F",
    600: "#3F3F3F",
    700: "#2C2C2C",
    800: "#1A1A1A",
    900: "#0A0A0A",
  },

  // Supportive Colors
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
};

// Dark mode colors
const darkColors = {
  // Primary Colors
  "pri-pur": {
    100: "#2E3079", // lightest purple in dark
    200: "#2A2D6F",
    300: "#252763",
    400: "#1F2158",
    500: "#1A1B4E", // base purple
    600: "#151542",
    700: "#111137",
    800: "#0D0D2C",
    900: "#080820", // darkest
  },

  // Gradients
  "gradient-pri-dark": "linear-gradient(to bottom right, #2E3079, #1A1B4E)",
  "gradient-sec-dark": "linear-gradient(to bottom right, #59412B, #332117)",
  "gradient-task-pur-dark": "linear-gradient(to bottom left, #4C4F90, #2E3364)",
  "gradient-task-red-dark": "linear-gradient(to bottom left, #8E3A3A, #5E2626)",
  "gradient-task-yellow-dark":
    "linear-gradient(to bottom left, #A8773C, #6C4F28)",
  "gradient-sky-dark": "linear-gradient(to bottom right, #3B5D92, #1C2E4A)",
  "gradient-blu-dark": "linear-gradient(to bottom right, #2F4A7F, #152946)",

  // Pop Gradients
  "gradient-pri-dark-pop": "linear-gradient(to bottom right, #4A4DAD, #252763)",
  "gradient-sec-dark-pop": "linear-gradient(to bottom right, #7D563B, #463121)",
  "gradient-task-pur-dark-pop":
    "linear-gradient(to bottom left, #6B6DAF, #3D417A)",
  "gradient-task-red-dark-pop":
    "linear-gradient(to bottom left, #AF4E4E, #763030)",
  "gradient-task-yellow-dark-pop":
    "linear-gradient(to bottom left, #C48C49, #8A6332)",

  // Focus/Tab Colors
  "pri-focus": {
    100: "#0C4A6E",
    200: "#075985",
    300: "#0369A1",
    400: "#0284C7",
    500: "#0EA5E9",
    600: "#38BDF8",
    700: "#7DD3FC",
    800: "#BAE6FF",
    900: "#E0F2FF",
  },

  // Task Background Colors
  "task-sky": {
    100: "#0C4A6E",
    hover: "#0369A1",
  },
  "task-emerald": {
    100: "#064E3B",
    hover: "#047857",
  },
  "task-amber": {
    100: "#78350F",
    hover: "#B45309",
  },
  "task-rose": {
    100: "#881337",
    hover: "#BE123C",
  },
  "task-lilac": {
    100: "#5B21B6",
    hover: "#7C3AED",
  },
  "task-stone": {
    100: "#292524",
    hover: "#44403C",
  },
  "task-peach": {
    100: "#7C2D12",
    hover: "#C2410C",
  },
  "task-mint": {
    100: "#065F46",
    hover: "#0F766E",
  },
  "task-steel": {
    100: "#374151",
    hover: "#4B5563",
  },

  // Secondary Colors
  "sec-rose": {
    100: "#8E3A3A",
    200: "#823535",
    300: "#763030",
    400: "#6A2B2B",
    500: "#5E2626",
    600: "#521F1F",
    700: "#451919",
    800: "#391313",
    900: "#2C0D0D",
  },
  "sec-pea": {
    100: "#59412B",
    200: "#4F3926",
    300: "#463121",
    400: "#3D291C",
    500: "#332117", // base peach
    600: "#2A1A12",
    700: "#20130E",
    800: "#170D09",
    900: "#0F0805",
  },

  // Neutral Colors
  "neu-whi": {
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
  "neu-gre": {
    100: "#D1D5DB", // text
    200: "#9CA3AF",
    300: "#6B7280",
    400: "#4B5563",
    500: "#374151",
    600: "#1F2937",
    700: "#111827", // near black
    800: "#0D1117", // github-style dark background
    900: "#0B0D11", // deepest black
  },
  "neu-bla": {
    100: "#1A1A1A",
    200: "#2C2C2C",
    300: "#3F3F3F",
    400: "#5F5F5F",
    500: "#8A8A8A",
    600: "#B0B0B0",
    700: "#D6D6D6",
    800: "#EDEDED",
    900: "#FFFFFF",
  },

  // Supportive Colors
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
};

module.exports = {
  lightColors,
  darkColors,
};
