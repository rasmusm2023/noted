// Modern Color Palette - Light Mode
const lightColors = {
  // Primary Colors - Modern Blue/Indigo
  "pri-blue": {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9", // Main primary
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
  },

  // Secondary Colors - Modern Purple
  "sec-purple": {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7", // Main secondary
    600: "#9333ea",
    700: "#7c3aed",
    800: "#6b21a8",
    900: "#581c87",
  },

  // Accent Colors - Modern Green
  "acc-green": {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e", // Main accent
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },

  // Neutral Colors - Modern Grays
  "neu-gray": {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },

  // Background Colors
  "bg-white": {
    50: "#ffffff",
    100: "#fefefe",
    200: "#fdfdfd",
    300: "#fcfcfc",
    400: "#fafafa",
    500: "#f8f8f8",
  },

  // Text Colors
  "text-primary": {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },

  // Status Colors
  "status-success": {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },

  "status-error": {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },

  "status-warning": {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },

  "status-info": {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },

  // Task Background Colors - Subtle and Modern
  "task-blue": {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
  },

  "task-purple": {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
  },

  "task-green": {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
  },

  "task-orange": {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
  },

  "task-pink": {
    50: "#fdf2f8",
    100: "#fce7f3",
    200: "#fbcfe8",
    300: "#f9a8d4",
    400: "#f472b6",
    500: "#ec4899",
  },

  "task-cyan": {
    50: "#ecfeff",
    100: "#cffafe",
    200: "#a5f3fc",
    300: "#67e8f9",
    400: "#22d3ee",
    500: "#06b6d4",
  },

  "task-gray": {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
  },

  // Focus Colors
  focus: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },

  // Gradients
  "gradient-primary": "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
  "gradient-secondary": "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
  "gradient-success": "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
  "gradient-warm": "linear-gradient(135deg, #fde68a 0%, #fce7f3 100%)",
  "gradient-cool": "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
  "gradient-sunset": "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
  "gradient-ocean": "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
  "gradient-forest": "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
  "gradient-lavender": "linear-gradient(135deg, #a855f7 0%, #c084fc 100%)",
  "gradient-rose": "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",

  // Additional modern gradients
  "gradient-midnight": "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
  "gradient-aurora": "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)",
  "gradient-coral": "linear-gradient(135deg, #fb7185 0%, #f97316 100%)",
  "gradient-mint": "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
  "gradient-violet": "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
  "gradient-gold": "linear-gradient(135deg, #f59e0b 0%, #eab308 100%)",
  "gradient-slate": "linear-gradient(135deg, #64748b 0%, #334155 100%)",
  "gradient-emerald": "linear-gradient(135deg, #059669 0%, #10b981 100%)",
  "gradient-sky": "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
  "gradient-fuchsia": "linear-gradient(135deg, #d946ef 0%, #ec4899 100%)",
};

// Modern Color Palette - Dark Mode
const darkColors = {
  // Primary Colors - Dark Blue/Indigo
  "pri-blue": {
    50: "#0c4a6e",
    100: "#075985",
    200: "#0369a1",
    300: "#0284c7",
    400: "#0ea5e9",
    500: "#38bdf8", // Main primary in dark
    600: "#7dd3fc",
    700: "#bae6fd",
    800: "#e0f2fe",
    900: "#f0f9ff",
  },

  // Secondary Colors - Dark Purple
  "sec-purple": {
    50: "#581c87",
    100: "#6b21a8",
    200: "#7c3aed",
    300: "#9333ea",
    400: "#a855f7",
    500: "#c084fc", // Main secondary in dark
    600: "#d8b4fe",
    700: "#e9d5ff",
    800: "#f3e8ff",
    900: "#faf5ff",
  },

  // Accent Colors - Dark Green
  "acc-green": {
    50: "#14532d",
    100: "#166534",
    200: "#15803d",
    300: "#16a34a",
    400: "#22c55e",
    500: "#4ade80", // Main accent in dark
    600: "#86efac",
    700: "#bbf7d0",
    800: "#dcfce7",
    900: "#f0fdf4",
  },

  // Neutral Colors - Dark Grays
  "neu-gray": {
    50: "#111827",
    100: "#1f2937",
    200: "#374151",
    300: "#4b5563",
    400: "#6b7280",
    500: "#9ca3af",
    600: "#d1d5db",
    700: "#e5e7eb",
    800: "#f3f4f6",
    900: "#f9fafb",
  },

  // Background Colors
  "bg-white": {
    50: "#0b0d11",
    100: "#0d1117",
    200: "#111827",
    300: "#1f2937",
    400: "#374151",
    500: "#4b5563",
  },

  // Text Colors
  "text-primary": {
    50: "#111827",
    100: "#1f2937",
    200: "#374151",
    300: "#4b5563",
    400: "#6b7280",
    500: "#9ca3af",
    600: "#d1d5db",
    700: "#e5e7eb",
    800: "#f3f4f6",
    900: "#f9fafb",
  },

  // Status Colors
  "status-success": {
    50: "#14532d",
    100: "#166534",
    200: "#15803d",
    300: "#16a34a",
    400: "#22c55e",
    500: "#4ade80",
    600: "#86efac",
    700: "#bbf7d0",
    800: "#dcfce7",
    900: "#f0fdf4",
  },

  "status-error": {
    50: "#7f1d1d",
    100: "#991b1b",
    200: "#b91c1c",
    300: "#dc2626",
    400: "#ef4444",
    500: "#f87171",
    600: "#fca5a5",
    700: "#fecaca",
    800: "#fee2e2",
    900: "#fef2f2",
  },

  "status-warning": {
    50: "#78350f",
    100: "#92400e",
    200: "#b45309",
    300: "#d97706",
    400: "#f59e0b",
    500: "#fbbf24",
    600: "#fcd34d",
    700: "#fde68a",
    800: "#fef3c7",
    900: "#fffbeb",
  },

  "status-info": {
    50: "#1e3a8a",
    100: "#1e40af",
    200: "#1d4ed8",
    300: "#2563eb",
    400: "#3b82f6",
    500: "#60a5fa",
    600: "#93c5fd",
    700: "#bfdbfe",
    800: "#dbeafe",
    900: "#eff6ff",
  },

  // Task Background Colors - Dark Mode
  "task-blue": {
    50: "#1e3a8a",
    100: "#1e40af",
    200: "#1d4ed8",
    300: "#2563eb",
    400: "#3b82f6",
    500: "#60a5fa",
  },

  "task-purple": {
    50: "#581c87",
    100: "#6b21a8",
    200: "#7c3aed",
    300: "#9333ea",
    400: "#a855f7",
    500: "#c084fc",
  },

  "task-green": {
    50: "#14532d",
    100: "#166534",
    200: "#15803d",
    300: "#16a34a",
    400: "#22c55e",
    500: "#4ade80",
  },

  "task-orange": {
    50: "#7c2d12",
    100: "#9a3412",
    200: "#c2410c",
    300: "#ea580c",
    400: "#f97316",
    500: "#fb923c",
  },

  "task-pink": {
    50: "#831843",
    100: "#9d174d",
    200: "#be185d",
    300: "#db2777",
    400: "#ec4899",
    500: "#f472b6",
  },

  "task-cyan": {
    50: "#164e63",
    100: "#155e75",
    200: "#0e7490",
    300: "#0891b2",
    400: "#06b6d4",
    500: "#22d3ee",
  },

  "task-gray": {
    50: "#111827",
    100: "#1f2937",
    200: "#374151",
    300: "#4b5563",
    400: "#6b7280",
    500: "#9ca3af",
  },

  // Focus Colors
  focus: {
    50: "#1e3a8a",
    100: "#1e40af",
    200: "#1d4ed8",
    300: "#2563eb",
    400: "#3b82f6",
    500: "#60a5fa",
    600: "#93c5fd",
    700: "#bfdbfe",
    800: "#dbeafe",
    900: "#eff6ff",
  },

  // Gradients
  "gradient-primary": "linear-gradient(135deg, #38bdf8 0%, #60a5fa 100%)",
  "gradient-secondary": "linear-gradient(135deg, #c084fc 0%, #f472b6 100%)",
  "gradient-success": "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
  "gradient-warm": "linear-gradient(135deg, #fdba74 0%, #f9a8d4 100%)",
  "gradient-cool": "linear-gradient(135deg, #22d3ee 0%, #60a5fa 100%)",
  "gradient-sunset": "linear-gradient(135deg, #fbbf24 0%, #f87171 100%)",
  "gradient-ocean": "linear-gradient(135deg, #38bdf8 0%, #22d3ee 100%)",
  "gradient-forest": "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
  "gradient-lavender": "linear-gradient(135deg, #c084fc 0%, #d8b4fe 100%)",
  "gradient-rose": "linear-gradient(135deg, #f472b6 0%, #f9a8d4 100%)",

  // Additional modern gradients
  "gradient-midnight": "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
  "gradient-aurora": "linear-gradient(135deg, #22d3ee 0%, #a855f7 100%)",
  "gradient-coral": "linear-gradient(135deg, #fb7185 0%, #fb923c 100%)",
  "gradient-mint": "linear-gradient(135deg, #10b981 0%, #22d3ee 100%)",
  "gradient-violet": "linear-gradient(135deg, #a855f7 0%, #f472b6 100%)",
  "gradient-gold": "linear-gradient(135deg, #fbbf24 0%, #eab308 100%)",
  "gradient-slate": "linear-gradient(135deg, #64748b 0%, #475569 100%)",
  "gradient-emerald": "linear-gradient(135deg, #059669 0%, #10b981 100%)",
  "gradient-sky": "linear-gradient(135deg, #38bdf8 0%, #22d3ee 100%)",
  "gradient-fuchsia": "linear-gradient(135deg, #d946ef 0%, #f472b6 100%)",
};

// Backward compatibility aliases for old color names
const lightColorsWithAliases = {
  ...lightColors,
  // Old color name mappings
  "pri-pur": lightColors["pri-blue"],
  "sec-rose": lightColors["task-pink"],
  "sec-pea": lightColors["task-orange"],
  "neu-whi": lightColors["bg-white"],
  "neu-gre": lightColors["neu-gray"],
  "neu-bla": lightColors["neu-gray"],
  "pri-focus": lightColors["focus"],
  "sup-suc": lightColors["status-success"],
  "sup-err": lightColors["status-error"],
  "sup-sys": lightColors["status-info"],
  "sup-war": lightColors["status-warning"],
  "task-sky": lightColors["task-blue"],
  "task-emerald": lightColors["task-green"],
  "task-amber": lightColors["task-orange"],
  "task-rose": lightColors["task-pink"],
  "task-lilac": lightColors["task-purple"],
  "task-stone": lightColors["task-gray"],
  "task-peach": lightColors["task-orange"],
  "task-mint": lightColors["task-green"],
  "task-steel": lightColors["task-gray"],
};

const darkColorsWithAliases = {
  ...darkColors,
  // Old color name mappings
  "pri-pur": darkColors["pri-blue"],
  "sec-rose": darkColors["task-pink"],
  "sec-pea": darkColors["task-orange"],
  "neu-whi": darkColors["bg-white"],
  "neu-gre": darkColors["neu-gray"],
  "neu-bla": darkColors["neu-gray"],
  "pri-focus": darkColors["focus"],
  "sup-suc": darkColors["status-success"],
  "sup-err": darkColors["status-error"],
  "sup-sys": darkColors["status-info"],
  "sup-war": darkColors["status-warning"],
  "task-sky": darkColors["task-blue"],
  "task-emerald": darkColors["task-green"],
  "task-amber": darkColors["task-orange"],
  "task-rose": darkColors["task-pink"],
  "task-lilac": darkColors["task-purple"],
  "task-stone": darkColors["task-gray"],
  "task-peach": darkColors["task-orange"],
  "task-mint": darkColors["task-green"],
  "task-steel": darkColors["task-gray"],
};

module.exports = {
  lightColors: lightColorsWithAliases,
  darkColors: darkColorsWithAliases,
};
