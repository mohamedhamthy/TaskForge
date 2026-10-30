import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import IconButton from "./ui/IconButton";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("taskforge_theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    localStorage.setItem("taskforge_theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <IconButton
      className="h-[34px] w-[34px] shrink-0"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      onClick={() => setIsDark((current) => !current)}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </IconButton>
  );
}
