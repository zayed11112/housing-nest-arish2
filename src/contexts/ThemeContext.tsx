import React, { createContext, useContext, useState, useEffect } from "react";
// Removed unused imports: useSettings, polished

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme as Theme) || "light";
  });
  // Removed settings context usage

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Removed hexToHslString function

  useEffect(() => {
    localStorage.setItem("theme", theme);
    
    // تطبيق الكلاس على العنصر html
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Removed primary color application logic
  }, [theme]); // Removed settings dependencies

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
