import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const ThemeToggle = ({ light = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "8px",
        cursor: "pointer",
        border: "1.5px solid var(--border)",
        background: "var(--bg-primary)",
        color: light ? "#F1F5F9" : "var(--text-primary)",
        transition: "border-color 0.15s, background 0.15s",
        flexShrink: 0,
      }}
      onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; }}
      onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
};

export default ThemeToggle;
