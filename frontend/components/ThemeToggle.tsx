"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    setDark(isDark);
  }

  return (
    <button onClick={toggle} title="Toggle theme"
      className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}>
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
