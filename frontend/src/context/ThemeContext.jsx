import { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });

const getInitialTheme = () => {
  try {
    const stored = localStorage.getItem("rw-theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("rw-theme", theme); } catch {}
    // Notify map and other listeners that the theme changed.
    window.dispatchEvent(new CustomEvent("rw-themechange", { detail: { theme } }));
  }, [theme]);

  // Smooth colour change when switching theme, but no fade on the very first paint
  useEffect(() => {
    const id = requestAnimationFrame(() => document.documentElement.classList.add("rw-theme-ready"));
    return () => cancelAnimationFrame(id);
  }, []);

  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
