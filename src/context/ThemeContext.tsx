import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  console.log("ThemeProvider rendering");

  const [theme, setTheme] = useState<Theme>(() => {
    console.log("Initializing theme state");
    // Check if theme is stored in localStorage
    const savedTheme = localStorage.getItem("theme");
    console.log("Saved theme from localStorage:", savedTheme);

    // Check if user prefers dark mode
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    console.log("User prefers dark mode:", prefersDark);

    const initialTheme =
      (savedTheme as Theme) || (prefersDark ? "dark" : "light");
    console.log("Setting initial theme to:", initialTheme);
    return initialTheme;
  });

  // Apply theme on mount and when it changes
  useEffect(() => {
    console.log("Theme effect running, current theme:", theme);
    const root = document.documentElement;

    if (theme === "dark") {
      console.log("Adding dark class to html element");
      root.classList.add("dark");
    } else {
      console.log("Removing dark class from html element");
      root.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
    console.log("Theme saved to localStorage:", theme);
    console.log("Current HTML classes:", root.classList.toString());
  }, [theme]);

  const toggleTheme = () => {
    console.log("toggleTheme function called");
    console.log("Current theme before toggle:", theme);

    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      console.log("Setting new theme to:", newTheme);
      return newTheme;
    });
  };

  // Log theme changes
  useEffect(() => {
    console.log("Theme state updated to:", theme);
  }, [theme]);

  const value = {
    theme,
    toggleTheme,
  };

  console.log("ThemeProvider value:", value);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
