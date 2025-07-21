import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

const ThemeToggleButton = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  return (
    <button onClick={toggleDarkMode}>
      {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
    </button>
  );
};
export default ThemeToggleButton;
