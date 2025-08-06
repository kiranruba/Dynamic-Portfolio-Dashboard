// src/components/ThemeToggle.jsx
import { useTheme } from "@/context/ThemeContext";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-sm transition-all duration-300
             bg-blue-950 text-gray-300 hover:bg-gray-600 dark:bg-blue-300 dark:text-gray-800 dark:hover:bg-yellow-300"
>
      {theme === "light" ? "🌙 Dark Mode" : "🌞 Light Mode"}
    </button>
  );
};

export default ThemeToggle;
